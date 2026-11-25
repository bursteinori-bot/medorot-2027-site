import { memo, useDeferredValue, useMemo, useState } from 'react'
import { UI_ENTRIES, UI_GROUPS, groupOf, isNeutral, type UiEntry, type UiGroup } from '../i18n/ui'
import type { UiOverrides } from '../shared/uiOverrides'
import { useAdmin } from './api'
import { Button, Notice, inputCls } from './ui'

// "כל הטקסטים באתר": every fixed text of the public site (src/i18n/he.ts / en.ts), grouped by where it appears.
// Each row shows the text in the code as its title and as the grey placeholder of its Hebrew and English fields;
// what is typed is stored under `ui` in the content draft (src/i18n/ui.ts) and goes through the editor's usual
// draft → preview → publish. An empty field keeps the text in the code.

type Lang = 'he' | 'en'
type Put = (lang: Lang, key: string, value: string | undefined) => void

const EDITABLE = UI_ENTRIES.filter((e) => !e.fixed)
const NONE: Record<string, string> = {}
const norm = (s: string) => s.normalize('NFC').replace(/[֑-ׇ]/g, '').toLowerCase()
const isLong = (e: UiEntry) => Math.max(e.he?.length ?? 0, e.en?.length ?? 0) > 70 || /\n/.test(`${e.he ?? ''}${e.en ?? ''}`)

export function TextsEditor({ ui, put }: { ui: UiOverrides | undefined; put: Put }) {
  const { t: all } = useAdmin()
  const t = all.content.texts
  const [q, setQ] = useState('')
  const query = norm(useDeferredValue(q).trim())
  const [onlyChanged, setOnlyChanged] = useState(false)
  const [open, setOpen] = useState<Set<UiGroup>>(() => new Set())
  const he = ui?.he ?? NONE
  const en = ui?.en ?? NONE
  const changed = (k: string) => k in he || k in en

  const groups = useMemo(() => {
    const m = new Map<UiGroup, UiEntry[]>()
    for (const e of EDITABLE) {
      if (onlyChanged && !(e.key in he || e.key in en)) continue
      if (query && !norm([e.key, e.he, e.en, he[e.key], en[e.key]].filter(Boolean).join(' ')).includes(query)) continue
      const g = groupOf(e.key)
      m.set(g, [...(m.get(g) ?? []), e])
    }
    return UI_GROUPS.filter((g) => m.has(g)).map((g) => ({ id: g, entries: m.get(g)! }))
  }, [query, onlyChanged, he, en])
  const shown = groups.reduce((n, g) => n + g.entries.length, 0)
  const total = EDITABLE.length
  const totalChanged = EDITABLE.filter((e) => changed(e.key)).length
  const filtering = !!query || onlyChanged
  const toggle = (g: UiGroup) => setOpen((s) => {
    const n = new Set(s)
    if (n.has(g)) n.delete(g)
    else n.add(g)
    return n
  })

  return (
    <div className="space-y-4">
      <Notice>{t.intro}</Notice>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label htmlFor="texts-q" className="block font-bold mb-1">{t.search}</label>
          <input id="texts-q" type="search" className={inputCls} placeholder={t.searchPh} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 min-h-11 shrink-0">
          <input type="checkbox" className="size-5 accent-black" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />
          <span>{t.onlyChanged}</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/70">
        <p role="status">{t.count(shown, total)}{totalChanged ? ` · ${t.changedCount(totalChanged)}` : ''}</p>
        {!filtering && (
          <Button variant="ghost" className="min-h-9 text-sm" onClick={() => setOpen(open.size ? new Set() : new Set(UI_GROUPS))}>
            {open.size ? t.collapseAll : t.expandAll}
          </Button>
        )}
      </div>
      {groups.length === 0 && <p className="text-black/60">{t.noResults}</p>}
      <div className="space-y-3">
        {groups.map((g) => {
          const isOpen = filtering || open.has(g.id)
          const n = g.entries.filter((e) => changed(e.key)).length
          return (
            <section key={g.id} className="border border-black/15 rounded-lg">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`texts-${g.id}`}
                  disabled={filtering}
                  onClick={() => toggle(g.id)}
                  className="w-full min-h-12 flex items-center justify-between gap-3 px-4 py-2 text-start rounded-lg hover:bg-black/5 disabled:hover:bg-transparent disabled:cursor-default"
                >
                  <span className="font-bold text-lg">{t.groups[g.id]}</span>
                  <span className="flex items-center gap-2 text-sm text-black/60 shrink-0">
                    {t.groupCount(g.entries.length, n)}
                    {!filtering && <span aria-hidden className="text-lg leading-none">{isOpen ? '−' : '+'}</span>}
                  </span>
                </button>
              </h3>
              {isOpen && (
                <div id={`texts-${g.id}`} className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-3">
                  {g.id === 'formOptions' && <Notice>{t.optionsNote}</Notice>}
                  {(g.id === 'privacy' || g.id === 'accessibility' || g.id === 'legalDetails') && <Notice>{t.legalNote}</Notice>}
                  {g.entries.map((e) => (
                    <Row key={e.key} e={e} he={he[e.key]} en={en[e.key]} heForEn={isNeutral(e) ? he[e.key] : undefined} put={put} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
      <p className="text-sm text-black/60">{t.notEditable}</p>
    </div>
  )
}

const Row = memo(function Row({ e, he, en, heForEn, put }: { e: UiEntry; he?: string; en?: string; heForEn?: string; put: Put }) {
  const { t: all, lang } = useAdmin()
  const t = all.content.texts
  const long = isLong(e)
  const id = `ui-${e.key.replace(/[^\w-]/g, (c) => c.charCodeAt(0).toString(36))}`
  const edited = he !== undefined || en !== undefined
  // the row's title: the text as it is in the code, in the admin's language when there is one
  const title = (lang === 'en' ? e.en || e.he : e.he || e.en) ?? ''
  const hint = /Updated$/.test(e.key) ? t.dateHint : e.key.startsWith('brand.openCall') ? t.noShorten : ''
  const field = (l: Lang, value: string | undefined, placeholder: string | undefined) => {
    const props = {
      id: `${id}-${l}`,
      dir: l === 'he' ? 'rtl' : 'ltr',
      lang: l,
      'aria-describedby': `${id}-t`,
      className: `${inputCls} ${long ? 'min-h-28' : ''} ${value !== undefined ? 'border-black bg-[#fffbe0]' : ''}`,
      placeholder: placeholder || t.empty,
      value: value ?? '',
      onChange: (ev: { target: { value: string } }) => put(l, e.key, ev.target.value.trim() ? ev.target.value : undefined),
    } as const
    return (
      <div className="min-w-0">
        <label htmlFor={`${id}-${l}`} className="block text-sm font-bold text-black/70 mb-1">{l === 'he' ? t.he : t.en}</label>
        {long ? <textarea {...props} rows={3} /> : <input {...props} />}
      </div>
    )
  }
  return (
    <div className={`rounded-md border p-3 ${edited ? 'border-black/50 bg-[#fffdf2]' : 'border-black/10'}`}>
      <div className="flex items-start justify-between gap-3">
        <p id={`${id}-t`} className="font-bold leading-snug line-clamp-3 min-w-0 break-words" dir="auto">{title || t.empty}</p>
        {edited && <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-[#fee801]">{t.edited}</span>}
      </div>
      <p className="mt-0.5 text-xs text-black/45 break-all" dir="ltr">{e.key}</p>
      {e.params && (
        <p className="mt-1 text-sm text-black/70">
          {t.placeholders}{' '}
          {e.params.map((p) => <code key={p} dir="ltr" className="mx-0.5 px-1.5 py-0.5 rounded bg-black/5 text-[13px]">{`{${p}}`}</code>)}
        </p>
      )}
      {hint && <p className="mt-1 text-sm text-black/70">{hint}</p>}
      {isNeutral(e) && <p className="mt-1 text-sm text-black/60">{t.neutral}</p>}
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {e.he !== undefined ? field('he', he, e.he) : <span />}
        {e.en !== undefined ? field('en', en, heForEn ?? e.en) : <span />}
      </div>
      <Button variant="ghost" className="mt-2 min-h-9 text-sm" disabled={!edited} aria-label={t.resetAria(title)} onClick={() => { put('he', e.key, undefined); put('en', e.key, undefined) }}>
        {t.reset}
      </Button>
    </div>
  )
})
