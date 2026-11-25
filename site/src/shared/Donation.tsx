import { motion } from 'motion/react'
import { useState } from 'react'
import { track } from '../analytics'
import { useContent } from '../cms/content'

// Donation picker. Payment stays switched off until a provider and its hosted-checkout URL are configured
// (SETTINGS.paymentsEnabled / donationUrl), and nothing here pretends to take a payment.
export function Donation({ chip }: { chip?: (active: boolean) => string }) {
  const { settings: SETTINGS, support: SUPPORT } = useContent()
  const [amount, setAmount] = useState<number | 'custom'>(180)
  const [custom, setCustom] = useState('')
  const live = SETTINGS.paymentsEnabled && !!SETTINGS.donationUrl
  const chipCls = chip ?? ((a: boolean) => `min-h-14 px-5 text-2xl border-2 rounded-[var(--radius)] ${a ? 'bg-[var(--ink)] text-[color:var(--paper)] border-[color:var(--ink)]' : 'border-[color:var(--line)]'}`)

  return (
    <div>
      <fieldset>
        <legend className="text-lg mb-3">סכום התרומה</legend>
        <div className="flex flex-wrap gap-2.5">
          {SUPPORT.amounts.map((a) => (
            <motion.button key={a} type="button" whileTap={{ scale: 0.94 }} aria-pressed={amount === a} onClick={() => { setAmount(a); track('donation_amount', { amount: a }) }} className={chipCls(amount === a)}>
              <span className="tabular-nums">{a}</span> ₪
            </motion.button>
          ))}
          <motion.button type="button" whileTap={{ scale: 0.94 }} aria-pressed={amount === 'custom'} onClick={() => setAmount('custom')} className={chipCls(amount === 'custom')}>
            סכום אחר
          </motion.button>
        </div>
        {amount === 'custom' && (
          <label className="mt-3 flex items-center gap-2 text-xl">
            <span>₪</span>
            <input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} className="w-40 bg-[var(--field)] border-2 border-[color:var(--line)] rounded-[var(--radius)] px-3 py-2" aria-label="סכום אחר בשקלים" />
          </label>
        )}
      </fieldset>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {live ? (
          <a href={SETTINGS.donationUrl!} className="min-h-14 inline-flex items-center px-8 bg-[var(--ink)] text-[color:var(--paper)] text-2xl font-bold rounded-[var(--radius)]">{SUPPORT.button}</a>
        ) : (
          <button type="button" disabled aria-describedby="donation-off" className="min-h-14 px-8 bg-[var(--ink)]/25 text-[color:var(--ink)]/60 text-2xl font-bold rounded-[var(--radius)] cursor-not-allowed">
            {SUPPORT.button}
          </button>
        )}
        <a href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" className="text-xl underline underline-offset-4">לפנות אלינו באינסטגרם @{SETTINGS.instagram}</a>
      </div>
      {!live && <p id="donation-off" className="mt-3 text-base opacity-80">{SUPPORT.notLive}</p>}
    </div>
  )
}
