// "All site texts" (ניהול תוכן ← כל הטקסטים באתר): the team's replacements for the fixed site texts of src/i18n/he.ts
// and en.ts, stored in the CMS content document as `ui: { he: { 'form.name': '...' }, en: { ... } }` (key = the dotted
// path of the text in the dictionary). This file holds only the shape and its limits, so the server (api/admin.ts)
// and the dev mock can check what is saved; applying them to the dictionaries is src/i18n/ui.ts.
import { z } from 'zod'

export type UiTexts = Record<string, string>
export type UiOverrides = { he?: UiTexts; en?: UiTexts }

export const UI_LIMITS = {
  maxKeys: 2000, // per language; the dictionaries have a few hundred texts
  maxKeyLength: 200,
  maxTextLength: 6000, // the longest legal paragraph is under 1,000 characters
}

const texts = z
  .record(z.string().min(1).max(UI_LIMITS.maxKeyLength), z.string().max(UI_LIMITS.maxTextLength))
  .refine((m) => Object.keys(m).length <= UI_LIMITS.maxKeys, 'too many texts')

/** what may be stored under `ui` (absent is fine: old versions have no `ui`) */
export const uiOverridesSchema = z.object({ he: texts.optional(), en: texts.optional() }).strict()

/** Keep only string texts with string keys. Anything else in a stored `ui` (older or hand-edited data) is dropped. */
export function cleanUi(v: unknown): UiOverrides | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const pick = (m: unknown): UiTexts | undefined => {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return undefined
    const out: UiTexts = {}
    for (const [k, x] of Object.entries(m)) if (typeof x === 'string' && x.trim()) out[k] = x
    return Object.keys(out).length ? out : undefined
  }
  const he = pick((v as UiOverrides).he)
  const en = pick((v as UiOverrides).en)
  return he || en ? { ...(he && { he }), ...(en && { en }) } : undefined
}
