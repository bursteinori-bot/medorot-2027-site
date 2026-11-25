import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { YEAR } from '../content'
import { useT } from '../i18n/lang'

// The open-call headline, always complete: "קוֹל קוֹרֵא:" + "פַּנּוּ דֶּרֶךְ..." (never shortened).
// Default: two stacked lines (lead, then a big punch). `inline`: one line of running text (it may wrap on a narrow
// phone, never by force), e.g. as the lead-in above the home page's big "מדורות 2027".
export function OpenCallHeadline({ as: Tag = 'h1', lead = '', punch = '', className = '', id, inline = false }: { as?: 'h1' | 'h2' | 'p'; lead?: string; punch?: string; className?: string; id?: string; inline?: boolean }) {
  const t = useT().brand
  const show = inline ? 'inline' : 'block'
  return (
    <Tag id={id} tabIndex={id ? -1 : undefined} className={`nikud outline-none ${className}`}>
      <span className={`${show} ${lead}`}>{t.openCallLead}</span>
      {inline && ' '}
      <span className={`${show} ${punch}`}>{t.openCallPunch}</span>
    </Tag>
  )
}

export function FestivalYear({ className = '', year = '' }: { className?: string; year?: string }) {
  const t = useT().brand
  return (
    <span className={`nikud ${className}`}>
      {t.festival} <span className={`tabular-nums ${year}`}>{YEAR}</span>
    </span>
  )
}

// Text that rises in word by word (respects reduced motion through MotionConfig).
export function Reveal({ text, className = '', delay = 0, stagger = 0.035 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.08em]">
          <motion.span className="inline-block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: delay + i * stagger, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  )
}

export function PanelTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h1 id="panel-title" tabIndex={-1} className={`outline-none nikud ${className}`}>
      {children}
    </h1>
  )
}
