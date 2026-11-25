import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DONATION_COMMENT, SEED, type SiteContent } from '../content'
import { useLang } from '../i18n/lang'
import { localizeContent, type StoredContent } from '../i18n/localize'

// One source of truth for public content. Pages read it through useContent(); the provider swaps the seed for the
// published CMS version (GET /api/content). With ?preview=<draft id> a signed-in team member sees that draft instead.
// Without a provider (the concept prototypes) the seed is used as-is.
// useContent() gives the content in the current site language (English: src/i18n/localize.ts); useSourceContent()
// gives the published Hebrew document itself, for values that are stored as they are (the form's stage answers).
type Value = { source: StoredContent; shown: SiteContent }
const Ctx = createContext<Value>({ source: SEED, shown: SEED })

export const useContent = () => useContext(Ctx).shown
export const useSourceContent = () => useContext(Ctx).source

// A saved version may predate newly added fields: fill gaps from the seed, one level deep.
export function withSeed(published: Partial<StoredContent>): StoredContent {
  const out = { ...SEED } as Record<string, unknown>
  for (const [k, v] of Object.entries(published)) {
    const base = (SEED as Record<string, unknown>)[k]
    out[k] = base && typeof base === 'object' && !Array.isArray(base) && v && typeof v === 'object' && !Array.isArray(v) ? { ...base, ...v } : v
  }
  return migrateLegacy(out as StoredContent)
}

// 25.11.2026: the team renamed "תרומה" (donation) to "תמיכה בפסטיבל" everywhere and dropped the reply-date promise.
// Versions published before that still hold the old wording; show the current seed text instead, so the site never
// says "תרומה" or promises a reply schedule. The payment link always pre-fills iCredit's "תשלום עבור" field.
const OLD_WORDING = /תרומ/
function migrateLegacy(c: StoredContent): StoredContent {
  const support = { ...c.support }
  if (OLD_WORDING.test(support.button)) support.button = SEED.support.button
  if (OLD_WORDING.test(support.notLive)) support.notLive = SEED.support.notLive
  support.paragraphs = support.paragraphs.map((p, i) => (OLD_WORDING.test(p) ? (SEED.support.paragraphs[i] ?? p.replace(/תרומה/g, 'תמיכה בפסטיבל')) : p))
  const lines = c.confirmation.lines.map((l, i) => (/לוח הזמנים שיפורסם/.test(l) ? (SEED.confirmation.lines[i] ?? l) : l))
  const settings = { ...c.settings, donationUrl: withComment(c.settings.donationUrl) }
  const nav = c.nav.map((n) => (n.id === 'support' && /שותפות ותמיכה|תרומ/.test(n.label) ? (SEED.nav.find((s) => s.id === 'support') ?? n) : n))
  return { ...c, nav, support, confirmation: { ...c.confirmation, lines }, settings }
}
function withComment(url: string | null): string | null {
  if (!url || !/icredit\.rivhit\.co\.il\/payment\/DonationPage\.aspx/i.test(url) || /[?&]Comments=/i.test(url)) return url
  return `${url}&Comments=${encodeURIComponent(DONATION_COMMENT)}`
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const { lang, t } = useLang()
  const [content, setContent] = useState<StoredContent>(SEED)
  const [preview] = useState(() => new URLSearchParams(window.location.search).get('preview'))
  const [previewError, setPreviewError] = useState('')
  useEffect(() => {
    let alive = true
    const url = preview ? `/api/admin?route=preview&id=${encodeURIComponent(preview)}` : '/api/content'
    fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      .then(async (r) => {
        if (preview && !r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? '')
        return r.ok && r.status !== 204 ? r.json() : null
      })
      .then((data) => {
        if (alive && data?.content) setContent(withSeed(data.content))
      })
      .catch((e) => alive && preview && setPreviewError(e.message || ' ')) // without a backend (or offline) the seed stays
    return () => {
      alive = false
    }
  }, [preview])
  const value = useMemo(() => ({ source: content, shown: lang === 'en' ? localizeContent(content) : content }), [content, lang])
  return (
    <Ctx.Provider value={value}>
      {preview && (
        <div role="status" className="fixed bottom-3 inset-x-3 z-[150] mx-auto max-w-xl rounded-lg bg-black text-white px-4 py-3 text-base shadow-xl flex items-center gap-3">
          <span className="font-bold text-[#fee801]">{t.preview.title}</span>
          <span className="flex-1">{previewError ? (lang === 'he' && previewError.trim() ? previewError : t.preview.failed) : t.preview.note}</span>
        </div>
      )}
      {children}
    </Ctx.Provider>
  )
}
