// Send a little sample traffic (sessions prefixed "e2etestui") to see the statistics page; `down` deletes it.
import { readFileSync, existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const base = 'https://medorot-2027.vercel.app'
if (process.argv[2] === 'down') {
  for (const line of readFileSync('.env.production.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
  await neon(process.env.DATABASE_URL)`delete from analytics_events where session like 'e2etestui%'`
  console.log('removed')
} else {
  const UAS = ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36', 'Mozilla/5.0 (Linux; Android 15) Mobile Chrome/131.0']
  const REFS = ['https://l.instagram.com/', 'https://web.whatsapp.com/', '', 'https://www.google.com/']
  const PATHS = [['home', 'open-call', 'apply'], ['home', 'about', 'spaces'], ['home', 'apply'], ['spaces', 'details'], ['home']]
  for (let i = 0; i < 9; i++) {
    const session = `e2etestui${i}`
    const ua = UAS[i % 3]
    const post = (b) => fetch(`${base}/api/track`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': ua, 'x-forwarded-for': `10.0.0.${i}` }, body: JSON.stringify({ session, ...b }) })
    const path = PATHS[i % PATHS.length]
    for (const [j, p] of path.entries()) await post({ type: 'pageview', name: p, ref: j === 0 ? REFS[i % 4] || undefined : undefined })
    if (path.includes('apply')) for (let s = 1; s <= (i % 4) + 1; s++) await post({ type: 'event', name: 'form_step', props: { step: s } })
    if (i % 2) await post({ type: 'event', name: 'sculpture_shuffle' })
    if (i % 3 === 0) await post({ type: 'event', name: 'photo_open', props: { space: 'x' } })
  }
  console.log('sent')
}
