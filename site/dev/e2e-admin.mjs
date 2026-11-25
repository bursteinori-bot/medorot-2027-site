// End-to-end check of the live admin API: a temporary admin (random password, never printed) signs in, reviews a test
// application, edits/publishes content, uploads an image, and everything it created is removed at the end.
// Usage: node dev/e2e-admin.mjs [baseUrl]
import { readFileSync, existsSync } from 'node:fs'
import { randomBytes, randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

const base = process.argv[2] ?? 'https://medorot-2027.vercel.app'
if (existsSync('.env.production.local')) {
  for (const line of readFileSync('.env.production.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
const sql = neon(process.env.DATABASE_URL)
const check = (ok, what) => console.log(ok ? '✓' : '✗', what) || (ok ? null : (process.exitCode = 1))

const email = `e2e-${randomBytes(4).toString('hex')}@example.com`
const password = randomBytes(18).toString('base64url')
const token = randomBytes(32).toString('base64url')
const appId = randomUUID()
let cookie = ''
const call = async (method, route, body, extra = {}) => {
  const r = await fetch(`${base}/api/admin?route=${route}${extra.qs ?? ''}`, {
    method,
    headers: { cookie, ...(method === 'POST' ? { 'x-medorot': '1', 'content-type': extra.type ?? 'application/json' } : {}) },
    body: method === 'POST' ? (extra.raw ?? JSON.stringify(body ?? {})) : undefined,
  })
  const set = r.headers.get('set-cookie')
  if (set) cookie = set.split(';')[0]
  const isJson = (r.headers.get('content-type') ?? '').includes('json')
  return { status: r.status, data: isJson ? await r.json() : await r.text(), headers: r.headers }
}
const before = (await sql`select coalesce(max(created_at), 'epoch') as t from site_content_versions`)[0].t

try {
  check((await call('GET', 'me')).status === 401, 'not signed in → 401')
  await sql`insert into admin_users (email, role, can_publish, invite_token) values (${email}, 'admin', true, ${token})`
  const bad = await call('POST', 'accept-invite', { token, password: 'short' })
  check(bad.status === 400, 'weak password refused')
  const acc = await call('POST', 'accept-invite', { token, password, displayName: 'בדיקה' })
  check(acc.status === 200 && cookie, 'invite accepted, session cookie set')
  check((await call('POST', 'accept-invite', { token, password })).status === 400, 'invite link works once only')
  cookie = ''
  check((await call('POST', 'login', { email, password: password + 'x' })).status === 401, 'wrong password refused')
  check((await call('POST', 'login', { email, password })).status === 200, 'login with the right password')
  const me = await call('GET', 'me')
  check(me.data.role === 'admin' && me.data.canPublish, `me → ${me.data.display_name}, ${me.data.role}`)
  const noHeader = await fetch(`${base}/api/admin?route=note`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' })
  check(noHeader.status === 400, 'write without the x-medorot header refused')

  // a submitted test application with one file
  await sql`insert into applications (id, status, answers, name, email, phone, age, city, identity, project, disciplines, location, stage, submitted_at)
            values (${appId}, 'new', ${JSON.stringify({ name: 'בדיקה', bio: 'ביו', description: 'תיאור', jewish: 'קשר', portfolio: '', links: 'https://example.com', notes: '' })}::jsonb,
                    'בדיקה אוטומטית', 'e2e@example.com', '050-0000000', 30, 'ירושלים', 'אמן.ית פעיל.ה', 'פרויקט בדיקה', ${['מחול']}, 'בית הכנסת', 'רעיון ראשוני', now())`
  await sql`insert into application_files (application_id, position, original_name, size_bytes, mime_type, data, uploaded_at) values (${appId}, 0, 'x.pdf', 4, 'application/pdf', ${Buffer.from('%PDF')}, now())`

  const stats = await call('GET', 'stats')
  check(stats.status === 200 && (stats.data.counts.new ?? 0) >= 1, `stats → new: ${stats.data.counts.new}`)
  const list = await call('GET', 'applications')
  check(list.data.applications.some((a) => a.id === appId), `list contains the test application (${list.data.applications.length} total)`)
  const det = await call('GET', 'application', null, { qs: `&id=${appId}` })
  check(det.data.application?.project === 'פרויקט בדיקה' && det.data.files.length === 1 && !('ip_hash' in det.data.application), 'detail with files, without IP hash')
  const file = await call('GET', 'file', null, { qs: `&id=${appId}&n=0&download=1` })
  check(file.status === 200 && file.headers.get('content-disposition')?.startsWith('attachment'), 'file download')
  check((await call('POST', 'status', { id: appId, status: 'shortlisted' })).status === 200, 'status → shortlisted')
  check((await call('POST', 'note', { id: appId, body: 'הערה פנימית לבדיקה' })).status === 200, 'internal note added')
  check((await call('POST', 'correction', { id: appId, field: 'name', value: 'שם מתוקן', reason: 'בדיקה' })).status === 200, 'correction recorded')
  const det2 = await call('GET', 'application', null, { qs: `&id=${appId}` })
  check(det2.data.application.status === 'shortlisted' && det2.data.notes.length === 1 && det2.data.corrections.length === 1 && det2.data.history.at(-1).by === 'בדיקה', 'status, note, correction and history (with author) stored')
  check(det2.data.application.answers.name === 'בדיקה', 'original answer untouched by the correction')
  const csv = await call('GET', 'export')
  check(csv.status === 200 && csv.data.includes('פרויקט בדיקה') && csv.data.includes('מועמדת להמשך'), 'CSV export includes the application, in Hebrew')

  // content: save → preview → publish → restore
  const state = await call('GET', 'content')
  const content = { ...state.data.current.content, tagline: 'אמנות יהודית מציתה מחשבה' }
  const saved = await call('POST', 'content-save', { id: null, content, note: 'e2e' })
  check(saved.status === 200 && saved.data.id, 'draft saved')
  const prev = await call('GET', 'preview', null, { qs: `&id=${saved.data.id}` })
  check(prev.data.content?.tagline === content.tagline, 'draft preview')
  check((await call('POST', 'content-publish', { id: saved.data.id })).status === 200, 'published')
  const pub = await fetch(`${base}/api/content`).then((r) => r.json())
  check(pub.content?.tagline === content.tagline, 'public /api/content serves the published version')

  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex')
  const media = await call('POST', 'media', null, { qs: '&name=pixel.png', type: 'image/png', raw: png })
  check(media.status === 200 && media.data.src, 'image uploaded to the media library')
  const served = await fetch(base + media.data.src)
  check(served.status === 200 && served.headers.get('content-type') === 'image/png', 'image served publicly')
  await sql`delete from media_assets where id = ${media.data.id}`

  const inv = await call('POST', 'invite', { email: `e2e-invitee-${randomBytes(3).toString('hex')}@example.com`, role: 'reviewer', canPublish: false })
  check(inv.status === 200 && inv.data.link.includes('/admin/accept?token='), 'invite link created')
  const users = await call('GET', 'users')
  check(users.data.users.length >= 2, `users list (${users.data.users.length})`)
  await sql`delete from admin_users where email like 'e2e-invitee-%@example.com'`
  check((await call('POST', 'logout')).status === 200 && (await call('GET', 'me')).status === 401, 'logout ends the session')
} finally {
  await sql`delete from applications where id = ${appId}`
  await sql`delete from site_content_versions where created_at > ${before}`
  await sql`delete from admin_users where email = ${email}`
  await sql`delete from submission_attempts where ip_hash like 'login:%' and created_at > now() - interval '10 minutes'`
  const [{ n }] = await sql`select (select count(*) from applications where id = ${appId}) + (select count(*) from admin_users where email = ${email}) + (select count(*) from site_content_versions where created_at > ${before}) as n`
  console.log(Number(n) === 0 ? '✓ all test data removed (site back on its original content)' : '✗ test data left behind')
}
