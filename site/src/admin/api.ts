// Browser client for /api/admin. Writes carry the x-medorot header the server requires.
import { useLang } from '../i18n/lang'

export type Role = 'admin' | 'editor' | 'reviewer'
export type Me = { id: string; email: string; display_name: string | null; role: Role; can_publish: boolean; canPublish: boolean }
export type Status = 'new' | 'in_review' | 'shortlisted' | 'accepted' | 'rejected' | 'needs_info'

// stored values, in display order; their labels are in the dictionary (src/i18n/admin.*.ts)
export const STATUSES: Status[] = ['new', 'in_review', 'shortlisted', 'accepted', 'rejected', 'needs_info']
export const ROLES: Role[] = ['admin', 'editor', 'reviewer']
export const STATUS_COLOR: Record<Status, string> = {
  new: 'bg-[#fee801] text-black',
  in_review: 'bg-[#cfe3ff] text-black',
  shortlisted: 'bg-[#e13d96] text-white',
  accepted: 'bg-[#1f7a3d] text-white',
  rejected: 'bg-[#555] text-white',
  needs_info: 'bg-[#ffd2a8] text-black',
}

const GENERIC_HE = 'משהו השתבש. נסו שוב.'
const NETWORK_HE = 'אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב.'

/** An error from the admin API: `message` is the server's Hebrew text, `code` its language-neutral name. */
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function handle<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(data.error ?? GENERIC_HE, r.status, typeof data.code === 'string' ? data.code : undefined)
  return data as T
}
// no answer at all (offline, server down): a coded error too, so it can be shown in either language
const req = (url: string, init: RequestInit) =>
  fetch(url, { credentials: 'same-origin', ...init }).catch(() => {
    throw new ApiError(NETWORK_HE, 0, 'network')
  })

export const apiGet = <T>(route: string, params: Record<string, string> = {}) => req(`/api/admin?${new URLSearchParams({ route, ...params })}`, {}).then((r) => handle<T>(r))

export const apiPost = <T>(route: string, body: unknown = {}) =>
  req(`/api/admin?route=${route}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-medorot': '1' }, body: JSON.stringify(body) }).then((r) => handle<T>(r))

export const uploadMedia = (file: File, alt = '') =>
  req(`/api/admin?${new URLSearchParams({ route: 'media', name: file.name, alt })}`, { method: 'POST', headers: { 'content-type': file.type, 'x-medorot': '1' }, body: file }).then((r) =>
    handle<{ id: string; src: string }>(r),
  )

export const fileUrl = (id: string, n: number, download = false) => `/api/admin?${new URLSearchParams({ route: 'file', id, n: String(n), ...(download ? { download: '1' } : {}) })}`

export const fmtDate = (s: string | null, locale = 'he-IL') => (s ? new Date(s).toLocaleString(locale, { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`)

/** Everything an admin screen needs for its language: the strings, dates, and errors in the interface language. */
export function useAdmin() {
  const { lang, dir, t, withLang } = useLang()
  const a = t.admin
  // Hebrew: the server's own text, as always. English: the text for the server's code, or a generic message.
  const errText = (e: unknown): string => {
    if (lang === 'he') return e instanceof ApiError ? e.message : (e as Error)?.message || GENERIC_HE
    if (e instanceof ApiError) return (e.code === 'network' ? a.errors.network : e.code && a.errors.codes[e.code]) || a.errors.generic
    return a.errors.generic
  }
  return { lang, dir, t: a, withLang, errText, fmt: (s: string | null) => fmtDate(s, a.dateLocale) }
}
