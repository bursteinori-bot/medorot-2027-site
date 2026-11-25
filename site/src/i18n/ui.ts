// "All site texts": every fixed text of the public site (src/i18n/he.ts and en.ts) can be replaced from the admin.
// The replacements are stored in the CMS content document under `ui` (shape: src/shared/uiOverrides.ts), per language,
// keyed by the dotted path of the text in the dictionary: 'form.name', 'form.steps.0', 'form.locations.פטיו',
// 'legal.privacy.sections.2.body.0.list.1'. useT() / useLang().t give the dictionary with the published replacements
// applied (inside the public site's ContentProvider).
//   - A replacement whose key no longer exists in the code is ignored.
//   - Texts with values in them (functions in the dictionary) are replaced by a template with {placeholders}, e.g.
//     'photosHint': '{n} צילומים'. Unknown {names} stay as they are. FN_PARAMS lists which ones are editable.
//   - A text that is the same in both languages (an e-mail, a phone number, a date) is language-neutral: its Hebrew
//     replacement is used on the English site too, unless an English one was saved.
//   - Content without `ui` gives the dictionaries exactly as written in the code.
// The admin's own texts (`admin`) are not part of this. Stored applicant answers never change: form options are
// stored by their Hebrew value, only the label shown next to each option is a text here.
import type { UiOverrides, UiTexts } from '../shared/uiOverrides'
import { en } from './en'
import { he, type Dict } from './he'

type Lang = 'he' | 'en'

/** Function texts that can be edited, with the names of their {placeholders} in argument order. */
export const FN_PARAMS: Record<string, string[]> = {
  'site.room': ['n'],
  'site.enlarge': ['alt'],
  'site.photosHint': ['n'],
  'support.amount': ['n'],
  'support.chosen': ['n'],
  'support.instagram': ['handle'],
  'sculpture.swap': ['part'],
  'form.stepStatus': ['n', 'name'],
  'form.words': ['n', 'max'],
  'form.uploadRules': ['imageMb', 'mb', 'files'],
  'form.filesToSend': ['n'],
  'form.errorCount': ['n'],
  'form.uploaded': ['pct'],
  'form.ready': ['mb'],
  'form.removeAria': ['name'],
  'form.closedText': ['deadline'],
  'issues.fileTooBig': ['mb'],
  'issues.fileTooBigLink': ['mb'],
  'errors.uploadFailed': ['name'],
  'errors.uploadNetwork': ['name'],
  'errors.server.fileTooBig': ['mb'],
  'errors.server.filesMissing': ['files'],
}

// never offered: the admin's own texts, technical values (language codes, date locale), arrows, the hidden bot-trap
// label, and the design prototypes' placeholder (only on /concepts)
const SKIP = ['admin', 'toggle.textLang', 'meta.ogLocale', 'legal.dateLocale', 'brand.fwd', 'brand.back', 'form.honeypot', 'concepts']
const skipped = (k: string) => SKIP.some((p) => k === p || k.startsWith(`${p}.`))

export type UiEntry = {
  key: string
  /** the text in the code (for a function: its template with {placeholders}); undefined = not in that language */
  he?: string
  en?: string
  params?: string[]
  /** a function text that has no template (its wording depends on its values) */
  fixed?: boolean
}

const template = (fn: (...a: string[]) => unknown, params: string[]) => {
  try {
    const out = fn(...params.map((p) => `{${p}}`))
    return typeof out === 'string' ? out : undefined
  } catch {
    return undefined
  }
}

function walk(node: unknown, path: string, out: Map<string, UiEntry>, lang: Lang) {
  if (path && skipped(path)) return
  const at = (k: string) => {
    let e = out.get(k)
    if (!e) out.set(k, (e = { key: k }))
    return e
  }
  if (typeof node === 'string') at(path)[lang] = node
  else if (typeof node === 'function') {
    const e = at(path)
    const params = FN_PARAMS[path]
    if (params) {
      e.params = params
      e[lang] = template(node as (...a: string[]) => unknown, params)
    } else e.fixed = true
  } else if (Array.isArray(node)) node.forEach((x, i) => walk(x, path ? `${path}.${i}` : String(i), out, lang))
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, out, lang)
}

/** Every editable text of the site, in dictionary order, with its Hebrew and English defaults. */
export const UI_ENTRIES: UiEntry[] = (() => {
  const m = new Map<string, UiEntry>()
  walk(he, '', m, 'he')
  walk(en, '', m, 'en')
  return [...m.values()]
})()
const BY_KEY = new Map(UI_ENTRIES.map((e) => [e.key, e]))

// Where each text appears, for the admin's grouping (the longest matching prefix wins; anything else is "other").
export const UI_GROUPS = ['header', 'meta', 'home', 'about', 'openCall', 'spaces', 'form', 'formOptions', 'formErrors', 'support', 'details', 'footer', 'sculpture', 'legalDetails', 'privacy', 'accessibility', 'other'] as const
export type UiGroup = (typeof UI_GROUPS)[number]
const GROUP_OF: [string, UiGroup][] = [
  ['toggle', 'header'], ['site.skip', 'header'], ['site.homeLink', 'header'], ['site.mainNav', 'header'], ['site.room', 'header'], ['site.sculpture', 'header'], ['mobileNav', 'header'], ['brand.logoAlt', 'header'], ['brand.logoMarkAlt', 'header'],
  ['meta', 'meta'],
  ['brand', 'home'], ['site.festivalDate', 'home'], ['site.deadline', 'home'], ['site.venue', 'home'],
  ['site.keyWords', 'about'], ['site.toOpenCall', 'about'],
  ['site.disciplines', 'openCall'], ['site.who', 'openCall'], ['site.what', 'openCall'], ['site.spaces', 'openCall'], ['site.toSpacePhotos', 'openCall'], ['site.apply', 'openCall'],
  ['site.enlarge', 'spaces'], ['site.photosHint', 'spaces'], ['lightbox', 'spaces'],
  ['site.applyIntro', 'form'], ['site.loadingForm', 'form'], ['form', 'form'],
  ['form.identities', 'formOptions'], ['form.disciplineOptions', 'formOptions'], ['form.locations', 'formOptions'],
  ['issues', 'formErrors'], ['errors', 'formErrors'],
  ['support', 'support'],
  ['info', 'details'],
  ['site.footerNav', 'footer'], ['site.privacy', 'footer'], ['site.accessibility', 'footer'], ['site.instagram', 'footer'],
  ['sculpture', 'sculpture'],
  ['legalDetails', 'legalDetails'], ['legal', 'legalDetails'],
  ['legal.privacy', 'privacy'], ['legal.accessibility', 'accessibility'],
]
export function groupOf(key: string): UiGroup {
  let best: [string, UiGroup] | undefined
  for (const g of GROUP_OF) if ((key === g[0] || key.startsWith(`${g[0]}.`)) && (!best || g[0].length > best[0].length)) best = g
  return best?.[1] ?? 'other'
}

/** texts identical in both languages (contact details, numbers, dates): one Hebrew edit covers both */
export const isNeutral = (e: UiEntry) => !!e.he && e.he === e.en

/** The replacements that apply in a language (English also takes Hebrew replacements of language-neutral texts). */
export function effective(ui: UiOverrides | undefined, lang: Lang): UiTexts {
  const own = ui?.[lang] ?? {}
  if (lang === 'he' || !ui?.he) return own
  const out: UiTexts = {}
  for (const [k, v] of Object.entries(ui.he)) {
    const e = BY_KEY.get(k)
    if (e && isNeutral(e)) out[k] = v
  }
  return { ...out, ...own }
}

const fill = (tpl: string, params: string[]) => (...args: unknown[]) =>
  tpl.replace(/\{(\w+)\}/g, (m, name: string) => {
    const i = params.indexOf(name)
    return i >= 0 && i < args.length ? String(args[i]) : m
  })

function apply(node: unknown, path: string, ov: UiTexts): unknown {
  if (path && skipped(path)) return node
  if (typeof node === 'string') {
    const v = ov[path]
    return typeof v === 'string' && v.trim() ? v : node
  }
  if (typeof node === 'function') {
    const v = ov[path]
    const params = FN_PARAMS[path]
    return params && typeof v === 'string' && v.trim() ? fill(v, params) : node
  }
  if (Array.isArray(node)) {
    let changed = false
    const out = node.map((x, i) => {
      const y = apply(x, path ? `${path}.${i}` : String(i), ov)
      if (y !== x) changed = true
      return y
    })
    return changed ? out : node
  }
  if (node && typeof node === 'object') {
    let changed = false
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(node)) {
      const y = apply(x, path ? `${path}.${k}` : k, ov)
      if (y !== x) changed = true
      out[k] = y
    }
    return changed ? out : node
  }
  return node
}

const cache = new WeakMap<object, Map<string, Dict>>()
/** The dictionary with the published replacements applied (the same object when there are none). */
export function withUi(dict: Dict, ui: UiOverrides | undefined, lang: Lang): Dict {
  const ov = effective(ui, lang)
  if (!Object.keys(ov).length) return dict
  const memo = ui ? cache.get(ui) : undefined
  const hit = memo?.get(lang)
  if (hit) return hit
  const out = apply(dict, '', ov) as Dict
  if (ui) {
    const m = memo ?? new Map<string, Dict>()
    m.set(lang, out)
    if (!memo) cache.set(ui, m)
  }
  return out
}

/** Before saving: drop empty replacements and ones identical to the text in the code. Unknown keys are kept. */
export function tidyUi(ui: UiOverrides | undefined): UiOverrides | undefined {
  if (!ui) return undefined
  const pick = (lang: Lang) => {
    const out: UiTexts = {}
    for (const [k, v] of Object.entries(ui[lang] ?? {})) {
      if (typeof v !== 'string' || !v.trim()) continue
      const e = BY_KEY.get(k)
      if (e && v === e[lang]) continue
      out[k] = v
    }
    return Object.keys(out).length ? out : undefined
  }
  const h = pick('he')
  const e = pick('en')
  return h || e ? { ...(h && { he: h }), ...(e && { en: e }) } : undefined
}
