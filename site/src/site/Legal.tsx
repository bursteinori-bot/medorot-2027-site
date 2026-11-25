import { Fragment, type ReactNode } from 'react'
import { useContent } from '../cms/content'
import type { Block, LegalSection } from '../i18n/he'
import { useLang } from '../i18n/lang'
import { PanelTitle } from '../shared/Blocks'

// Final public texts for the privacy policy and the accessibility statement, written to the customary Israeli wording
// (Privacy Protection Law 1981 incl. Amendment 13, Data Security Regulations 2017, transfer-abroad regulations 2001;
// Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations 2013, reg. 35, IS 5568 /
// WCAG 2.0 AA). This is not legal advice. The texts live in src/i18n/he.ts and en.ts (legal.privacy, legal.accessibility);
// the operator, contact and accessibility details in legalDetails there. All of them can be replaced from the admin
// ("כל הטקסטים באתר", src/i18n/ui.ts). An approved text saved in the CMS
// (legal.privacy / legal.accessibility, and their English under en.legal) replaces the built-in text.
// The English pages open with a note that the Hebrew version prevails.

const S = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-2xl md:text-3xl font-bold mb-3">{title}</h2>
    <div className="space-y-3 text-lg md:text-xl leading-relaxed max-w-[60ch]">{children}</div>
  </section>
)

const List = ({ children }: { children: ReactNode }) => <ul className="list-disc ps-6 space-y-2">{children}</ul>

// an approved text from the CMS: blank line = new paragraph, "## " = heading
function Approved({ title, text }: { title: string; text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <article>
      <PanelTitle className="text-[clamp(3rem,7vw,6rem)] font-black leading-none">{title}</PanelTitle>
      <TranslationNote />
      <div className="mt-8 space-y-4 text-lg md:text-xl leading-relaxed max-w-[60ch]">
        {blocks.map((b, i) => (b.startsWith('## ') ? <h2 key={i} className="text-2xl md:text-3xl font-bold pt-6">{b.slice(3)}</h2> : <p key={i} className="whitespace-pre-line">{b}</p>))}
      </div>
    </article>
  )
}

// English only: the translation is for convenience, the Hebrew text prevails
function TranslationNote() {
  const { t, setLang } = useLang()
  if (!t.legal.translationNote) return null
  return (
    <p className="mt-6 max-w-[60ch] border-s-4 border-black ps-4 text-base md:text-lg">
      {t.legal.translationNote}{' '}
      <button type="button" className="underline underline-offset-4" onClick={() => setLang('he')}>
        {t.legal.translationSwitch}
      </button>
    </p>
  )
}

// a phone number as a tel: link (Israeli numbers written with a leading 0 get +972)
const telHref = (phone: string) => {
  const d = phone.replace(/[^\d+]/g, '')
  return `tel:${d.startsWith('+') ? d : d.startsWith('0') ? `+972${d.slice(1)}` : d}`
}

// How to reach the festival about privacy and accessibility (legalDetails: e-mail and phone; either may be emptied).
function Contact() {
  const { t } = useLang()
  const { email, phone } = t.legalDetails
  const link = 'underline underline-offset-4'
  return (
    <>
      {email.trim() && (
        <>
          {t.legal.contactEmail}{' '}
          <a className={link} href={`mailto:${email.trim()}`} dir="ltr">
            {email.trim()}
          </a>
        </>
      )}
      {email.trim() && phone.trim() && ' '}
      {phone.trim() && (
        <>
          {t.legal.contactPhone}{' '}
          <a className={link} href={telHref(phone)} dir="ltr">
            {phone.trim()}
          </a>
        </>
      )}
    </>
  )
}

// "**bold lead**", "{contact}" and the legal details ({operator} {amutaNumber} {address} {coordinator}) in a legal text
function Rich({ text: raw }: { text: string }) {
  const d = useLang().t.legalDetails
  const values: Record<string, string> = { operator: d.operator, amutaNumber: d.amutaNumber, address: d.address, coordinator: d.accessibilityCoordinator }
  const text = raw.replace(/\{(operator|amutaNumber|address|coordinator)\}/g, (_, k: string) => values[k])
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\{contact\})/).map((part, i) =>
        part === '{contact}' ? <Contact key={i} /> : part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}

const BlockView = ({ block }: { block: Block }) =>
  typeof block === 'string' ? (
    <p>
      <Rich text={block} />
    </p>
  ) : (
    <List>
      {block.list.map((item, i) => (
        <li key={i}>
          <Rich text={item} />
        </li>
      ))}
    </List>
  )

function LegalPage({ title, sections, updated, date }: { title: string; sections: LegalSection[]; updated: string; date: string }) {
  const { t } = useLang()
  // the date is YYYY-MM-DD (legalDetails); anything else the team writes there is shown as it is
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date.trim()) ? new Date(`${date.trim()}T12:00:00`) : null
  const shown = parsed && !isNaN(parsed.getTime()) ? parsed.toLocaleDateString(t.legal.dateLocale, { day: 'numeric', month: t.legal.dateLocale === 'he-IL' ? 'numeric' : 'long', year: 'numeric' }) : date
  return (
    <article>
      <PanelTitle className="text-[clamp(3rem,7vw,6rem)] font-black leading-none">{title}</PanelTitle>
      <TranslationNote />
      {sections.map((s) => (
        <S key={s.title} title={s.title}>
          {s.body.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </S>
      ))}
      <p className="mt-10 text-base opacity-75">
        {updated} {shown}
      </p>
    </article>
  )
}

export function Privacy() {
  const { t } = useLang()
  const { legal } = useContent()
  const p = t.legal.privacy
  if (legal?.privacy) return <Approved title={p.title} text={legal.privacy} />
  return <LegalPage title={p.title} sections={p.sections} updated={p.updated} date={t.legalDetails.privacyUpdated} />
}

export function Accessibility() {
  const { t } = useLang()
  const { legal } = useContent()
  const a = t.legal.accessibility
  if (legal?.accessibility) return <Approved title={a.title} text={legal.accessibility} />
  return <LegalPage title={a.title} sections={a.sections} updated={a.updated} date={t.legalDetails.accessibilityUpdated} />
}
