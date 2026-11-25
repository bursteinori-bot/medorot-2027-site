// Temporary admin session for visually checking the admin UI. `node dev/ui-session.mjs up` creates a test admin,
// a session and a sample application and prints the session cookie; `node dev/ui-session.mjs down` removes them all.
import { readFileSync, existsSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

if (existsSync('.env.production.local')) {
  for (const line of readFileSync('.env.production.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
const sql = neon(process.env.DATABASE_URL)
const EMAIL = 'ui-check@example.com'
const APP = '00000000-0000-4000-8000-00000000c0de'

if (process.argv[2] === 'up') {
  const token = randomBytes(32).toString('base64url')
  const [u] = await sql`insert into admin_users (email, display_name, role, can_publish, password_hash) values (${EMAIL}, 'בדיקת ממשק', 'admin', true, 'scrypt$1$x$x')
                        on conflict (email) do update set display_name = excluded.display_name returning id`
  await sql`insert into admin_sessions (token_hash, user_id, expires_at) values (${createHash('sha256').update(token).digest('hex')}, ${u.id}, now() + interval '1 hour')`
  await sql`insert into applications (id, status, answers, name, email, phone, age, city, identity, project, disciplines, location, stage, submitted_at)
            values (${APP}, 'new', ${JSON.stringify({ bio: 'אמנית רב-תחומית שעובדת עם טקסטים ומחול.', description: 'מיצג תנועה סביב האור והאש בחלל בית הכנסת.', jewish: 'קריאה בפרשת בהעלותך והדלקת המנורה.', portfolio: 'https://example.com', links: '', notes: '' })}::jsonb,
                    'נועה כהן (דוגמה)', 'noa@example.com', '050-1234567', 29, 'ירושלים', 'אמן.ית פעיל.ה', 'נר תמיד (דוגמה)', ${['מחול', 'פרפורמנס']}, 'בית הכנסת', 'בתהליך פיתוח', now())
            on conflict (id) do nothing`
  console.log(`medorot_admin=${token}`)
} else {
  await sql`delete from applications where id = ${APP}`
  await sql`delete from admin_users where email = ${EMAIL}`
  await sql`delete from site_content_versions where created_by is null and note is null and created_at > now() - interval '2 hours' and status = 'draft'`
  console.log('removed')
}
