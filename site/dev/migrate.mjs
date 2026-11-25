// Apply db/migrations/*.sql in order, once each. Reads DATABASE_URL_UNPOOLED (or DATABASE_URL) from the environment
// or from .env.production.local (written by `vercel env pull`). Usage: node dev/migrate.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from '@neondatabase/serverless'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = join(root, '.env.production.local')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const pool = new Pool({ connectionString: url })
const dir = join(root, 'db', 'migrations')
const done = new Set(
  (await pool.query(`select to_regclass('schema_migrations') as t`)).rows[0].t
    ? (await pool.query('select name from schema_migrations')).rows.map((r) => r.name)
    : [],
)
for (const name of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(name)) {
    console.log('skip', name)
    continue
  }
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query(readFileSync(join(dir, name), 'utf8'))
    await client.query('insert into schema_migrations (name) values ($1)', [name])
    await client.query('commit')
    console.log('applied', name)
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
}
const tables = (await pool.query(`select table_name from information_schema.tables where table_schema = 'public' order by 1`)).rows.map((r) => r.table_name)
console.log('tables:', tables.join(', '))
await pool.end()
