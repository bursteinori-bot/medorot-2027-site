// The admin API: one function, routed by ?route=. Every route except login/invite acceptance needs a signed-in admin,
// and each checks the admin's role. Writes require a JSON body plus the x-medorot header (a cross-site form can't
// send either), on top of the SameSite session cookie.
import { z } from 'zod'
import { SEED } from '../src/content.js'
import { uiOverridesSchema } from '../src/shared/uiOverrides.js'
import { type Admin, type Role, canPublish, currentAdmin, endSession, hasRole, hashPassword, newToken, startSession, verifyPassword } from './_lib/auth.js'
import { fail, ipHash, isUuid, json, sql } from './_lib/server.js'

const STATUSES = ['new', 'in_review', 'shortlisted', 'accepted', 'rejected', 'needs_info'] as const
const ROLES = ['admin', 'editor', 'reviewer'] as const
const LOGIN_LIMIT = 8 // failed attempts per IP per 15 minutes

type Ctx = { req: Request; url: URL; admin: Admin | null; body: unknown }
type Handler = (c: Ctx & { admin: Admin }) => Promise<Response>

const forbidden = () => fail(403, 'אין לך הרשאה לפעולה הזו.', undefined, { code: 'forbidden' })
const need = (roles: Role[], h: Handler): Handler => (c) => (hasRole(c.admin, roles) ? h(c) : Promise.resolve(forbidden()))
const parse = <T>(schema: z.ZodType<T>, body: unknown): T | null => {
  const r = schema.safeParse(body)
  return r.success ? r.data : null
}

// ───────────── public (no session) ─────────────
// The team signs in with one shared team password (the built-in "team" account). Personal accounts by invite
// still work (email + password) for anyone who needs their own login.
const TEAM_EMAIL = 'team@medorot.local'

const setupStatus = async () => {
  const [r] = await sql()`select exists (select 1 from admin_users where password_hash is not null) as ready`
  return json({ needsSetup: !r.ready })
}

// first run only: whoever opens /admin before any password exists sets the team password
async function setup({ body }: Ctx) {
  const d = parse(z.object({ password: z.string().min(10).max(200) }), body)
  if (!d) return fail(400, 'הסיסמה צריכה להיות באורך 10 תווים לפחות.', undefined, { code: 'passwordTooShort' })
  const db = sql()
  const hash = await hashPassword(d.password)
  const [u] = await db`insert into admin_users (email, display_name, role, can_publish, password_hash)
                       select ${TEAM_EMAIL}, 'צוות מדורות', 'admin', true, ${hash}
                       where not exists (select 1 from admin_users where password_hash is not null)
                       on conflict (email) do nothing returning id`
  if (!u) return fail(409, 'סיסמת הצוות כבר נקבעה. היכנסו איתה.', undefined, { code: 'teamPasswordSet' })
  return json({ ok: true }, 200, { 'set-cookie': await startSession(u.id) })
}

async function login({ req, body }: Ctx) {
  const d = parse(z.object({ email: z.string().email().max(200).optional().or(z.literal('')), password: z.string().min(1).max(200) }), body)
  if (!d) return fail(400, 'כתבו את הסיסמה.', undefined, { code: 'passwordMissing' })
  const db = sql()
  const key = `login:${ipHash(req)}`
  const [{ n }] = await db`select count(*)::int as n from submission_attempts where ip_hash = ${key} and created_at > now() - interval '15 minutes'`
  if (n >= LOGIN_LIMIT) return fail(429, 'יותר מדי ניסיונות כניסה. נסו שוב בעוד רבע שעה.', undefined, { code: 'tooManyAttempts' })
  const [u] = await db`select id, password_hash from admin_users where lower(email) = lower(${d.email || TEAM_EMAIL})`
  if (!u || !(await verifyPassword(d.password, u.password_hash))) {
    await db`insert into submission_attempts (ip_hash) values (${key})`
    return d.email ? fail(401, 'האימייל או הסיסמה לא נכונים.', undefined, { code: 'wrongCredentials' }) : fail(401, 'הסיסמה לא נכונה.', undefined, { code: 'wrongPassword' })
  }
  return json({ ok: true }, 200, { 'set-cookie': await startSession(u.id) })
}

const changePassword: Handler = async ({ admin, body }) => {
  const d = parse(z.object({ current: z.string().min(1).max(200), next: z.string().min(10).max(200) }), body)
  if (!d) return fail(400, 'הסיסמה החדשה צריכה להיות באורך 10 תווים לפחות.', undefined, { code: 'newPasswordTooShort' })
  const db = sql()
  const [u] = await db`select password_hash from admin_users where id = ${admin.id}`
  if (!(await verifyPassword(d.current, u?.password_hash ?? null))) return fail(400, 'הסיסמה הנוכחית לא נכונה.', undefined, { code: 'wrongCurrentPassword' })
  await db`update admin_users set password_hash = ${await hashPassword(d.next)} where id = ${admin.id}`
  // sign out every other device that used the old password
  await db`delete from admin_sessions where user_id = ${admin.id} and created_at < now() - interval '1 second'`
  return json({ ok: true })
}

// ───────────── usage statistics (anonymous) ─────────────
const analytics: Handler = async ({ url }) => {
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30))
  const since = `${days} days`
  const db = sql()
  const [totals, daily, sections, referrers, devices, countries, cities, funnel, events, live, recent] = await Promise.all([
    db`select count(*) filter (where type = 'pageview')::int as pageviews, count(distinct session)::int as sessions,
              count(distinct visitor || to_char(at, 'YYYY-MM-DD'))::int as visitor_days
       from analytics_events where at > now() - ${since}::interval`,
    db`select to_char(d, 'YYYY-MM-DD') as day,
              (select count(*) from analytics_events e where e.type = 'pageview' and e.at >= d and e.at < d + interval '1 day')::int as pageviews,
              (select count(distinct visitor) from analytics_events e where e.at >= d and e.at < d + interval '1 day')::int as visitors
       from generate_series(date_trunc('day', now() - ${`${days - 1} days`}::interval), date_trunc('day', now()), interval '1 day') d order by d`,
    db`select name, count(*)::int as views, count(distinct session)::int as sessions from analytics_events where type = 'pageview' and at > now() - ${since}::interval group by name order by views desc`,
    db`select coalesce(referrer_host, '') as host, count(distinct session)::int as sessions from analytics_events where type = 'pageview' and at > now() - ${since}::interval group by 1 order by sessions desc limit 12`,
    db`select device, count(distinct session)::int as sessions from analytics_events where at > now() - ${since}::interval group by device order by sessions desc`,
    db`select coalesce(country, '') as country, count(distinct session)::int as sessions from analytics_events where at > now() - ${since}::interval group by 1 order by sessions desc limit 10`,
    db`select coalesce(city, '') as city, count(distinct session)::int as sessions from analytics_events where at > now() - ${since}::interval and city is not null group by 1 order by sessions desc limit 10`,
    db`select
         count(distinct session) filter (where type = 'pageview' and name = 'apply')::int as viewed,
         count(distinct session) filter (where name = 'form_step' and props->>'step' = '1')::int as s1,
         count(distinct session) filter (where name = 'form_step' and props->>'step' = '2')::int as s2,
         count(distinct session) filter (where name = 'form_step' and props->>'step' = '3')::int as s3,
         count(distinct session) filter (where name = 'form_step' and props->>'step' = '4')::int as s4,
         count(distinct session) filter (where name = 'form_submitted')::int as submitted
       from analytics_events where at > now() - ${since}::interval`,
    db`select name, count(*)::int as n from analytics_events where type = 'event' and name not in ('form_step') and at > now() - ${since}::interval group by name`,
    db`select distinct on (session) session, name, device, country, city, at from analytics_events
       where type = 'pageview' and at > now() - interval '5 minutes' order by session, at desc`,
    db`select at, name, device, country, city, referrer_host from analytics_events where type = 'pageview' order by at desc limit 40`,
  ])
  return json({ days, totals: totals[0], daily, sections, referrers, devices, countries, cities, funnel: funnel[0], events, live, recent })
}

async function acceptInvite({ body }: Ctx) {
  const d = parse(z.object({ token: z.string().min(20).max(100), password: z.string().min(10, 'הסיסמה צריכה להיות באורך 10 תווים לפחות').max(200), displayName: z.string().trim().max(80).optional() }), body)
  if (!d) return fail(400, 'הסיסמה צריכה להיות באורך 10 תווים לפחות.', undefined, { code: 'passwordTooShort' })
  const [u] = await sql()`update admin_users set password_hash = ${await hashPassword(d.password)}, invite_token = null, display_name = coalesce(nullif(${d.displayName ?? ''}, ''), display_name)
                          where invite_token = ${d.token} and created_at > now() - interval '14 days' returning id`
  if (!u) return fail(400, 'קישור ההזמנה לא תקף או שפג תוקפו. בקשו הזמנה חדשה.', undefined, { code: 'inviteInvalid' })
  return json({ ok: true }, 200, { 'set-cookie': await startSession(u.id) })
}

// ───────────── session ─────────────
const me: Handler = async ({ admin }) => json({ ...admin, canPublish: canPublish(admin) })
const logout: Handler = async ({ req }) => json({ ok: true }, 200, { 'set-cookie': await endSession(req) })

// ───────────── applications ─────────────
const stats = need(['admin', 'reviewer'], async () => {
  const db = sql()
  const counts = await db`select status, count(*)::int as n from applications where status <> 'draft' group by status`
  const recent = await db`select id, name, project, disciplines, status, submitted_at from applications where status <> 'draft' order by submitted_at desc limit 8`
  return json({ counts: Object.fromEntries(counts.map((r) => [r.status, r.n])), recent })
})

const list = need(['admin', 'reviewer'], async () => {
  const rows = await sql()`
    select a.id, a.name, a.email, a.phone, a.project, a.disciplines, a.location, a.stage, a.identity, a.city, a.age, a.status, a.submitted_at,
           (select count(*)::int from application_files f where f.application_id = a.id) as files,
           (select count(*)::int from application_notes n where n.application_id = a.id) as notes
    from applications a where a.status <> 'draft' order by a.submitted_at desc`
  return json({ applications: rows })
})

const detail = need(['admin', 'reviewer'], async ({ url }) => {
  const id = url.searchParams.get('id')
  if (!isUuid(id)) return fail(400, 'מזהה לא תקין.', undefined, { code: 'invalidId' })
  const db = sql()
  const [app] = await db`select * from applications where id = ${id} and status <> 'draft'`
  if (!app) return fail(404, 'ההגשה לא נמצאה.', undefined, { code: 'applicationNotFound' })
  const [files, notes, history, corrections] = await Promise.all([
    db`select position, original_name, size_bytes, mime_type from application_files where application_id = ${id} order by position`,
    db`select n.id, n.body, n.created_at, coalesce(u.display_name, u.email) as author from application_notes n left join admin_users u on u.id = n.author_id where n.application_id = ${id} order by n.created_at`,
    db`select h.from_status, h.to_status, h.changed_at, coalesce(u.display_name, u.email) as by from application_status_history h left join admin_users u on u.id = h.changed_by where h.application_id = ${id} order by h.changed_at`,
    db`select c.field, c.old_value, c.new_value, c.reason, c.created_at, coalesce(u.display_name, u.email) as author from application_corrections c left join admin_users u on u.id = c.author_id where c.application_id = ${id} order by c.created_at`,
  ])
  delete app.ip_hash
  return json({ application: app, files, notes, history, corrections })
})

const file = need(['admin', 'reviewer'], async ({ url }) => {
  const id = url.searchParams.get('id')
  const n = Number(url.searchParams.get('n'))
  if (!isUuid(id) || !Number.isInteger(n)) return fail(400, 'בקשה לא תקינה.', undefined, { code: 'badRequest' })
  const [f] = await sql()`select original_name, mime_type, data from application_files where application_id = ${id} and position = ${n} and data is not null`
  if (!f) return fail(404, 'הקובץ לא נמצא.', undefined, { code: 'fileNotFound' })
  const name = encodeURIComponent(f.original_name)
  const download = url.searchParams.has('download')
  return new Response(f.data as Buffer, {
    headers: {
      'content-type': f.mime_type || 'application/octet-stream',
      'content-disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${name}`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  })
})

const setStatus = need(['admin', 'reviewer'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }), body)
  if (!d) return fail(400, 'סטטוס לא תקין.', undefined, { code: 'invalidStatus' })
  const db = sql()
  const [, rows] = await db.transaction((tx) => [
    tx`select set_config('app.admin_id', ${admin.id}, true)`,
    tx`update applications set status = ${d.status} where id = ${d.id} and status <> 'draft' returning id`,
  ])
  return (rows as unknown[]).length ? json({ ok: true }) : fail(404, 'ההגשה לא נמצאה.', undefined, { code: 'applicationNotFound' })
})

const addNote = need(['admin', 'reviewer'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid(), body: z.string().trim().min(1).max(10000) }), body)
  if (!d) return fail(400, 'ההערה ריקה.', undefined, { code: 'emptyNote' })
  await sql()`insert into application_notes (application_id, author_id, body) values (${d.id}, ${admin.id}, ${d.body})`
  return json({ ok: true })
})

const addCorrection = need(['admin', 'reviewer'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid(), field: z.string().min(1).max(60), value: z.string().max(10000), reason: z.string().trim().min(1, 'כתבו סיבה').max(1000) }), body)
  if (!d) return fail(400, 'חסרים שדה, ערך או סיבה לתיקון.', undefined, { code: 'correctionIncomplete' })
  const db = sql()
  const [app] = await db`select answers from applications where id = ${d.id}`
  if (!app) return fail(404, 'ההגשה לא נמצאה.', undefined, { code: 'applicationNotFound' })
  const old = (app.answers as Record<string, unknown>)[d.field] ?? null
  await db`insert into application_corrections (application_id, field, old_value, new_value, reason, author_id)
           values (${d.id}, ${d.field}, ${JSON.stringify(old)}::jsonb, ${JSON.stringify(d.value)}::jsonb, ${d.reason}, ${admin.id})`
  return json({ ok: true })
})

const STATUS_HE: Record<string, string> = { new: 'חדשה', in_review: 'בבדיקה', shortlisted: 'מועמדת להמשך', accepted: 'התקבלה', rejected: 'נדחתה', needs_info: 'נדרשת השלמת מידע' }
const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join(' | ') : v instanceof Date ? v.toISOString() : v == null ? '' : String(v)
  // neutralise spreadsheet formulas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}
// ?lang=en (offered in the English admin): English column headers and status names. Answers stay exactly as submitted.
// Without it the export is the Hebrew one it has always been.
const STATUS_EN: Record<string, string> = { new: 'New', in_review: 'In review', shortlisted: 'Shortlisted', accepted: 'Accepted', rejected: 'Rejected', needs_info: 'Needs more information' }
const exportCsv = need(['admin', 'reviewer'], async ({ url }) => {
  const en = url.searchParams.get('lang') === 'en'
  const rows = await sql()`
    select a.*, (select count(*)::int from application_files f where f.application_id = a.id) as file_count,
           (select string_agg(n.body, ' || ' order by n.created_at) from application_notes n where n.application_id = a.id) as internal_notes
    from applications a where a.status <> 'draft' order by a.submitted_at`
  const cols: [string, string, (r: Record<string, unknown>) => unknown][] = [
    ['מזהה', 'ID', (r) => r.id], ['הוגשה', 'Submitted', (r) => r.submitted_at], ['סטטוס', 'Status', (r) => (en ? STATUS_EN : STATUS_HE)[r.status as string]], ['שם מלא', 'Full name', (r) => r.name], ['אימייל', 'Email', (r) => r.email],
    ['טלפון', 'Phone', (r) => r.phone], ['גיל', 'Age', (r) => r.age], ['מקום מגורים', 'Place of residence', (r) => r.city], ['הגדרה עצמית', 'Self-description', (r) => r.identity], ['שם הפרויקט', 'Project name', (r) => r.project],
    ['תחומים', 'Disciplines', (r) => r.disciplines], ['מיקום מבוקש', 'Requested location', (r) => r.location], ['שלב', 'Stage', (r) => r.stage],
    ['ספרו על עצמכם', 'About the applicant', (r) => (r.answers as Record<string, unknown>).bio], ['תיאור הפרויקט', 'Project description', (r) => (r.answers as Record<string, unknown>).description],
    ['הקשר לעולם היהודי', 'Connection to the Jewish world', (r) => (r.answers as Record<string, unknown>).jewish], ['תיק עבודות', 'Portfolio', (r) => (r.answers as Record<string, unknown>).portfolio], ['אינסטגרם / אתר', 'Instagram / website', (r) => (r.answers as Record<string, unknown>).social],
    ['קישורים', 'Links', (r) => (r.answers as Record<string, unknown>).links], ['הערות המגיש', 'Applicant notes', (r) => (r.answers as Record<string, unknown>).notes],
    ['קבצים', 'Files', (r) => r.file_count], ['הערות פנימיות', 'Internal notes', (r) => r.internal_notes],
  ]
  const lines = [cols.map(([he, eng]) => csvCell(en ? eng : he)).join(','), ...rows.map((r) => cols.map(([, , f]) => csvCell(f(r))).join(','))]
  const date = new Date().toISOString().slice(0, 10)
  return new Response('﻿' + lines.join('\r\n'), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="medorot-applications-${date}${en ? '-en' : ''}.csv"`, 'cache-control': 'no-store' },
  })
})

// ───────────── content (CMS) ─────────────
const contentState = need(['admin', 'editor'], async ({ url }) => {
  const db = sql()
  const id = url.searchParams.get('id')
  const versions = await db`select v.id, v.status, v.note, v.created_at, v.published_at, coalesce(u.display_name, u.email) as author
                            from site_content_versions v left join admin_users u on u.id = coalesce(v.published_by, v.created_by) order by v.created_at desc limit 50`
  const [row] = isUuid(id)
    ? await db`select id, content, status from site_content_versions where id = ${id}`
    : await db`select id, content, status from site_content_versions where status in ('draft', 'published') order by (status = 'draft') desc, created_at desc limit 1`
  return json({ current: row ?? { id: null, content: SEED, status: 'seed' }, versions })
})

const contentSave = need(['admin', 'editor'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid().nullable(), content: z.record(z.unknown()), note: z.string().max(300).optional() }), body)
  if (!d) return fail(400, 'התוכן לא תקין.', undefined, { code: 'invalidContent' })
  // "All site texts": optional; strings only, within UI_LIMITS (src/shared/uiOverrides.ts)
  if (d.content.ui !== undefined && !uiOverridesSchema.safeParse(d.content.ui).success) return fail(400, 'התוכן לא תקין.', undefined, { code: 'invalidContent' })
  if (JSON.stringify(d.content).length > 1_000_000) return fail(413, 'התוכן גדול מדי.', undefined, { code: 'contentTooLarge' })
  const db = sql()
  if (d.id) {
    const [r] = await db`update site_content_versions set content = ${JSON.stringify(d.content)}::jsonb, note = ${d.note ?? null} where id = ${d.id} and status = 'draft' returning id`
    if (r) return json({ id: r.id })
  }
  const [r] = await db`insert into site_content_versions (content, note, created_by) values (${JSON.stringify(d.content)}::jsonb, ${d.note ?? null}, ${admin.id}) returning id`
  return json({ id: r.id })
})

const contentPublish = need(['admin', 'editor'], async ({ admin, body }) => {
  if (!canPublish(admin)) return fail(403, 'אין לך הרשאת פרסום. בקשו ממנהל.ת לפרסם.', undefined, { code: 'noPublishPermission' })
  const d = parse(z.object({ id: z.string().uuid() }), body)
  if (!d) return fail(400, 'גרסה לא תקינה.', undefined, { code: 'invalidVersion' })
  const db = sql()
  const [v] = await db`select status from site_content_versions where id = ${d.id}`
  if (!v) return fail(404, 'הגרסה לא נמצאה.', undefined, { code: 'versionNotFound' })
  if (v.status === 'published') return json({ ok: true })
  await db.transaction((tx) => [
    tx`update site_content_versions set status = 'archived' where status = 'published'`,
    tx`update site_content_versions set status = 'published', published_by = ${admin.id}, published_at = now() where id = ${d.id}`,
  ])
  return json({ ok: true })
})

// restore = copy an old version into a new draft (history is never rewritten)
const contentRestore = need(['admin', 'editor'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid() }), body)
  if (!d) return fail(400, 'גרסה לא תקינה.', undefined, { code: 'invalidVersion' })
  const db = sql()
  await db`delete from site_content_versions where status = 'draft'`
  const [r] = await db`insert into site_content_versions (content, note, created_by) select content, ${'שוחזר מגרסה קודמת'}, ${admin.id} from site_content_versions where id = ${d.id} returning id`
  return r ? json({ id: r.id }) : fail(404, 'הגרסה לא נמצאה.', undefined, { code: 'versionNotFound' })
})

// preview: any team member may load a draft to view the site with it
const contentPreview = need(['admin', 'editor', 'reviewer'], async ({ url }) => {
  const id = url.searchParams.get('id')
  if (!isUuid(id)) return fail(400, 'גרסה לא תקינה.', undefined, { code: 'invalidVersion' })
  const [r] = await sql()`select content from site_content_versions where id = ${id}`
  return r ? json({ content: r.content }) : fail(404, 'הגרסה לא נמצאה.', undefined, { code: 'versionNotFound' })
})

// images for the site: raw body, ≤ 4MB, served publicly by /api/media?id=
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const mediaUpload = need(['admin', 'editor'], async ({ admin, req, url }) => {
  const type = (req.headers.get('content-type') ?? '').split(';')[0]
  if (!MEDIA_TYPES.includes(type)) return fail(400, 'אפשר להעלות רק JPG, PNG או WEBP.', undefined, { code: 'imageType' })
  const data = Buffer.from(await req.arrayBuffer())
  if (!data.length || data.length > 4 * 1024 * 1024) return fail(413, 'התמונה גדולה מ-4MB.', undefined, { code: 'imageTooLarge' })
  const name = (url.searchParams.get('name') ?? 'image').slice(0, 200)
  const [r] = await sql()`insert into media_assets (file_name, mime_type, data, alt, created_by) values (${name}, ${type}, ${data}, ${url.searchParams.get('alt') ?? ''}, ${admin.id}) returning id`
  return json({ id: r.id, src: `/api/media?id=${r.id}` })
})

// ───────────── users (admins only) ─────────────
const users = need(['admin'], async () => {
  const rows = await sql()`select id, email, display_name, role, can_publish, created_at, last_login_at, (password_hash is null) as pending from admin_users order by created_at`
  return json({ users: rows })
})

const invite = need(['admin'], async ({ admin, body, url }) => {
  const d = parse(z.object({ email: z.string().trim().email().max(200), role: z.enum(ROLES), canPublish: z.boolean().default(false) }), body)
  if (!d) return fail(400, 'כתבו אימייל תקין ובחרו תפקיד.', undefined, { code: 'invalidInvite' })
  const token = newToken()
  const db = sql()
  const [exists] = await db`select password_hash is not null as active from admin_users where lower(email) = lower(${d.email})`
  if (exists?.active) return fail(409, 'למשתמש.ת הזה.ו כבר יש גישה.', undefined, { code: 'userExists' })
  await db`insert into admin_users (email, role, can_publish, invited_by, invite_token) values (${d.email}, ${d.role}, ${d.canPublish}, ${admin.id}, ${token})
           on conflict (email) do update set role = excluded.role, can_publish = excluded.can_publish, invite_token = excluded.invite_token, created_at = now()`
  return json({ link: `${url.origin}/admin/accept?token=${token}` })
})

const updateUser = need(['admin'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid(), role: z.enum(ROLES), canPublish: z.boolean() }), body)
  if (!d) return fail(400, 'נתונים לא תקינים.', undefined, { code: 'invalidData' })
  if (d.id === admin.id && d.role !== 'admin') return fail(400, 'אי אפשר להוריד לעצמך את הרשאת המנהל.ת.', undefined, { code: 'cannotDemoteSelf' })
  await sql()`update admin_users set role = ${d.role}, can_publish = ${d.canPublish} where id = ${d.id}`
  return json({ ok: true })
})

const removeUser = need(['admin'], async ({ admin, body }) => {
  const d = parse(z.object({ id: z.string().uuid() }), body)
  if (!d) return fail(400, 'נתונים לא תקינים.', undefined, { code: 'invalidData' })
  if (d.id === admin.id) return fail(400, 'אי אפשר להסיר את עצמך.', undefined, { code: 'cannotRemoveSelf' })
  await sql()`delete from admin_users where id = ${d.id}`
  return json({ ok: true })
})

const GET_ROUTES: Record<string, Handler> = { me, analytics, stats, applications: list, application: detail, file, export: exportCsv, content: contentState, preview: contentPreview, users }
const POST_ROUTES: Record<string, Handler> = { logout, 'change-password': changePassword, status: setStatus, note: addNote, correction: addCorrection, 'content-save': contentSave, 'content-publish': contentPublish, 'content-restore': contentRestore, media: mediaUpload, invite, 'user-update': updateUser, 'user-remove': removeUser }

async function route(req: Request, method: 'GET' | 'POST') {
  const url = new URL(req.url)
  const name = url.searchParams.get('route') ?? ''
  try {
    let body: unknown = null
    if (method === 'POST') {
      if (req.headers.get('x-medorot') !== '1') return fail(400, 'בקשה לא תקינה.', undefined, { code: 'badRequest' })
      if (name !== 'media') body = await req.json().catch(() => null)
    }
    if (method === 'GET' && name === 'setup-status') return await setupStatus()
    if (method === 'POST' && name === 'setup') return await setup({ req, url, admin: null, body })
    if (method === 'POST' && name === 'login') return await login({ req, url, admin: null, body })
    if (method === 'POST' && name === 'accept-invite') return await acceptInvite({ req, url, admin: null, body })
    const h = (method === 'GET' ? GET_ROUTES : POST_ROUTES)[name]
    if (!h) return fail(404, 'לא נמצא.', undefined, { code: 'notFound' })
    const admin = await currentAdmin(req)
    if (!admin) return fail(401, 'צריך להתחבר.', undefined, { code: 'signInRequired' })
    return await h({ req, url, admin, body })
  } catch (e) {
    console.error('admin', name, e)
    return fail(500, 'משהו השתבש. נסו שוב.', undefined, { code: 'serverError' })
  }
}

export function GET(req: Request) {
  return route(req, 'GET')
}
export function POST(req: Request) {
  return route(req, 'POST')
}
