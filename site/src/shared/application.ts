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

// Validation messages are language-neutral codes ("required", "words:text:12:150"). The server turns them into the
// Hebrew texts below (exactly as before) and also returns the raw codes, so the browser can show each message in the
// visitor's language (src/i18n). A message that is not one of our codes (a zod default) is shown as it is.
export const HE_ISSUES = {
  required: 'זה שדה חובה',
  tooLong: 'הטקסט ארוך מדי',
  email: 'כתובת האימייל לא נראית תקינה. בדקו שיש בה @ ונקודה, למשל name@example.com',
  phone: 'מספר הטלפון קצר מדי. כתבו מספר מלא, למשל 050-1234567',
  age: 'כתבו גיל במספרים בלבד',
  chooseOne: 'בחרו אפשרות אחת',
  identityOther: 'ספרו לנו במילה או שתיים',
  disciplines: 'בחרו לפחות תחום אחד',
  disciplineOther: 'איזה תחום?',
  stage: 'בחרו את השלב שהכי מתאים',
  portfolioRequired: 'זה שדה חובה. הדביקו קישור לתיק העבודות',
  portfolioUrl: 'הקישור לא נראה תקין. הדביקו כתובת מלאה, למשל https://...',
  socialUrl: 'הקישור לא נראה תקין',
  privacy: 'כדי לשלוח צריך לאשר את מדיניות הפרטיות',
  fileType: 'סוג קובץ שלא נתמך',
  fileTooBig: (mb: number) => `הקובץ גדול מ-${mb}MB`,
  fileTooBigLink: (mb: number) => `הקובץ גדול מ-${mb}MB. אפשר להדביק קישור אליו בשדה הקישורים למטה`,
  filesBlocked: 'יש קבצים שלא יכולים לעלות. הסירו אותם או החליפו.',
  words: (what: 'text' | 'description', over: number, max: number) => `${what === 'text' ? 'הטקסט' : 'התיאור'} ארוך ב-${over} מילים מהמותר (עד ${max} מילים)`,
  // a field rejected by an older server that sent only Hebrew text
  check: 'בדקו את השדה הזה',
}
export type IssueMessages = typeof HE_ISSUES
export type IssueCode = keyof IssueMessages

// "code" or "code:arg:arg" -> text in the given language; anything else passes through unchanged
export function formatIssue(token: string, m: IssueMessages): string {
  const [code, ...a] = token.split(':')
  switch (code as IssueCode) {
    case 'fileTooBig':
    case 'fileTooBigLink':
      return m[code as 'fileTooBig' | 'fileTooBigLink'](Number(a[0]))
    case 'words':
      return m.words(a[0] === 'description' ? 'description' : 'text', Number(a[1]), Number(a[2]))
    default: {
      const v = (m as Record<string, unknown>)[code]
      return typeof v === 'string' && a.length === 0 ? v : token
    }
  }
}

const REQ = 'required'
const req = (max = 300) => z.string().trim().min(1, REQ).max(max, 'tooLong')
const wordLimit = (n: number, what: 'text' | 'description') =>
  z.string().trim().min(1, REQ).max(n * 20).superRefine((s, ctx) => {
    if (words(s) > n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `words:${what}:${words(s) - n}:${n}` })
  })
const urlish = /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/

export const step1 = z
  .object({
    name: req(120),
    email: z.string().trim().min(1, REQ).max(200).email('email'),
    phone: z.string().trim().min(1, REQ).max(30).refine((s) => s.replace(/\D/g, '').length >= 9, 'phone'),
    age: z.string().trim().min(1, REQ).regex(/^\d{1,3}$/, 'age').refine((s) => +s >= 1 && +s <= 120, 'age'),
    city: req(120),
    identity: z.enum(IDENTITIES, { errorMap: () => ({ message: 'chooseOne' }) }),
    identityOther: z.string().trim().max(200),
    bio: wordLimit(150, 'text'),
  })
  .superRefine((d, ctx) => {
    if (d.identity === 'אחר' && !d.identityOther) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['identityOther'], message: 'identityOther' })
  })

export const step2 = z
  .object({
    project: req(200),
    disciplines: z.array(z.enum(DISCIPLINES)).min(1, 'disciplines').max(DISCIPLINES.length),
    disciplineOther: z.string().trim().max(200),
    description: wordLimit(300, 'description'),
    location: z.enum(LOCATIONS, { errorMap: () => ({ message: 'chooseOne' }) }),
    locationOther: z.string().trim().max(200).optional().default(''), // no longer asked; kept so older drafts still validate
    jewish: req(6000),
    stage: z.enum(STAGES, { errorMap: () => ({ message: 'stage' }) }),
  })
  .superRefine((d, ctx) => {
    if (d.disciplines.includes('אחר') && !d.disciplineOther) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['disciplineOther'], message: 'disciplineOther' })
  })

export const step3 = z.object({
  portfolio: z.string().trim().min(1, 'portfolioRequired').max(500).refine((s) => urlish.test(s), 'portfolioUrl'),
  social: z.string().trim().max(500).optional().default('').refine((s) => !s || urlish.test(s), 'socialUrl'),
  links: z.string().trim().max(3000),
})

export const step4 = z.object({
  notes: z.string().trim().max(6000),
  privacy: z.literal(true, { errorMap: () => ({ message: 'privacy' }) }),
})

export const STEP_SCHEMAS = [step1, step2, step3, step4] as const

export const applicationSchema = z.intersection(z.intersection(step1, step2), z.intersection(step3, step4))
export type Application = z.infer<typeof applicationSchema>

export const fileMetaSchema = z
  .object({ name: z.string().min(1).max(255), size: z.number().int().positive(), type: z.string().max(100) })
  .superRefine((f, ctx) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!UPLOAD.exts.includes(ext) || (f.type && !UPLOAD.mimes.includes(f.type))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'fileType' })
    if (f.size > UPLOAD.maxMb * 1024 * 1024) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `fileTooBig:${UPLOAD.maxMb}` })
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

// zod issues -> { field: first message code } (server paths like ["answers", "email"] map to the form's "email")
export function fieldCodes(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of error.issues) {
    const path = i.path[0] === 'answers' ? i.path.slice(1) : i.path
    const k = String(path[0] ?? 'form')
    if (!out[k]) out[k] = i.message
  }
  return out
}

// the same, as texts (Hebrew by default: what the server has always returned in `fields`)
export function fieldErrors(error: z.ZodError, m: IssueMessages = HE_ISSUES): Record<string, string> {
  return Object.fromEntries(Object.entries(fieldCodes(error)).map(([k, code]) => [k, formatIssue(code, m)]))
}
