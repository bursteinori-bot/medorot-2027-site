import { UPLOAD } from '../../src/shared/application.js'
import { fail, isUuid, json, sql } from '../_lib/server.js'

// Upload one announced attachment of a draft application (raw body, one request per file). The draft id is the
// browser's secret idempotency key, sent again in a header, so nobody else can write into someone's application.
export async function PUT(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const n = Number(url.searchParams.get('n'))
  if (!isUuid(id) || !Number.isInteger(n) || req.headers.get('x-application-key') !== id) return fail(400, 'בקשה לא תקינה.')

  const db = sql()
  const [file] = await db`select f.size_bytes, f.mime_type, a.status from application_files f join applications a on a.id = f.application_id where f.application_id = ${id} and f.position = ${n}`
  if (!file) return fail(404, 'הקובץ לא הוכרז בהגשה. נסו לשלוח שוב.')
  if (file.status !== 'draft') return json({ ok: true }) // already submitted (a retry)

  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > UPLOAD.maxMb * 1024 * 1024) return fail(413, `הקובץ גדול מ-${UPLOAD.maxMb}MB.`)
  const type = (req.headers.get('content-type') ?? '').split(';')[0]
  if (file.mime_type && type !== file.mime_type) return fail(400, 'סוג הקובץ לא תואם למה שהוכרז.')
  const body = Buffer.from(await req.arrayBuffer())
  if (body.length !== Number(file.size_bytes)) return fail(400, 'הקובץ לא הגיע במלואו. נסו שוב.')

  await db`update application_files set data = ${body}, uploaded_at = now() where application_id = ${id} and position = ${n}`
  return json({ ok: true })
}
