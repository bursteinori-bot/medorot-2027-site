/// <reference types="vite/client" />
// Development-only stand-in for the server functions (enabled with MOCK_API=1), so the browser side of a real
// submission (validation, signed uploads with progress, completion) and the admin screens can be exercised without
// a database. It validates submissions with the same schema as the real server and keeps everything in memory.
// The admin stubs return the same shapes as api/admin.ts (Hebrew `error` + language-neutral `code`); the mock user is
// signed in as an admin from the start (POST logout signs out, any password except "wrong" signs back in).
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { fieldCodes, fieldErrors, startSchema } from '../src/shared/application'
import { SEED } from '../src/content'
import { uiOverridesSchema } from '../src/shared/uiOverrides'

type App = { id: string; key: string; status: 'draft' | 'new'; files: { name: string; size: number }[]; received: Map<number, number> }

const readBody = (req: IncomingMessage) =>
  new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
const send = (res: ServerResponse, status: number, body?: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const fail = (res: ServerResponse, status: number, error: string, code: string) => send(res, status, { error, code })

// ───────────── admin fixtures ─────────────
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
const ME = { id: '00000000-0000-4000-8000-000000000001', email: 'team@medorot.local', display_name: 'צוות מדורות', role: 'admin', can_publish: true, canPublish: true }
type MockApp = {
  id: string; status: string; submitted_at: string; name: string; email: string; phone: string; age: number; city: string; identity: string; project: string; disciplines: string[]; location: string; stage: string
  answers: Record<string, unknown>; files: { position: number; original_name: string; size_bytes: number; mime_type: string }[]; notes: { id: string; body: string; created_at: string; author: string | null }[]
  history: { from_status: string | null; to_status: string; changed_at: string; by: string | null }[]; corrections: { field: string; old_value: unknown; new_value: unknown; reason: string; created_at: string; author: string | null }[]
}
const mk = (n: number, o: Partial<MockApp> & Pick<MockApp, 'name' | 'project'>): MockApp => {
  const base: MockApp = {
    id: `00000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`, status: 'new', submitted_at: ago(n * 20), email: `artist${n}@example.com`, phone: '050-0000000', age: 28 + n, city: 'ירושלים',
    identity: 'אמן.ית פעיל.ה', disciplines: ['מחול'], location: 'חלל בית הכנסת המרכזי', stage: 'רעיון ראשוני', answers: {}, files: [], notes: [], history: [], corrections: [], ...o,
  }
  base.answers = {
    bio: 'אמנית רב-תחומית מירושלים, עובדת עם תנועה וטקסט.', description: 'מיצג תנועה סביב האש והזיכרון, לאורך ערב אחד בחצר בית הכנסת.', jewish: 'הפרויקט נשען על מנהגי ל״ג בעומר ועל טקסטים מן הזוהר.',
    portfolio: 'https://example.com/portfolio', social: 'https://instagram.com/example', links: '', notes: '', ...o.answers,
  }
  base.history = [{ from_status: 'draft', to_status: 'new', changed_at: base.submitted_at, by: null }, ...(o.history ?? [])]
  return base
}
const apps: MockApp[] = [
  mk(1, { name: 'נועה לוי', project: 'גחלים', status: 'in_review', disciplines: ['מחול', 'פרפורמנס'], files: [{ position: 0, original_name: 'sketch.pdf', size_bytes: 820_000, mime_type: 'application/pdf' }],
    notes: [{ id: 'n1', body: 'מעניין מאוד, לבדוק זמינות של החצר.', created_at: ago(5), author: 'צוות מדורות' }], history: [{ from_status: 'new', to_status: 'in_review', changed_at: ago(6), by: 'צוות מדורות' }],
    corrections: [{ field: 'email', old_value: 'noa@exmaple.com', new_value: 'noa@example.com', reason: 'המגישה ביקשה בטלפון', created_at: ago(4), author: 'צוות מדורות' }] }),
  mk(2, { name: 'Daniel Cohen', project: 'Ember Choir', disciplines: ['מוזיקה / סאונד'], location: 'פטיו', stage: 'עבודה קיימת', identity: 'קולקטיב / קבוצה', city: 'Tel Aviv',
    answers: { bio: 'A sound collective from Tel Aviv.', description: 'A choir of found objects and fire.', jewish: 'Based on piyyutim sung around bonfires.' } }),
  mk(3, { name: 'מאיה ברק', project: 'שבעה קנים', status: 'shortlisted', disciplines: ['אמנות פלסטית', 'אחר: קרמיקה'], location: 'גלריה 1/2', stage: 'בתהליך פיתוח' }),
  mk(4, { name: 'יואב שחר', project: 'הד', status: 'needs_info', disciplines: ['וידאו / קולנוע'], location: 'פתוח להצעות', identity: 'סטודנט.ית' }),
]
const listRow = (a: MockApp) => {
  const { answers: _a, history: _h, corrections: _c, files, notes, ...rest } = a // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, files: files.length, notes: notes.length }
}

type Version = { id: string; status: 'draft' | 'published' | 'archived'; note: string | null; created_at: string; published_at: string | null; author: string | null; content: unknown }
const versions: Version[] = [
  { id: randomUUID(), status: 'published', note: null, created_at: ago(30), published_at: ago(30), author: 'צוות מדורות', content: { ...SEED, en: { home: { ctaPrimary: 'Send us a proposal' } } } },
  { id: randomUUID(), status: 'archived', note: null, created_at: ago(80), published_at: ago(80), author: 'צוות מדורות', content: SEED },
]
const users = [
  { id: ME.id, email: ME.email, display_name: ME.display_name, role: 'admin', can_publish: true, created_at: ago(500), last_login_at: ago(1), pending: false },
  { id: '00000000-0000-4000-8000-000000000002', email: 'editor@example.com', display_name: 'Tamar', role: 'editor', can_publish: false, created_at: ago(300), last_login_at: ago(50), pending: false },
  { id: '00000000-0000-4000-8000-000000000003', email: 'new@example.com', display_name: null, role: 'reviewer', can_publish: false, created_at: ago(10), last_login_at: null, pending: true },
]
const analytics = (days: number) => ({
  days,
  totals: { pageviews: 1840, sessions: 612, visitor_days: 540 },
  daily: Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400_000)
    const v = Math.round(10 + 8 * Math.sin(i / 3) + i / 2)
    return { day: d.toISOString().slice(0, 10), visitors: v, pageviews: v * 3 }
  }),
  sections: [{ name: 'home', views: 900, sessions: 500 }, { name: 'open-call', views: 420, sessions: 260 }, { name: 'apply', views: 300, sessions: 180 }, { name: 'support', views: 90, sessions: 70 }],
  referrers: [{ host: '', sessions: 300 }, { host: 'l.instagram.com', sessions: 200 }, { host: 'www.google.com', sessions: 60 }, { host: 'example.org', sessions: 12 }],
  devices: [{ device: 'mobile', sessions: 420 }, { device: 'desktop', sessions: 170 }, { device: 'tablet', sessions: 22 }],
  countries: [{ country: 'IL', sessions: 560 }, { country: 'US', sessions: 40 }],
  cities: [],
  funnel: { viewed: 180, s1: 90, s2: 60, s3: 45, s4: 40, submitted: 32 },
  events: [{ name: 'donation_click', n: 14 }, { name: 'donation_amount', n: 6 }, { name: 'photo_open', n: 80 }, { name: 'form_submitted', n: 32 }, { name: 'outbound', n: 25 }],
  live: [{ session: 's1', name: 'apply', device: 'mobile', country: 'IL', city: null, at: ago(0.02) }, { session: 's2', name: 'home', device: 'desktop', country: 'IL', city: null, at: ago(0.03) }],
  recent: [{ at: ago(0.02), name: 'apply', device: 'mobile', country: 'IL', city: null, referrer_host: 'l.instagram.com' }, { at: ago(0.5), name: 'home', device: 'desktop', country: 'US', city: null, referrer_host: null }],
})
const media = new Map<string, { type: string; data: Buffer }>()

export function mockApi(): Plugin {
  const submissions = new Map<string, App>()
  let signedIn = true
  return {
    name: 'medorot-mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (url === '/api/applications/status') return send(res, 200, { open: true })
        // like api/content.ts: the published version (so what is published in the mock admin shows on the site)
        if (url === '/api/content') {
          const pub = versions.find((v) => v.status === 'published')
          return pub ? send(res, 200, { content: pub.content, publishedAt: pub.published_at }) : send(res, 204)
        }
        if (url === '/api/applications/start' && req.method === 'POST') {
          const parsed = startSchema.safeParse(JSON.parse((await readBody(req)).toString() || 'null'))
          if (!parsed.success) return send(res, 400, { error: 'יש שדות שצריך לתקן לפני השליחה.', code: 'invalid', fields: fieldErrors(parsed.error), fieldCodes: fieldCodes(parsed.error) })
          const { key, files, website } = parsed.data
          if (website) return send(res, 400, { error: 'לא הצלחנו לקבל את ההגשה. נסו שוב בעוד רגע.', code: 'rejected' })
          const found = [...submissions.values()].find((a) => a.key === key)
          if (found?.status === 'new') return send(res, 200, { id: found.id, uploads: [], alreadySubmitted: true })
          const app: App = found ?? { id: key, key, status: 'draft', files: [], received: new Map() } // like the real server: id = key
          app.files = files.map((f) => ({ name: f.name, size: f.size }))
          app.received = new Map()
          submissions.set(app.id, app)
          console.log('[mock] start', app.id, files.length, 'files')
          return send(res, 200, { id: app.id, uploads: files.map((_, i) => ({ index: i, url: `/__mock_upload/${app.id}/${i}` })) })
        }
        const up = url.match(/^\/__mock_upload\/([\w-]+)\/(\d+)$/)
        if (up && req.method === 'PUT') {
          const app = submissions.get(up[1])
          if (!app) return send(res, 404)
          app.received.set(Number(up[2]), (await readBody(req)).length)
          return send(res, 200, {})
        }
        if (url === '/api/applications/complete' && req.method === 'POST') {
          const { key, id } = JSON.parse((await readBody(req)).toString() || '{}')
          const app = submissions.get(id)
          if (!app || app.key !== key) return send(res, 404, { error: 'לא מצאנו את ההגשה. נסו לשלוח שוב.', code: 'notFound' })
          const missing = app.files.filter((f, i) => app.received.get(i) !== f.size)
          if (missing.length) return send(res, 400, { error: `הקבצים האלה לא הגיעו במלואם: ${missing.map((f) => f.name).join(', ')}.`, code: 'filesMissing', detail: missing.map((f) => f.name).join(', ') })
          app.status = 'new'
          console.log('[mock] complete', id)
          return send(res, 200, { ok: true, id })
        }
        if (url === '/__mock/applications') return send(res, 200, [...submissions.values()].map((a) => ({ id: a.id, status: a.status, files: a.files, received: [...a.received.entries()] })))

        // ───────────── admin (/api/admin?route=…) ─────────────
        if (url.startsWith('/api/media?')) {
          const m = media.get(new URL(url, 'http://x').searchParams.get('id') ?? '')
          if (!m) return send(res, 404)
          res.setHeader('content-type', m.type)
          return res.end(m.data)
        }
        if (!url.startsWith('/api/admin?')) return next()
        const q = new URL(url, 'http://x').searchParams
        const route = q.get('route') ?? ''
        const post = req.method === 'POST'
        const raw = post ? await readBody(req) : Buffer.alloc(0)
        const body = post && route !== 'media' ? JSON.parse(raw.toString() || '{}') : {}
        if (post && req.headers['x-medorot'] !== '1') return fail(res, 400, 'בקשה לא תקינה.', 'badRequest')
        if (route === 'setup-status') return send(res, 200, { needsSetup: false })
        if (route === 'login' && post) {
          if (!body.password) return fail(res, 400, 'כתבו את הסיסמה.', 'passwordMissing')
          if (body.password === 'wrong') return body.email ? fail(res, 401, 'האימייל או הסיסמה לא נכונים.', 'wrongCredentials') : fail(res, 401, 'הסיסמה לא נכונה.', 'wrongPassword')
          signedIn = true
          return send(res, 200, { ok: true })
        }
        if (route === 'accept-invite' && post) {
          if (body.token !== 'valid-mock-token-0000000000') return fail(res, 400, 'קישור ההזמנה לא תקף או שפג תוקפו. בקשו הזמנה חדשה.', 'inviteInvalid')
          signedIn = true
          return send(res, 200, { ok: true })
        }
        if (!signedIn) return fail(res, 401, 'צריך להתחבר.', 'signInRequired')
        const find = (id: unknown) => apps.find((a) => a.id === id)
        switch (`${post ? 'POST' : 'GET'} ${route}`) {
          case 'GET me':
            return send(res, 200, ME)
          case 'POST logout':
            signedIn = false
            return send(res, 200, { ok: true })
          case 'GET stats': {
            const counts: Record<string, number> = {}
            apps.forEach((a) => (counts[a.status] = (counts[a.status] ?? 0) + 1))
            const recent = [...apps].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).map((a) => ({ id: a.id, name: a.name, project: a.project, disciplines: a.disciplines, status: a.status, submitted_at: a.submitted_at }))
            return send(res, 200, { counts, recent })
          }
          case 'GET applications':
            return send(res, 200, { applications: apps.map(listRow) })
          case 'GET application': {
            const a = find(q.get('id'))
            if (!a) return fail(res, 404, 'ההגשה לא נמצאה.', 'applicationNotFound')
            const { files, notes, history, corrections, ...application } = a
            return send(res, 200, { application: { ...application, notification_error: null }, files, notes, history, corrections })
          }
          case 'GET file':
            return fail(res, 404, 'הקובץ לא נמצא.', 'fileNotFound')
          case 'GET export': {
            const en = q.get('lang') === 'en'
            res.setHeader('content-type', 'text/csv; charset=utf-8')
            res.setHeader('content-disposition', `attachment; filename="medorot-applications-mock${en ? '-en' : ''}.csv"`)
            return res.end('﻿' + [en ? 'ID,Status,Full name,Project name' : 'מזהה,סטטוס,שם מלא,שם הפרויקט', ...apps.map((a) => [a.id, a.status, a.name, a.project].join(','))].join('\r\n'))
          }
          case 'POST status': {
            const a = find(body.id)
            if (!a) return fail(res, 404, 'ההגשה לא נמצאה.', 'applicationNotFound')
            a.history.push({ from_status: a.status, to_status: body.status, changed_at: new Date().toISOString(), by: ME.display_name })
            a.status = body.status
            return send(res, 200, { ok: true })
          }
          case 'POST note': {
            const a = find(body.id)
            if (!String(body.body ?? '').trim()) return fail(res, 400, 'ההערה ריקה.', 'emptyNote')
            a?.notes.push({ id: randomUUID(), body: body.body, created_at: new Date().toISOString(), author: ME.display_name })
            return send(res, 200, { ok: true })
          }
          case 'POST correction': {
            const a = find(body.id)
            if (!a) return fail(res, 404, 'ההגשה לא נמצאה.', 'applicationNotFound')
            if (!String(body.reason ?? '').trim()) return fail(res, 400, 'חסרים שדה, ערך או סיבה לתיקון.', 'correctionIncomplete')
            a.corrections.push({ field: body.field, old_value: a.answers[body.field] ?? (a as unknown as Record<string, unknown>)[body.field] ?? null, new_value: body.value, reason: body.reason, created_at: new Date().toISOString(), author: ME.display_name })
            return send(res, 200, { ok: true })
          }
          case 'POST change-password':
            if (String(body.next ?? '').length < 10) return fail(res, 400, 'הסיסמה החדשה צריכה להיות באורך 10 תווים לפחות.', 'newPasswordTooShort')
            if (body.current === 'wrong') return fail(res, 400, 'הסיסמה הנוכחית לא נכונה.', 'wrongCurrentPassword')
            return send(res, 200, { ok: true })
          case 'GET analytics':
            return send(res, 200, analytics(Math.min(365, Math.max(1, Number(q.get('days')) || 30))))
          case 'GET content': {
            const cur = versions.find((v) => v.status === 'draft') ?? versions.find((v) => v.status === 'published')
            return send(res, 200, { current: cur ? { id: cur.id, content: cur.content, status: cur.status } : { id: null, content: SEED, status: 'seed' }, versions: versions.map(({ content: _c, ...v }) => v) }) // eslint-disable-line @typescript-eslint/no-unused-vars
          }
          case 'GET preview': {
            const v = versions.find((x) => x.id === q.get('id'))
            return v ? send(res, 200, { content: v.content }) : fail(res, 404, 'הגרסה לא נמצאה.', 'versionNotFound')
          }
          case 'POST content-save': {
            if (!body.content || typeof body.content !== 'object') return fail(res, 400, 'התוכן לא תקין.', 'invalidContent')
            const ui = (body.content as { ui?: unknown }).ui
            if (ui !== undefined && !uiOverridesSchema.safeParse(ui).success) return fail(res, 400, 'התוכן לא תקין.', 'invalidContent')
            const d = versions.find((v) => v.id === body.id && v.status === 'draft')
            if (d) d.content = body.content
            else versions.unshift({ id: randomUUID(), status: 'draft', note: null, created_at: new Date().toISOString(), published_at: null, author: ME.display_name, content: body.content })
            console.log('[mock] content-save en =', JSON.stringify((body.content as { en?: unknown }).en ?? null), 'ui =', JSON.stringify(ui ?? null))
            return send(res, 200, { id: (d ?? versions[0]).id })
          }
          case 'POST content-publish': {
            const v = versions.find((x) => x.id === body.id)
            if (!v) return fail(res, 404, 'הגרסה לא נמצאה.', 'versionNotFound')
            versions.forEach((x) => x.status === 'published' && (x.status = 'archived'))
            v.status = 'published'
            v.published_at = new Date().toISOString()
            return send(res, 200, { ok: true })
          }
          case 'POST content-restore': {
            const v = versions.find((x) => x.id === body.id)
            if (!v) return fail(res, 404, 'הגרסה לא נמצאה.', 'versionNotFound')
            for (let i = versions.length - 1; i >= 0; i--) if (versions[i].status === 'draft') versions.splice(i, 1)
            versions.unshift({ id: randomUUID(), status: 'draft', note: 'שוחזר מגרסה קודמת', created_at: new Date().toISOString(), published_at: null, author: ME.display_name, content: v.content })
            return send(res, 200, { id: versions[0].id })
          }
          case 'POST media': {
            const type = String(req.headers['content-type'] ?? '').split(';')[0]
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return fail(res, 400, 'אפשר להעלות רק JPG, PNG או WEBP.', 'imageType')
            if (raw.length > 4 * 1024 * 1024) return fail(res, 413, 'התמונה גדולה מ-4MB.', 'imageTooLarge')
            const id = randomUUID()
            media.set(id, { type, data: raw })
            return send(res, 200, { id, src: `/api/media?id=${id}` })
          }
          case 'GET users':
            return send(res, 200, { users })
          case 'POST invite':
            if (!/^\S+@\S+\.\S+$/.test(String(body.email ?? ''))) return fail(res, 400, 'כתבו אימייל תקין ובחרו תפקיד.', 'invalidInvite')
            if (users.some((u) => u.email === body.email && !u.pending)) return fail(res, 409, 'למשתמש.ת הזה.ו כבר יש גישה.', 'userExists')
            users.push({ id: randomUUID(), email: body.email, display_name: null, role: body.role, can_publish: !!body.canPublish, created_at: new Date().toISOString(), last_login_at: null, pending: true })
            return send(res, 200, { link: `http://localhost:5274/admin/accept?token=valid-mock-token-0000000000` })
          case 'POST user-update': {
            if (body.id === ME.id && body.role !== 'admin') return fail(res, 400, 'אי אפשר להוריד לעצמך את הרשאת המנהל.ת.', 'cannotDemoteSelf')
            const u = users.find((x) => x.id === body.id)
            if (u) Object.assign(u, { role: body.role, can_publish: body.canPublish })
            return send(res, 200, { ok: true })
          }
          case 'POST user-remove': {
            if (body.id === ME.id) return fail(res, 400, 'אי אפשר להסיר את עצמך.', 'cannotRemoveSelf')
            const i = users.findIndex((x) => x.id === body.id)
            if (i >= 0) users.splice(i, 1)
            return send(res, 200, { ok: true })
          }
          default:
            return fail(res, 404, 'לא נמצא.', 'notFound')
        }
      })
    },
  }
}
