import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { FESTIVAL, OPEN_CALL_LEAD, OPEN_CALL_PUNCH, YEAR } from '../content'

// The open-call headline, always complete: "קוֹל קוֹרֵא:" + "פַּנּוּ דֶּרֶךְ..." (never shortened).
export function OpenCallHeadline({ as: Tag = 'h1', lead = '', punch = '', className = '', id }: { as?: 'h1' | 'h2'; lead?: string; punch?: string; className?: string; id?: string }) {
  return (
    <Tag id={id} tabIndex={id ? -1 : undefined} className={`nikud outline-none ${className}`}>
      <span className={`block ${lead}`}>{OPEN_CALL_LEAD}</span>
      <span className={`block ${punch}`}>{OPEN_CALL_PUNCH}</span>
    </Tag>
  )
}

export function FestivalYear({ className = '', year = '' }: { className?: string; year?: string }) {
  return (
    <span className={`nikud ${className}`}>
      {FESTIVAL} <span className={`tabular-nums ${year}`}>{YEAR}</span>
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
