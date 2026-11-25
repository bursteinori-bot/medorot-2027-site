import { fieldCodes, fieldErrors, startSchema } from '../../src/shared/application.js'
import { RATE_LIMIT, applicationsOpen, fail, ipHash, json, sql } from '../_lib/server.js'

const MIN_FILL_MS = 4000 // a person can't fill four steps faster than this

// Step 1 of a submission: validate everything, create (or reuse) the draft record, and tell the browser where to
// upload each file. The application stays a draft, invisible to reviewers, until /complete confirms the files.
export async function POST(req: Request) {
  if (!applicationsOpen()) return fail(503, 'ההגשה המקוונת עוד לא נפתחה.', undefined, { code: 'closed' })
  const parsed = startSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail(400, 'יש שדות שצריך לתקן לפני השליחה.', fieldErrors(parsed.error), { code: 'invalid', fieldCodes: fieldCodes(parsed.error) })
  const { key, answers, files, website, startedAt } = parsed.data
  if (website || Date.now() - startedAt < MIN_FILL_MS) return fail(400, 'לא הצלחנו לקבל את ההגשה. נסו שוב בעוד רגע.', undefined, { code: 'rejected' })

  const db = sql()
  const hash = ipHash(req)
  const [{ n }] = await db`select count(*)::int as n from submission_attempts where ip_hash = ${hash} and created_at > now() - interval '1 hour'`
  if (n >= RATE_LIMIT.perHour) return fail(429, 'נשלחו יותר מדי הגשות מהחיבור הזה בשעה האחרונה. נסו שוב מאוחר יותר.', undefined, { code: 'rateLimited' })
  await db`insert into submission_attempts (ip_hash) values (${hash})`

  // the idempotency key is the application id: a retry of the same submission finds its own record
  const [existing] = await db`select status from applications where id = ${key}`
  if (existing && existing.status !== 'draft') return json({ id: key, uploads: [], alreadySubmitted: true })

  const identity = answers.identity === 'אחר' ? `אחר: ${answers.identityOther}` : answers.identity
  const disciplines = answers.disciplines.map((d) => (d === 'אחר' ? `אחר: ${answers.disciplineOther}` : d))
  const location = answers.location
  try {
    await db.transaction((tx) => [
      tx`insert into applications (id, answers, name, email, phone, age, city, identity, project, disciplines, location, stage, ip_hash)
         values (${key}, ${JSON.stringify(answers)}::jsonb, ${answers.name}, ${answers.email}, ${answers.phone}, ${Number(answers.age)}, ${answers.city},
                 ${identity}, ${answers.project}, ${disciplines}, ${location}, ${answers.stage}, ${hash})
         on conflict (id) do update set answers = excluded.answers, name = excluded.name, email = excluded.email, phone = excluded.phone,
           age = excluded.age, city = excluded.city, identity = excluded.identity, project = excluded.project,
           disciplines = excluded.disciplines, location = excluded.location, stage = excluded.stage
         where applications.status = 'draft'`,
      // a retry replaces the file list of its own draft
      tx`delete from application_files where application_id = ${key}`,
      ...files.map((f, i) => tx`insert into application_files (application_id, position, original_name, size_bytes, mime_type) values (${key}, ${i}, ${f.name}, ${f.size}, ${f.type || null})`),
    ])
  } catch (e) {
    console.error('start: save failed', e)
    return fail(500, 'לא הצלחנו לשמור את ההגשה. נסו שוב בעוד רגע. מה שכתבתם נשמר בטופס.', undefined, { code: 'saveFailed' })
  }
  return json({ id: key, uploads: files.map((_, index) => ({ index, url: `/api/applications/file?id=${key}&n=${index}` })) })
}
