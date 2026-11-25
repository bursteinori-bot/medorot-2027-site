import { z } from 'zod'
import { fail, json, notifyTeam, sql } from '../_lib/server.js'

const bodySchema = z.object({ key: z.string().uuid(), id: z.string().uuid() })

// Step 3 of a submission: confirm every announced file is really stored, then mark the application submitted.
// Only this response lets the browser show "ההצעה שלכם בדרך אלינו". A failed team email is logged, never fatal.
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || parsed.data.key !== parsed.data.id) return fail(400, 'בקשה לא תקינה.', undefined, { code: 'badRequest' })
  const { id } = parsed.data
  const db = sql()

  const [app] = await db`select id, status, name, project, disciplines from applications where id = ${id}`
  if (!app) return fail(404, 'לא מצאנו את ההגשה. נסו לשלוח שוב.', undefined, { code: 'notFound' })
  if (app.status !== 'draft') return json({ ok: true, id }) // already completed (a retry)

  const files = await db`select original_name, size_bytes, octet_length(data) as stored from application_files where application_id = ${id} order by position`
  const missing = files.filter((f) => Number(f.stored ?? -1) !== Number(f.size_bytes))
  if (missing.length) return fail(400, `הקבצים האלה לא הגיעו במלואם: ${missing.map((f) => f.original_name).join(', ')}. נסו לשלוח שוב.`, undefined, { code: 'filesMissing', detail: missing.map((f) => f.original_name).join(', ') })

  const done = await db`update applications set status = 'new', submitted_at = now() where id = ${id} and status = 'draft' returning id`
  if (!done.length) return json({ ok: true, id })

  const mailError = await notifyTeam({ id, name: app.name, project: app.project, disciplines: app.disciplines }, files.length)
  if (mailError) {
    console.warn('complete: team notification not sent', id, mailError)
    await db`update applications set notification_error = ${mailError} where id = ${id}`
  } else await db`update applications set notification_sent_at = now(), notification_error = null where id = ${id}`
  return json({ ok: true, id })
}
