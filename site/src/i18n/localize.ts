// Builds the English version of the site content from the published (Hebrew) CMS content. Structure, links, images,
// numbers and switches always come from the published content; only the words are swapped. Rules: src/i18n/content.en.ts.
import { SEED, type SiteContent } from '../content'
import type { UiOverrides } from '../shared/uiOverrides'
import { EN_SEED, MEMORY, type EnContent, type EnOverrides } from './content.en'

// en: English of the CMS texts; ui: replacements for the fixed site texts ("All site texts", src/i18n/ui.ts)
export type StoredContent = SiteContent & { en?: EnOverrides; ui?: UiOverrides }

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const file = (src: string) => src.split('/').pop() ?? src

// Hebrew -> English: every seed text paired with its built-in English, plus the MEMORY of other published wordings
const TM = new Map<string, string>()
const pair = (he: unknown, en: unknown) => {
  if (typeof he === 'string' && typeof en === 'string') {
    if (norm(he)) TM.set(norm(he), en)
  } else if (Array.isArray(he) && Array.isArray(en) && he.length === en.length) he.forEach((h, i) => pair(h, en[i]))
  else if (he && en && typeof he === 'object' && typeof en === 'object')
    for (const k of Object.keys(en)) pair((he as Record<string, unknown>)[k], (en as Record<string, unknown>)[k])
}
pair(
  { ...SEED, nav: undefined, spaces: undefined, partners: undefined, openCall: { ...SEED.openCall, stages: undefined } },
  { ...EN_SEED, nav: undefined, spaces: undefined, partners: undefined, openCall: { ...EN_SEED.openCall, stages: undefined } },
)
SEED.nav.forEach((n) => pair(n.label, EN_SEED.nav[n.id]))
SEED.openCall.stages.forEach((s) => pair(s, EN_SEED.openCall.stages[s.id as keyof EnContent['openCall']['stages']]))
SEED.spaces.forEach((s) => {
  const en = EN_SEED.spaces[s.id as keyof EnContent['spaces']]
  pair(s.name, en?.name)
  pair(s.desc, en?.desc)
  s.photos.forEach((p) => pair(p.alt, en?.photos[file(p.src)]))
})
SEED.partners.forEach((p) => pair(p.name, EN_SEED.partners[file(p.src)]))
for (const [h, e] of Object.entries(MEMORY)) TM.set(norm(h), e)

/** The exact English for a Hebrew text, if one is known. */
export const translate = (he: string): string | undefined => (norm(he) ? TM.get(norm(he)) : '')

type Miss = string[]
const text = (miss: Miss, path: string, he: string, own: string | undefined, fallback: string | undefined): string => {
  if (own?.trim()) return own
  const exact = translate(he)
  if (exact !== undefined) return exact
  miss.push(path)
  return fallback ?? he
}
const list = (miss: Miss, path: string, he: string[], own: string[] | undefined, fallback: string[] | undefined): string[] => {
  if (own?.length) return own
  const out = he.map(translate)
  if (out.every((x) => x !== undefined)) return out as string[]
  miss.push(path)
  return fallback ?? he
}
// every string / string-list field of a flat section
function section<T extends object>(miss: Miss, path: string, he: T, own: object | undefined, fallback: object | undefined): T {
  const o = (own ?? {}) as Record<string, unknown>
  const f = (fallback ?? {}) as Record<string, unknown>
  const out = { ...he } as Record<string, unknown>
  for (const [k, v] of Object.entries(he)) {
    if (typeof v === 'string') out[k] = text(miss, `${path}.${k}`, v, o[k] as string | undefined, f[k] as string | undefined)
    else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) out[k] = list(miss, `${path}.${k}`, v, o[k] as string[] | undefined, f[k] as string[] | undefined)
  }
  return out as T
}

const cache = new WeakMap<object, SiteContent>()

/** The site content in English. Paths that fell back to built-in English (or Hebrew) are logged in development. */
export function localizeContent(c: StoredContent): SiteContent {
  const hit = cache.get(c)
  if (hit) return hit
  const o: EnOverrides = c.en ?? {}
  const miss: Miss = []
  const B = EN_SEED
  // facts (dates, venue): an exact translation or the CMS value itself, never an older English text
  const fact = (k: keyof EnContent['settings']) => text(miss, `settings.${k}`, c.settings[k], o.settings?.[k], undefined)

  const out: SiteContent = {
    ...c,
    festival: text(miss, 'festival', c.festival, o.festival, B.festival),
    tagline: text(miss, 'tagline', c.tagline, o.tagline, B.tagline),
    settings: { ...c.settings, festivalDate: fact('festivalDate'), deadline: fact('deadline'), responseDate: fact('responseDate'), venue: fact('venue') },
    nav: c.nav.map((n) => ({ ...n, label: text(miss, `nav.${n.id}`, n.label, o.nav?.[n.id], B.nav[n.id]) })),
    navHint: text(miss, 'navHint', c.navHint, o.navHint, B.navHint),
    home: section(miss, 'home', c.home, o.home, B.home),
    about: section(miss, 'about', c.about, o.about, B.about),
    openCall: {
      ...section(miss, 'openCall', c.openCall, o.openCall, B.openCall),
      stages: c.openCall.stages.map((s) => {
        const f = B.openCall.stages[s.id as keyof EnContent['openCall']['stages']]
        const own = o.openCall?.stages?.[s.id as keyof EnContent['openCall']['stages']]
        return { ...s, label: text(miss, `openCall.stages.${s.id}.label`, s.label, own?.label, f?.label), desc: text(miss, `openCall.stages.${s.id}.desc`, s.desc, own?.desc, f?.desc) }
      }),
    },
    spaces: c.spaces.map((s) => {
      const f = B.spaces[s.id as keyof EnContent['spaces']]
      const own = o.spaces?.[s.id]
      const name = text(miss, `spaces.${s.id}.name`, s.name, own?.name, f?.name)
      return {
        ...s,
        name,
        desc: text(miss, `spaces.${s.id}.desc`, s.desc, own?.desc, f?.desc),
        // a photo without English alt text gets a plain description rather than Hebrew
        photos: s.photos.map((p, i) => ({ ...p, alt: own?.photos?.[file(p.src)]?.trim() || translate(p.alt) || f?.photos[file(p.src)] || `${name}, photo ${i + 1}` })),
      }
    }),
    support: section(miss, 'support', c.support, o.support, B.support),
    finalCta: section(miss, 'finalCta', c.finalCta, o.finalCta, B.finalCta),
    confirmation: section(miss, 'confirmation', c.confirmation, o.confirmation, B.confirmation),
    partners: c.partners.map((p) => ({ ...p, name: o.partners?.[file(p.src)]?.trim() || translate(p.name) || B.partners[file(p.src)] || (/[֐-׿]/.test(p.name) ? 'Festival partner' : p.name) })),
    // approved legal texts: only an English text approved in the CMS; otherwise the built-in English translation
    legal: { privacy: o.legal?.privacy?.trim() ? o.legal.privacy : null, accessibility: o.legal?.accessibility?.trim() ? o.legal.accessibility : null },
  }
  if (import.meta.env?.DEV && miss.length) console.warn('[i18n] CMS texts without an exact English translation (showing built-in English, or Hebrew for dates and places):', miss)
  cache.set(c, out)
  return out
}
