// End-to-end check of the live submission API against the real database, then removes its own test record.
// Usage: node dev/e2e-submit.mjs [baseUrl]   (DATABASE_URL from .env.production.local, for verification + cleanup)
import { readFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
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

const key = randomUUID()
const answers = {
  name: 'בדיקה אוטומטית (למחיקה)', email: 'test@example.com', phone: '050-0000000', age: '30', city: 'ירושלים',
  identity: 'אחר', identityOther: 'בדיקת מערכת', bio: 'בדיקה.', project: 'בדיקת מערכת', disciplines: ['מחול', 'אחר'], disciplineOther: 'בדיקה',
  description: 'בדיקה.', location: 'פטיו', jewish: 'בדיקה.', stage: 'רעיון ראשוני', portfolio: 'https://example.com/portfolio', social: 'https://instagram.com/example', links: '', notes: '', privacy: true,
}
const files = [
  { name: 'test.pdf', type: 'application/pdf', body: Buffer.alloc(200_000, 7) },
  { name: 'photo.jpg', type: 'image/jpeg', body: Buffer.alloc(1_500_000, 3) },
]
const post = async (path, body) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { status: r.status, data: await r.json().catch(() => ({})) }
}

try {
  const bad = await post('/api/applications/start', { key: randomUUID(), answers: { ...answers, email: 'nope' }, files: [], startedAt: Date.now() - 60_000 })
  check(bad.status === 400 && bad.data.fields?.email, 'invalid email rejected by the server with a field error')

  const start = await post('/api/applications/start', { key, answers, files: files.map((f) => ({ name: f.name, size: f.body.length, type: f.type })), startedAt: Date.now() - 60_000, website: '' })
  check(start.status === 200 && start.data.uploads?.length === 2, `start → ${start.status}`)

  const early = await post('/api/applications/complete', { key, id: key })
  check(early.status === 400, 'complete refused while files are missing')

  const wrongKey = await fetch(base + start.data.uploads[0].url, { method: 'PUT', headers: { 'content-type': 'application/pdf', 'x-application-key': randomUUID() }, body: files[0].body })
  check(wrongKey.status === 400, 'upload with the wrong key refused')

  for (const u of start.data.uploads) {
    const f = files[u.index]
    const r = await fetch(base + u.url, { method: 'PUT', headers: { 'content-type': f.type, 'x-application-key': key }, body: f.body })
    check(r.status === 200, `upload ${f.name} (${f.body.length} bytes) → ${r.status}`)
  }
  const done = await post('/api/applications/complete', { key, id: key })
  check(done.status === 200 && done.data.ok, `complete → ${done.status}`)

  const retry = await post('/api/applications/start', { key, answers, files: [], startedAt: Date.now() - 60_000, website: '' })
  check(retry.data.alreadySubmitted === true, 'retry with the same key does not create a second application')

  const [app] = await sql`select status, submitted_at, name, disciplines, notification_error from applications where id = ${key}`
  check(app?.status === 'new' && app.submitted_at, `stored as "${app?.status}", disciplines: ${app?.disciplines}`)
  const stored = await sql`select position, size_bytes, octet_length(data) as n from application_files where application_id = ${key} order by position`
  check(stored.length === 2 && stored.every((f) => Number(f.n) === Number(f.size_bytes)), `files stored: ${stored.map((f) => f.n).join(', ')} bytes`)
  const history = await sql`select from_status, to_status from application_status_history where application_id = ${key} order by changed_at`
  check(history.length === 2, `status history: ${history.map((h) => `${h.from_status ?? '∅'}→${h.to_status}`).join(', ')}`)
  console.log('  notification:', app?.notification_error ?? 'sent')
} finally {
  await sql`delete from applications where id = ${key}`
  await sql`delete from submission_attempts where created_at > now() - interval '10 minutes'`
  const [{ n }] = await sql`select count(*)::int as n from applications where id = ${key}`
  console.log(n === 0 ? '✓ test application deleted' : '✗ test application still present')
}
