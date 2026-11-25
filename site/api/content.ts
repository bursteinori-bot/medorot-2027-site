import { configured, json, sql } from './_lib/server.js'

// The published CMS version, for the public site. 204 = nothing published (or no backend yet): use the seed.
export async function GET() {
  if (!configured()) return json(null, 204)
  try {
    const [row] = await sql()`select content, published_at from site_content_versions where status = 'published' limit 1`
    if (!row) return json(null, 204)
    return json({ content: row.content, publishedAt: row.published_at }, 200, { 'cache-control': 'public, s-maxage=30, stale-while-revalidate=300' })
  } catch (e) {
    console.error('content: read failed', e)
    return json(null, 204)
  }
}
