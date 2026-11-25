// The application form's fields and rules, shared by the browser (step-by-step validation) and the server
// (api/applications/*), so both enforce exactly the same thing.
import { z } from 'zod'

export const IDENTITIES = ['סטודנט.ית', 'אמן.ית בתחילת הדרך', 'אמן.ית פעיל.ה', 'קולקטיב / קבוצה', 'אחר'] as const
export const DISCIPLINES = ['מחול', 'פרפורמנס', 'אמנות פלסטית', 'תיאטרון', 'מוזיקה / סאונד', 'וידאו / קולנוע', 'מיצב / אמנות במרחב', 'אחר'] as const
export const LOCATIONS = ['חלל בית הכנסת המרכזי', 'גלריה 1/2', 'פטיו', 'פתוח להצעות'] as const
export const STAGES = ['רעיון ראשוני', 'בתהליך פיתוח', 'עבודה קיימת', 'יצירה חדשה לפסטיבל'] as const

// Central upload policy: shown to applicants before they upload, and enforced again on the server.
// Files are stored in the database, so each is capped at 4MB (one server request). Photos are shrunk in the browser
// first, so a phone photo of up to 30MB still fits; long videos go in as links.
export const UPLOAD = {
  maxFiles: 8,
  maxMb: 4,
  maxImageSourceMb: 30,
  exts: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4', 'mov'],
  mimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime'],
}
export const isShrinkableImage = (type: string) => ['image/jpeg', 'image/png', 'image/webp'].includes(type)

export const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

const REQ = 'זה שדה חובה'
const req = (max = 300) => z.string().trim().min(1, REQ).max(max, 'הטקסט ארוך מדי')
const maxWords = (n: number, what: string) => (s: string) => words(s) <= n || { message: `${what} ארוך ב-${words(s) - n} מילים מהמותר (עד ${n} מילים)` }
const wordLimit = (n: number, what: string) =>
  z.string().trim().min(1, REQ).max(n * 20).superRefine((s, ctx) => {
    const r = maxWords(n, what)(s)
    if (r !== true) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message })
  })
const urlish = /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/

export const step1 = z
  .object({
    name: req(120),
    email: z.string().trim().min(1, REQ).max(200).email('כתובת האימייל לא נראית תקינה. בדקו שיש בה @ ונקודה, למשל name@example.com'),
    phone: z.string().trim().min(1, REQ).max(30).refine((s) => s.replace(/\D/g, '').length >= 9, 'מספר הטלפון קצר מדי. כתבו מספר מלא, למשל 050-1234567'),
    age: z.string().trim().min(1, REQ).regex(/^\d{1,3}$/, 'כתבו גיל במספרים בלבד').refine((s) => +s >= 1 && +s <= 120, 'כתבו גיל במספרים בלבד'),
    city: req(120),
    identity: z.enum(IDENTITIES, { errorMap: () => ({ message: 'בחרו אפשרות אחת' }) }),
    identityOther: z.string().trim().max(200),
    bio: wordLimit(150, 'הטקסט'),
  })
  .superRefine((d, ctx) => {
    if (d.identity === 'אחר' && !d.identityOther) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['identityOther'], message: 'ספרו לנו במילה או שתיים' })
  })

export const step2 = z
  .object({
    project: req(200),
    disciplines: z.array(z.enum(DISCIPLINES)).min(1, 'בחרו לפחות תחום אחד').max(DISCIPLINES.length),
    disciplineOther: z.string().trim().max(200),
    description: wordLimit(300, 'התיאור'),
    location: z.enum(LOCATIONS, { errorMap: () => ({ message: 'בחרו אפשרות אחת' }) }),
    locationOther: z.string().trim().max(200).optional().default(''), // no longer asked; kept so older drafts still validate
    jewish: req(6000),
    stage: z.enum(STAGES, { errorMap: () => ({ message: 'בחרו את השלב שהכי מתאים' }) }),
  })
  .superRefine((d, ctx) => {
    if (d.disciplines.includes('אחר') && !d.disciplineOther) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['disciplineOther'], message: 'איזה תחום?' })
  })

export const step3 = z.object({
  portfolio: z.string().trim().min(1, 'זה שדה חובה. הדביקו קישור לתיק העבודות').max(500).refine((s) => urlish.test(s), 'הקישור לא נראה תקין. הדביקו כתובת מלאה, למשל https://...'),
  social: z.string().trim().max(500).optional().default('').refine((s) => !s || urlish.test(s), 'הקישור לא נראה תקין'),
  links: z.string().trim().max(3000),
})

export const step4 = z.object({
  notes: z.string().trim().max(6000),
  privacy: z.literal(true, { errorMap: () => ({ message: 'כדי לשלוח צריך לאשר את מדיניות הפרטיות' }) }),
})

export const STEP_SCHEMAS = [step1, step2, step3, step4] as const

export const applicationSchema = z.intersection(z.intersection(step1, step2), z.intersection(step3, step4))
export type Application = z.infer<typeof applicationSchema>

export const fileMetaSchema = z
  .object({ name: z.string().min(1).max(255), size: z.number().int().positive(), type: z.string().max(100) })
  .superRefine((f, ctx) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!UPLOAD.exts.includes(ext) || (f.type && !UPLOAD.mimes.includes(f.type))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'סוג קובץ שלא נתמך' })
    if (f.size > UPLOAD.maxMb * 1024 * 1024) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `הקובץ גדול מ-${UPLOAD.maxMb}MB` })
  })

// what the browser sends to POST /api/applications/start
export const startSchema = z.object({
  key: z.string().uuid(), // idempotency key: a retry of the same submission never creates a second application
  answers: applicationSchema,
  files: z.array(fileMetaSchema).max(UPLOAD.maxFiles),
  website: z.string().max(500).optional(), // honeypot: humans never see or fill it; the server rejects it quietly
  startedAt: z.number().int(), // when the form was opened; instant submissions are bots
})
export type StartRequest = z.infer<typeof startSchema>

// zod issues -> { field: first message } (server paths like ["answers", "email"] map to the form's "email")
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of error.issues) {
    const path = i.path[0] === 'answers' ? i.path.slice(1) : i.path
    const k = String(path[0] ?? 'form')
    if (!out[k]) out[k] = i.message
  }
  return out
}
