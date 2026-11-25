import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useContent } from '../cms/content'
import { useLang } from '../i18n/lang'
import type { SectionId } from '../content'

type Props = {
  active: SectionId
  onGo: (id: SectionId) => void
  // look: colours come from the concept's CSS variables
  bar?: string // classes for the sticky bar
  chip?: (active: boolean) => string
  sheet?: string
}

// Phone navigation: a sticky strip of real tap targets that visibly scrolls (edge fade + chevron), a one-line hint,
// and a "ניווט באתר +" sheet with every section.
export function MobileNav({ active, onGo, bar = 'bg-[var(--paper)] border-b border-[color:var(--line)]', chip, sheet = 'bg-[var(--paper)]' }: Props) {
  const { nav: NAV, navHint: NAV_HINT } = useContent()
  const { dir, t } = useLang()
  const rtl = dir === 'rtl'
  const strip = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(true)

  // centre the active chip inside the strip (scrollBy on the strip only, so the page itself never jumps)
  const mounted = useRef(false)
  useEffect(() => {
    const s = strip.current
    const el = s?.querySelector<HTMLElement>(`[data-id="${active}"]`)
    if (!s || !el) return
    const a = el.getBoundingClientRect()
    const b = s.getBoundingClientRect()
    s.scrollBy({ left: a.left + a.width / 2 - (b.left + b.width / 2), behavior: mounted.current ? 'smooth' : 'auto' })
    mounted.current = true
  }, [active])

  const onScroll = () => {
    const s = strip.current
    if (!s) return
    // RTL: scrollLeft runs from 0 to negative values (abs() covers both directions)
    setMore(Math.abs(s.scrollLeft) + s.clientWidth < s.scrollWidth - 8)
  }

  const chipCls = chip ?? ((a: boolean) => `px-4 py-2.5 text-[17px] leading-none border ${a ? 'bg-[var(--ink)] text-[color:var(--paper)] border-[color:var(--ink)]' : 'border-[color:var(--line)]'}`)

  return (
    <div className={`md:hidden sticky top-0 z-40 ${bar}`}>
      <nav aria-label={t.site.mainNav}>
        <div className="relative">
          <div ref={strip} onScroll={onScroll} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5 scroll-px-4">
            {NAV.map((n) => (
              <button
                key={n.id}
                data-id={n.id}
                type="button"
                aria-current={active === n.id ? 'page' : undefined}
                onClick={() => onGo(n.id)}
                className={`shrink-0 min-h-11 whitespace-nowrap rounded-[var(--radius)] ${chipCls(active === n.id)}`}
              >
                {n.label}
              </button>
            ))}
            <span className="shrink-0 w-10" aria-hidden />
          </div>
          {/* "there's more this way" affordance at the reading end (left in Hebrew, right in English) */}
          <div aria-hidden className={`pointer-events-none absolute inset-y-0 end-0 w-16 flex items-center justify-start ps-1 transition-opacity ${more ? 'opacity-100' : 'opacity-0'}`} style={{ background: `linear-gradient(to ${rtl ? 'left' : 'right'}, transparent, var(--paper) 70%)` }}>
            <motion.span className="text-2xl leading-none" animate={{ x: [0, rtl ? -4 : 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>{rtl ? '‹' : '›'}</motion.span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pb-2 text-[13px]">
          <span className="opacity-75">{NAV_HINT}</span>
          <button type="button" className="shrink-0 underline underline-offset-4 min-h-8" aria-expanded={open} aria-controls="mobile-sheet" onClick={() => setOpen((o) => !o)}>
            {open ? t.mobileNav.close : t.mobileNav.open}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-sheet"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`overflow-hidden border-t border-[color:var(--line)] ${sheet}`}
          >
            {NAV.map((n, i) => (
              <li key={n.id}>
                <button
                  type="button"
                  aria-current={active === n.id ? 'page' : undefined}
                  onClick={() => { onGo(n.id); setOpen(false) }}
                  className={`w-full text-start px-4 py-3 text-2xl flex items-baseline gap-3 border-b border-[color:var(--line)]/30 ${active === n.id ? 'font-bold' : ''}`}
                >
                  <span className="text-sm tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
                  {n.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
