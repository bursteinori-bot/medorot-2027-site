import { motion } from 'motion/react'
import { useState } from 'react'
import { track } from '../analytics'
import { useContent } from '../cms/content'
import { useT } from '../i18n/lang'

// The live support form: Kol HaNeshama's secure iCredit donation page, embedded in the site (iCredit supports iframe
// display; the page sends no frame-ancestors/X-Frame-Options). "תשלום עבור" arrives pre-filled through ?Comments=.
// allow="payment" lets Apple Pay / Google Pay run inside the frame. A plain link opens the same page in its own window
// for browsers that block the frame (e.g. strict third-party-cookie settings).
export function DonationFrame() {
  const { settings: SETTINGS } = useContent()
  const t = useT().support
  const url = SETTINGS.donationUrl!
  return (
    <div className="mt-10">
      {t.frameLangNote && <p className="mb-3 text-base">{t.frameLangNote}</p>}
      <div className="border-2 border-black bg-white">
        <iframe
          src={url}
          title={t.frameTitle}
          allow="payment"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => track('donation_frame_loaded')}
          className="block w-full h-[1620px] md:h-[1520px] border-0 bg-white"
        />
      </div>
      <p id="donation-trust" className="mt-4 text-base opacity-80">
        {t.trust}{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => track('donation_click', { from: 'fallback' })} className="underline underline-offset-4">
          {t.openSeparately}
          <span className="sr-only"> {t.opensNewWindow}</span>
        </a>
      </p>
    </div>
  )
}

// Supporting the festival, link-out version (used while payments are off, and by the concept prototypes): the button opens Kol HaNeshama's secure iCredit page in a new tab
// (settings.donationUrl, built in src/content.ts). That page takes no amount from the address, so the chips are only
// suggestions: the chosen amount is repeated in the hint, and the visitor types it on the next page.
// While payments are off (or no URL is set) the button stays disabled and the "not live" note shows instead.
export function Donation({ chip }: { chip?: (active: boolean) => string }) {
  const { settings: SETTINGS, support: SUPPORT } = useContent()
  const t = useT().support
  const [amount, setAmount] = useState<number | 'custom'>(180)
  const [custom, setCustom] = useState('')
  const live = SETTINGS.paymentsEnabled && !!SETTINGS.donationUrl
  const chipCls = chip ?? ((a: boolean) => `min-h-14 px-5 text-2xl border-2 rounded-[var(--radius)] ${a ? 'bg-[var(--ink)] text-[color:var(--paper)] border-[color:var(--ink)]' : 'border-[color:var(--line)]'}`)
  const chosen = amount === 'custom' ? custom : String(amount)

  return (
    <div>
      <fieldset>
        <legend className="text-lg mb-3">{t.amountLegend}</legend>
        <div className="flex flex-wrap gap-2.5">
          {SUPPORT.amounts.map((a) => (
            <motion.button key={a} type="button" whileTap={{ scale: 0.94 }} aria-pressed={amount === a} onClick={() => { setAmount(a); track('donation_amount', { amount: a }) }} className={chipCls(amount === a)}>
              <span className="tabular-nums">{t.amount(a)}</span>
            </motion.button>
          ))}
          <motion.button type="button" whileTap={{ scale: 0.94 }} aria-pressed={amount === 'custom'} onClick={() => setAmount('custom')} className={chipCls(amount === 'custom')}>
            {t.other}
          </motion.button>
        </div>
        {amount === 'custom' && (
          <label className="mt-3 flex items-center gap-2 text-xl">
            <span>₪</span>
            <input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} className="w-40 bg-[var(--field)] border-2 border-[color:var(--line)] rounded-[var(--radius)] px-3 py-2" aria-label={t.otherAria} />
          </label>
        )}
        {live && (
          <p id="donation-next" className="mt-4 text-lg" aria-live="polite">
            {chosen ? t.chosen(chosen) : t.nextPage}
          </p>
        )}
      </fieldset>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {live ? (
          <a
            href={SETTINGS.donationUrl!}
            target="_blank"
            rel="noopener noreferrer"
            aria-describedby="donation-next donation-trust"
            onClick={() => track('donation_click', amount === 'custom' ? (custom ? { amount: Number(custom) } : { amount: 'custom' }) : { amount })}
            className="min-h-14 inline-flex items-center px-8 bg-[var(--ink)] text-[color:var(--paper)] text-2xl font-bold rounded-[var(--radius)]"
          >
            {SUPPORT.button}
            <span className="sr-only"> {t.opensNewWindow}</span>
            <span aria-hidden className="ms-2 text-xl">↗</span>
          </a>
        ) : (
          <button type="button" disabled aria-describedby="donation-off" className="min-h-14 px-8 bg-[var(--ink)]/25 text-[color:var(--ink)]/60 text-2xl font-bold rounded-[var(--radius)] cursor-not-allowed">
            {SUPPORT.button}
          </button>
        )}
        <a href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" className="text-xl underline underline-offset-4">{t.instagram(SETTINGS.instagram)}</a>
      </div>
      {live ? <p id="donation-trust" className="mt-4 text-base opacity-80">{t.trust}</p> : <p id="donation-off" className="mt-3 text-base opacity-80">{SUPPORT.notLive}</p>}
    </div>
  )
}
