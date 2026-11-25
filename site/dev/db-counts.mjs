// Read-only overview of what is in the database (row counts only, no personal data).
import { readFileSync, existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

if (existsSync('.env.production.local')) {
  for (const line of readFileSync('.env.production.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
const sql = neon(process.env.DATABASE_URL)
const [r] = await sql`select (select count(*) from admin_users)::int as admins, (select count(*) from admin_sessions)::int as sessions,
  (select count(*) from applications)::int as applications, (select count(*) from site_content_versions)::int as content_versions,
  (select count(*) from media_assets)::int as media`
console.log(r)
