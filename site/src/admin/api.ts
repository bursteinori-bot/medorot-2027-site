// Browser client for /api/admin. Writes carry the x-medorot header the server requires.
export type Role = 'admin' | 'editor' | 'reviewer'
export type Me = { id: string; email: string; display_name: string | null; role: Role; can_publish: boolean; canPublish: boolean }
export type Status = 'new' | 'in_review' | 'shortlisted' | 'accepted' | 'rejected' | 'needs_info'

export const STATUS_LABEL: Record<Status, string> = {
  new: 'חדשה',
  in_review: 'בבדיקה',
  shortlisted: 'מועמדת להמשך',
  accepted: 'התקבלה',
  rejected: 'נדחתה',
  needs_info: 'נדרשת השלמת מידע',
}
export const STATUS_COLOR: Record<Status, string> = {
  new: 'bg-[#fee801] text-black',
  in_review: 'bg-[#cfe3ff] text-black',
  shortlisted: 'bg-[#e13d96] text-white',
  accepted: 'bg-[#1f7a3d] text-white',
  rejected: 'bg-[#555] text-white',
  needs_info: 'bg-[#ffd2a8] text-black',
}
export const ROLE_LABEL: Record<Role, string> = { admin: 'מנהל.ת', editor: 'עורך.ת תוכן', reviewer: 'בודק.ת הגשות' }

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function handle<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(data.error ?? 'משהו השתבש. נסו שוב.', r.status)
  return data as T
}

export const apiGet = <T>(route: string, params: Record<string, string> = {}) =>
  fetch(`/api/admin?${new URLSearchParams({ route, ...params })}`, { credentials: 'same-origin' }).then((r) => handle<T>(r))

export const apiPost = <T>(route: string, body: unknown = {}) =>
  fetch(`/api/admin?route=${route}`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-medorot': '1' }, body: JSON.stringify(body) }).then((r) => handle<T>(r))

export const uploadMedia = (file: File, alt = '') =>
  fetch(`/api/admin?${new URLSearchParams({ route: 'media', name: file.name, alt })}`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': file.type, 'x-medorot': '1' }, body: file }).then((r) =>
    handle<{ id: string; src: string }>(r),
  )

export const fileUrl = (id: string, n: number, download = false) => `/api/admin?${new URLSearchParams({ route: 'file', id, n: String(n), ...(download ? { download: '1' } : {}) })}`

export const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`)
