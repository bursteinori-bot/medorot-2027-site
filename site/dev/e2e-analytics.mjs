// Live check of the anonymous statistics: tracking endpoint, bot filter, admin "שימושיות" numbers, and the
// team-password setup gate (checked without claiming it). Removes everything it created.
import { readFileSync, existsSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
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
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const S = `e2etest${randomBytes(4).toString('hex')}`
const track = (body, ua = UA) => fetch(`${base}/api/track`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': ua }, body: JSON.stringify({ session: S, ...body }) })
const email = 'ui-check@example.com'
const token = randomBytes(32).toString('base64url')

try {
  const st = await fetch(`${base}/api/admin?route=setup-status`).then((r) => r.json())
  check(st.needsSetup === true, 'no team password yet → the first visit to /admin shows the setup screen')
  const weak = await fetch(`${base}/api/admin?route=setup`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-medorot': '1' }, body: JSON.stringify({ password: 'short' }) })
  check(weak.status === 400, 'setup refuses a short password')

  const r1 = await track({ type: 'pageview', name: 'home', ref: 'https://l.instagram.com/?u=x' })
  check(r1.status === 204, 'pageview accepted (204)')
  await track({ type: 'pageview', name: 'apply' })
  await track({ type: 'event', name: 'form_step', props: { step: 1 } })
  await track({ type: 'event', name: 'form_step', props: { step: 2 } })
  await track({ type: 'event', name: 'sculpture_shuffle' })
  await track({ type: 'pageview', name: 'home' }, 'Googlebot/2.1 (+http://www.google.com/bot.html)')
  await track({ type: 'pageview', name: 'not-a-section' })
  const rows = await sql`select type, name, device, referrer_host, visitor from analytics_events where session = ${S} order by id`
  check(rows.length === 5, `5 events stored (bot and unknown page ignored) → ${rows.length}`)
  check(rows[0]?.device === 'mobile' && rows[0]?.referrer_host === 'instagram.com', `device "${rows[0]?.device}", source "${rows[0]?.referrer_host}"`)
  check(rows.every((r) => /^[0-9a-f]{20}$/.test(r.visitor)), 'visitor is an anonymous hash, no IP stored')

  const [u] = await sql`insert into admin_users (email, display_name, role, can_publish, password_hash) values (${email}, 'בדיקה', 'reviewer', false, 'scrypt$1$x$x') returning id`
  await sql`insert into admin_sessions (token_hash, user_id, expires_at) values (${createHash('sha256').update(token).digest('hex')}, ${u.id}, now() + interval '10 minutes')`
  const a = await fetch(`${base}/api/admin?route=analytics&days=7`, { headers: { cookie: `medorot_admin=${token}` } }).then((r) => r.json())
  check(a.totals?.pageviews >= 2 && a.funnel?.viewed >= 1 && a.funnel?.s2 >= 1, `admin statistics: ${a.totals?.pageviews} page views, funnel apply→step2 ${a.funnel?.viewed}→${a.funnel?.s2}`)
  check(a.live?.some((l) => l.session === S), `"now on the site" shows the test visit (${a.live?.length} live)`)
  check(a.referrers?.some((r) => r.host === 'instagram.com'), 'sources include Instagram')
  check(a.daily?.length === 7, '7 days in the daily chart')
} finally {
  await sql`delete from analytics_events where session = ${S}`
  await sql`delete from admin_users where email = ${email}`
  const [{ n }] = await sql`select (select count(*) from analytics_events where session = ${S}) + (select count(*) from admin_users) as n`
  console.log(Number(n) === 0 ? '✓ test data removed' : `✗ ${n} rows left`)
}
