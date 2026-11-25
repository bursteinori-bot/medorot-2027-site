// Shared helpers for the server functions. Secrets come only from the Vercel environment and never reach the browser.
import { createHash } from 'node:crypto'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

const env = (k: string) => process.env[k]?.trim() || undefined

export const configured = () => !!env('DATABASE_URL')

let client: NeonQueryFunction<false, false> | null = null
export function sql(): NeonQueryFunction<false, false> {
  if (!configured()) throw new Error('backend not configured')
  client ??= neon(env('DATABASE_URL')!)
  return client
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })

// `error` stays the Hebrew text it has always been; `extra` carries language-neutral codes (code, fieldCodes, detail)
// so the browser can show the message in the visitor's language (src/i18n)
export const fail = (status: number, error: string, fields?: Record<string, string>, extra?: Record<string, unknown>) => json({ error, fields, ...extra }, status)

// a salted hash: enough to rate-limit a sender, impossible to turn back into their IP
export function ipHash(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(`${env('IP_HASH_SALT') ?? env('NEON_PROJECT_ID') ?? 'medorot'}:${ip}`).digest('hex').slice(0, 32)
}

export const applicationsOpen = () => configured() && env('APPLICATIONS_OPEN') !== 'false'

export const RATE_LIMIT = { perHour: 12 }
export const isUuid = (s: string | null): s is string => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

// email the team about a new application; never throws (a failed email must not lose the application)
export async function notifyTeam(app: { id: string; name: string; project: string; disciplines: string[] }, fileCount: number): Promise<string | null> {
  const key = env('RESEND_API_KEY')
  const to = env('NOTIFY_EMAIL')
  if (!key || !to) return 'email not configured'
  const adminUrl = `${env('SITE_URL') ?? ''}/admin/applications/${app.id}`
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env('RESEND_FROM') ?? 'Medorot <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()),
        subject: `הגשה חדשה: ${app.project} · ${app.name}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6">
          <p><b>הגשה חדשה לפסטיבל מדורות 2027</b></p>
          <p>שם: ${esc(app.name)}<br>פרויקט: ${esc(app.project)}<br>תחומים: ${esc(app.disciplines.join(', '))}<br>קבצים מצורפים: ${fileCount}</p>
          <p><a href="${esc(adminUrl)}">לצפייה בהגשה במערכת הניהול</a></p></div>`,
      }),
    })
    return r.ok ? null : `resend ${r.status}: ${(await r.text()).slice(0, 300)}`
  } catch (e) {
    return `resend: ${(e as Error).message}`
  }
}
