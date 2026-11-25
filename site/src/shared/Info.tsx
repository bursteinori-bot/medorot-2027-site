import { useContent } from '../cms/content'
import { useT } from '../i18n/lang'

// Practical details. Unknown values show "יפורסם בקרוב"; contact lines appear only once the team supplies them.
// (The reply date stays in the content model for the team, but is not shown on the site.)
export function InfoList({ className = '', row = 'border-b border-[color:var(--line)]/30 py-4' }: { className?: string; row?: string }) {
  const { settings: s } = useContent()
  const t = useT().info
  const rows: [string, string | null, string?][] = [
    [t.festivalDate, s.festivalDate],
    [t.deadline, s.deadline],
    [t.venue, s.venue],
    [t.instagram, `@${s.instagram}`, s.instagramUrl],
    [t.whatsapp, s.whatsapp, s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '').replace(/^0/, '972')}` : undefined],
    [t.contact, s.email, s.email ? `mailto:${s.email}` : undefined],
  ]
  return (
    <dl className={className}>
      {rows.filter(([, v]) => v).map(([k, v, href]) => (
        <div key={k} className={`grid grid-cols-[minmax(8rem,auto)_1fr] gap-4 items-baseline ${row}`}>
          <dt className="text-base opacity-70">{k}</dt>
          {/* addresses stay readable text: mailto/wa links don't open for every visitor */}
          <dd className="text-xl md:text-2xl">{href ? <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4 select-all" dir="ltr">{v}</a> : v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Partners({ invert = false, className = '' }: { invert?: boolean; className?: string }) {
  const { partners } = useContent()
  const t = useT().info
  return (
    <ul className={`flex items-center gap-6 ${className}`} aria-label={t.partners}>
      {partners.map((p) => (
        <li key={p.src}>
          <img src={p.src} alt={p.name} className="h-10 w-auto" style={invert ? { filter: 'invert(1)' } : undefined} />
        </li>
      ))}
    </ul>
  )
}

export function PrivacyNote() {
  return (
    <section id="privacy" aria-labelledby="privacy-t" className="text-base">
      <h3 id="privacy-t" className="font-bold text-lg mb-1">מדיניות פרטיות</h3>
      <p className="opacity-80">[טיוטת מדיניות הפרטיות תתווסף כאן לאחר אישור הצוות. נוסח סופי יאושר לפני הפתיחה להגשות.]</p>
    </section>
  )
}
