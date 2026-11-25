// Create (or refresh) an admin invite and print the one-time link. Usage: node dev/invite-admin.mjs email [role] [baseUrl]
import { readFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

if (existsSync('.env.production.local')) {
  for (const line of readFileSync('.env.production.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
const [email, role = 'admin', base = 'https://medorot-2027.vercel.app'] = process.argv.slice(2)
if (!email) throw new Error('usage: node dev/invite-admin.mjs email [role] [baseUrl]')
const sql = neon(process.env.DATABASE_URL)
const token = randomBytes(32).toString('base64url')
await sql`insert into admin_users (email, role, can_publish, invite_token) values (${email}, ${role}, ${role === 'admin'}, ${token})
          on conflict (email) do update set role = excluded.role, can_publish = excluded.can_publish, invite_token = excluded.invite_token, created_at = now()`
console.log(`${base}/admin/accept?token=${token}`)
