import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { SEED, type SiteContent } from '../content'

// One source of truth for public content. Pages read it through useContent(); the provider swaps the seed for the
// published CMS version (GET /api/content). With ?preview=<draft id> a signed-in team member sees that draft instead.
// Without a provider (the concept prototypes) the seed is used as-is.
const Ctx = createContext<SiteContent>(SEED)

export const useContent = () => useContext(Ctx)

// A saved version may predate newly added fields: fill gaps from the seed, one level deep.
export function withSeed(published: Partial<SiteContent>): SiteContent {
  const out = { ...SEED } as Record<string, unknown>
  for (const [k, v] of Object.entries(published)) {
    const base = (SEED as Record<string, unknown>)[k]
    out[k] = base && typeof base === 'object' && !Array.isArray(base) && v && typeof v === 'object' && !Array.isArray(v) ? { ...base, ...v } : v
  }
  return out as SiteContent
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(SEED)
  const [preview] = useState(() => new URLSearchParams(window.location.search).get('preview'))
  const [previewError, setPreviewError] = useState('')
  useEffect(() => {
    let alive = true
    const url = preview ? `/api/admin?route=preview&id=${encodeURIComponent(preview)}` : '/api/content'
    fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      .then(async (r) => {
        if (preview && !r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'לא ניתן לטעון את הטיוטה')
        return r.ok && r.status !== 204 ? r.json() : null
      })
      .then((data) => {
        if (alive && data?.content) setContent(withSeed(data.content))
      })
      .catch((e) => alive && preview && setPreviewError(e.message)) // without a backend (or offline) the seed stays
    return () => {
      alive = false
    }
  }, [preview])
  return (
    <Ctx.Provider value={content}>
      {preview && (
        <div role="status" className="fixed bottom-3 inset-x-3 z-[150] mx-auto max-w-xl rounded-lg bg-black text-white px-4 py-3 text-base shadow-xl flex items-center gap-3">
          <span className="font-bold text-[#fee801]">תצוגה מקדימה</span>
          <span className="flex-1">{previewError || 'כך ייראה האתר עם הטיוטה. מבקרים עדיין רואים את הגרסה המפורסמת.'}</span>
        </div>
      )}
      {children}
    </Ctx.Provider>
  )
}
