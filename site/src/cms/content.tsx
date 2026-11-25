import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SEED, type SiteContent } from '../content'
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
  return out as StoredContent
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
