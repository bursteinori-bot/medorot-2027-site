import { isUuid, sql } from './_lib/server.js'

// Public images uploaded through the CMS (site photos, partner logos). Immutable per id, so cached hard.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  if (!isUuid(id)) return new Response('not found', { status: 404 })
  const [m] = await sql()`select mime_type, data from media_assets where id = ${id}`
  if (!m) return new Response('not found', { status: 404 })
  return new Response(m.data as Buffer, {
    headers: { 'content-type': m.mime_type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
  })
}
