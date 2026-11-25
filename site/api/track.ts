import { createHash } from 'node:crypto'
import { z } from 'zod'
import { configured, sql } from './_lib/server.js'

// Anonymous usage statistics (sendBeacon from the public site). Stores no IP and no cookie: the visitor id is a hash
// that changes every day. Bots are ignored. Always answers 204 so tracking can never break the page.
const EVENTS = ['form_step', 'form_submitted', 'form_error', 'sculpture_shuffle', 'sculpture_swap', 'photo_open', 'outbound', 'cta', 'donation_amount'] as const
const body = z.object({
  type: z.enum(['pageview', 'event']),
  name: z.string().min(1).max(60),
  session: z.string().min(8).max(40),
  ref: z.string().max(500).optional(),
  props: z.record(z.union([z.string().max(120), z.number(), z.boolean()])).optional(),
})
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|monitor/i
const SECTIONS = new Set(['home', 'about', 'open-call', 'spaces', 'apply', 'support', 'details', 'privacy', 'accessibility'])
const done = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })

export async function POST(req: Request) {
  if (!configured()) return done()
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOT.test(ua)) return done()
  const d = body.safeParse(await req.json().catch(() => null))
  if (!d.success) return done()
  const e = d.data
  if (e.type === 'pageview' ? !SECTIONS.has(e.name) : !(EVENTS as readonly string[]).includes(e.name)) return done()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const day = new Date().toISOString().slice(0, 10)
  const visitor = createHash('sha256').update(`${process.env.IP_HASH_SALT ?? process.env.NEON_PROJECT_ID ?? 'medorot'}|${day}|${ip}|${ua}`).digest('hex').slice(0, 20)
  const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
  let referrer: string | null = null
  try {
    const host = e.ref ? new URL(e.ref).hostname.replace(/^www\.|^l\.|^lm\.|^m\./, '') : null
    referrer = host && host !== new URL(req.url).hostname ? host : null
  } catch { /* not a URL */ }
  const city = req.headers.get('x-vercel-ip-city')
  try {
    await sql()`insert into analytics_events (visitor, session, type, name, referrer_host, device, country, city, props)
                values (${visitor}, ${e.session}, ${e.type}, ${e.name}, ${referrer}, ${device}, ${req.headers.get('x-vercel-ip-country')},
                        ${city ? decodeURIComponent(city) : null}, ${e.props ? JSON.stringify(e.props) : null}::jsonb)`
    // keep 13 months of statistics; prune now and then
    if (Math.random() < 0.01) await sql()`delete from analytics_events where at < now() - interval '13 months'`
  } catch (err) {
    console.error('track', err)
  }
  return done()
}
