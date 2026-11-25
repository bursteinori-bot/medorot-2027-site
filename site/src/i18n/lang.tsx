import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { UiOverrides } from '../shared/uiOverrides'
import { en } from './en'
import { he, type Dict } from './he'
import { withUi } from './ui'

// Site language. Hebrew is the default; English is opt-in through the toggle or a shared ?lang=en link, and is
// remembered in this browser (localStorage). The browser's own language is never used to guess.
//   - an explicit ?lang=en / ?lang=he in the URL always wins (shared links, back/forward)
//   - otherwise the last choice made in this browser, otherwise Hebrew
//   - while English is on, the URL carries ?lang=en so the address can be shared; Hebrew keeps clean URLs
// The design-concept prototypes (/concepts, /c/...) are Hebrew-only reference pages and always stay Hebrew.
export type Lang = 'he' | 'en'
export const DICTS: Record<Lang, Dict> = { he, en }
export const LANG_KEY = 'medorot-lang'

const hebrewOnly = (pathname: string) => /^\/(concepts|c)(\/|$)/.test(pathname)

function stored(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return v === 'en' || v === 'he' ? v : null
  } catch {
    return null // storage blocked (private mode, sandboxed preview)
  }
}
function store(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* storage blocked: the URL still carries the choice */
  }
}
const fromUrl = (search: string): Lang | null => {
  const v = new URLSearchParams(search).get('lang')
  return v === 'en' || v === 'he' ? v : null
}

type Ctx = { lang: Lang; dir: 'rtl' | 'ltr'; t: Dict; setLang: (l: Lang) => void; withLang: (path: string) => string }
const LangCtx = createContext<Ctx>({ lang: 'he', dir: 'rtl', t: he, setLang: () => {}, withLang: (p) => p })

export const useLang = () => useContext(LangCtx)
export const useT = () => useContext(LangCtx).t

export function LangProvider({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  const [chosen, setChosen] = useState<Lang>(() => fromUrl(search) ?? stored() ?? 'he')
  const urlLang = fromUrl(search)
  const lang: Lang = hebrewOnly(pathname) ? 'he' : (urlLang ?? chosen)
  const dir = lang === 'en' ? 'ltr' : 'rtl'

  // an explicit ?lang= that appears in the URL (a shared link, back/forward) becomes the remembered choice. Only a
  // change of the URL counts: right after a click on the toggle the old ?lang= is still there for one render.
  useEffect(() => {
    if (urlLang) setChosen(urlLang)
  }, [urlLang])
  useEffect(() => {
    if (!hebrewOnly(pathname)) store(chosen)
  }, [chosen, pathname])

  // keep the address in step with the language (replace: switching language is not a new page in history)
  useEffect(() => {
    if (hebrewOnly(pathname)) return
    const sp = new URLSearchParams(search)
    const want = lang === 'en' ? 'en' : null
    if (sp.get('lang') === want) return
    if (want) sp.set('lang', want)
    else sp.delete('lang')
    const q = sp.toString()
    navigate({ pathname, search: q ? `?${q}` : '', hash }, { replace: true, preventScrollReset: true })
  }, [lang, pathname, search, hash, navigate])

  // <html lang dir> before paint, so the page never flashes in the wrong direction
  useLayoutEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback(
    (l: Lang) => {
      setChosen(l)
      store(l)
      const sp = new URLSearchParams(search)
      if (l === 'en') sp.set('lang', 'en')
      else sp.delete('lang')
      const q = sp.toString()
      navigate({ pathname, search: q ? `?${q}` : '', hash }, { replace: true, preventScrollReset: true })
    },
    [navigate, pathname, search, hash],
  )
  const withLang = useCallback((path: string) => (lang === 'en' ? `${path}${path.includes('?') ? '&' : '?'}lang=en` : path), [lang])

  return <LangCtx.Provider value={{ lang, dir, t: DICTS[lang], setLang, withLang }}>{children}</LangCtx.Provider>
}

// The public site's texts with the team's published replacements ("All site texts" in the admin, src/i18n/ui.ts).
// Used by the ContentProvider; everything below it reads the replaced texts through useT() / useLang().t.
export function UiTextProvider({ ui, children }: { ui: UiOverrides | undefined; children: ReactNode }) {
  const parent = useContext(LangCtx)
  const t = useMemo(() => withUi(parent.t, ui, parent.lang), [parent.t, ui, parent.lang])
  const value = useMemo(() => (t === parent.t ? parent : { ...parent, t }), [t, parent])
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}
