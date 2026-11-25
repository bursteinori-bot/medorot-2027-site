import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { track } from '../analytics'
import { useContent, useSourceContent } from '../cms/content'
import { he } from '../i18n/he'
import { useLang } from '../i18n/lang'
import { DISCIPLINES, IDENTITIES, LOCATIONS, STAGES, STEP_SCHEMAS, UPLOAD, fieldCodes, fileMetaSchema, formatIssue, isShrinkableImage, words, type Application } from './application'
import { SubmitError, applicationsOpen, submitApplication } from './submit'

type Data = {
  name: string; email: string; phone: string; age: string; city: string; identity: string; identityOther: string; bio: string
  project: string; disciplines: string[]; disciplineOther: string; description: string; location: string; locationOther: string; jewish: string; stage: string
  portfolio: string; social: string; links: string; notes: string; privacy: boolean
}
const EMPTY: Data = { name: '', email: '', phone: '', age: '', city: '', identity: '', identityOther: '', bio: '', project: '', disciplines: [], disciplineOther: '', description: '', location: '', locationOther: '', jewish: '', stage: '', portfolio: '', social: '', links: '', notes: '', privacy: false }
const DRAFT_KEY = 'medorot-application-draft'
const STEP_FIELDS = [
  ['name', 'email', 'phone', 'age', 'city', 'identity', 'identityOther', 'bio'],
  ['project', 'disciplines', 'disciplineOther', 'description', 'location', 'jewish', 'stage'],
  ['portfolio', 'social', 'links', 'files'],
  ['notes', 'privacy'],
]
// the stored answer for each project stage is the fixed Hebrew name, whatever language the form is shown in
const STAGE_BY_ID: Record<string, string> = { idea: STAGES[0], developing: STAGES[1], existing: STAGES[2], new: STAGES[3] }

// Errors are kept as language-neutral codes (src/shared/application.ts) and turned into text when shown, so switching
// language mid-form translates them too. A Hebrew-only field message from an older server is kept as "raw:<text>".
type FileItem = { file: File; error?: string }
type Phase = 'form' | 'sending' | 'done'

// mode "demo": the concept prototypes; nothing is sent and the confirmation is shown as a labelled preview.
// mode "live": the real site; the confirmation appears only after the server confirms the application and its files.
// Answers are stored exactly as before (Hebrew option values); only what is displayed follows the language.
export function ApplicationForm({ compact = false, mode = 'demo', privacyHref }: { compact?: boolean; mode?: 'demo' | 'live'; privacyHref?: string }) {
  const { openCall, confirmation, settings } = useContent()
  const source = useSourceContent()
  const { lang, dir, t: dict } = useLang()
  const t = dict.form
  const steps = t.steps
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Data>(() => {
    if (mode !== 'live') return EMPTY
    try {
      const draft = { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}'), privacy: false }
      // a draft saved before the location options changed would hold an answer that no longer exists
      if (!(LOCATIONS as readonly string[]).includes(draft.location)) draft.location = ''
      return draft
    } catch { return EMPTY }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<FileItem[]>([])
  const [phase, setPhase] = useState<Phase>('form')
  const [sendError, setSendError] = useState<SubmitError | null>(null)
  const [progress, setProgress] = useState<Record<number, number>>({})
  const [open, setOpen] = useState<boolean | null>(mode === 'live' ? null : true)
  const [website, setWebsite] = useState('') // honeypot
  const startedAt = useRef(Date.now())
  const key = useRef(crypto.randomUUID()) // same key for every retry of this submission
  const top = useRef<HTMLDivElement>(null)
  const uid = useId()

  const msg = (token: string) => (token.startsWith('raw:') ? (lang === 'he' ? token.slice(4) : dict.issues.check) : formatIssue(token, dict.issues))
  const describe = (e: SubmitError) => {
    if (lang === 'he') return e.message
    const server = dict.errors.server as Record<string, string | ((d: string) => string)>
    const local = dict.errors as unknown as Record<string, string | ((d: string) => string)>
    const m = (e.code && (server[e.code] ?? (e.code !== 'server' ? local[e.code] : undefined))) || dict.errors.generic
    return typeof m === 'function' ? m(e.detail ?? '') : m
  }

  useEffect(() => {
    if (mode === 'live') applicationsOpen().then(setOpen)
  }, [mode])
  // keep an unsent draft in this browser (text only; files can't be stored), so a closed tab loses nothing
  useEffect(() => {
    if (mode !== 'live' || phase === 'done') return
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, privacy: false })) } catch { /* private mode */ }
  }, [d, mode, phase])

  // anonymous funnel statistics: step 1 counts once the visitor starts filling in the form
  const started = useRef(false)
  useEffect(() => {
    if (mode === 'live' && step > 0) track('form_step', { step: step + 1 })
  }, [step, mode])

  const set = <K extends keyof Data>(k: K, v: Data[K]) => {
    if (mode === 'live' && !started.current) {
      started.current = true
      track('form_step', { step: 1 })
    }
    setD((x) => ({ ...x, [k]: v }))
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n })
  }
  const focusFirstError = () => setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 40)
  const toTop = () => top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })

  const validateStep = (s: number) => {
    const r = STEP_SCHEMAS[s].safeParse(d)
    const e = r.success ? {} : fieldCodes(r.error)
    if (s === 2 && files.some((f) => f.error)) e.files = 'filesBlocked'
    return e
  }

  const send = async () => {
    setPhase('sending')
    setSendError(null)
    setProgress({})
    try {
      await submitApplication({
        key: key.current,
        answers: d as unknown as Application,
        files: files.map((f) => f.file),
        startedAt: startedAt.current,
        website,
        onProgress: (p) => setProgress((x) => ({ ...x, [p.file]: p.loaded / p.total })),
      })
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* private mode */ }
      track('form_submitted', { files: files.length })
      setPhase('done')
      toTop()
    } catch (e) {
      setPhase('form')
      const err = e instanceof SubmitError ? e : new SubmitError(he.errors.generic, { code: 'generic' })
      track('form_error', { kind: err.fields ? 'validation' : 'server' })
      setSendError(err)
      const fields = err.fieldCodes ?? (err.fields && Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, `raw:${v}`])))
      if (fields) {
        setErrors(fields)
        // jump back to the step that holds the first rejected field
        const s = STEP_FIELDS.findIndex((fs) => Object.keys(fields).some((k) => fs.includes(k)))
        if (s >= 0 && s !== step) setStep(s)
        focusFirstError()
      }
    }
  }

  const next = () => {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length) return focusFirstError()
    if (step < 3) {
      setStep(step + 1)
      return toTop()
    }
    // last step: every step must still be valid (answers can't be skipped, but a restored draft may be stale)
    for (let s = 0; s < 3; s++) {
      const es = validateStep(s)
      if (Object.keys(es).length) {
        setStep(s)
        setErrors(es)
        return focusFirstError()
      }
    }
    if (mode === 'demo') {
      setPhase('done')
      return toTop()
    }
    send()
  }
  const back = () => { setErrors({}); setStep(step - 1); toTop() }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const add: FileItem[] = Array.from(list).map((file) => {
      // photos are shrunk before upload, so they may start larger than the per-file limit
      const photo = isShrinkableImage(file.type)
      const size = photo && file.size <= UPLOAD.maxImageSourceMb * 1024 * 1024 ? 1 : file.size || 1
      const r = fileMetaSchema.safeParse({ name: file.name, size, type: file.type })
      const tooBig = !photo && file.size > UPLOAD.maxMb * 1024 * 1024
      return { file, error: r.success ? undefined : tooBig ? `fileTooBigLink:${UPLOAD.maxMb}` : r.error.issues[0].message }
    })
    setFiles((f) => [...f, ...add].slice(0, UPLOAD.maxFiles))
    if (errors.files) setErrors((e) => { const n = { ...e }; delete n.files; return n })
  }

  const f = (k: keyof Data) => ({ id: `${uid}-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${uid}-${k}-err` : undefined })
  const err = (k: string) => (errors[k] ? msg(errors[k]) : undefined)
  const field = 'w-full bg-[var(--field)] border-2 border-[color:var(--line)] rounded-[var(--radius)] px-3.5 py-3 text-lg outline-none focus:border-[color:var(--accent-2)] aria-[invalid=true]:border-[color:var(--accent-2)]'
  const ahead = dir === 'rtl' ? -1 : 1 // the side the next step comes from

  if (phase === 'done') {
    return (
      <div ref={top} className="space-y-6 scroll-mt-28">
        {mode === 'demo' && (
          <div role="status" className="border-2 border-dashed border-[color:var(--line)] p-4 text-base">
            <strong>{t.demoStrong}</strong>{t.demoText}
          </div>
        )}
        <div role={mode === 'live' ? 'status' : undefined} className="p-6 md:p-10 bg-[var(--accent)] text-[#0a0a0a] rounded-[var(--radius)]">
          <h3 className="text-4xl md:text-5xl font-bold mb-4">{confirmation.title}</h3>
          {confirmation.lines.map((l) => <p key={l} className="text-xl md:text-2xl leading-snug mb-2 nikud">{l}</p>)}
        </div>
        {mode === 'demo' && <button type="button" className="underline underline-offset-4" onClick={() => { setPhase('form'); setStep(0) }}>{t.backToForm}</button>}
      </div>
    )
  }

  if (open === false) {
    return (
      <div ref={top} role="status" className="border-2 border-[color:var(--line)] p-6 md:p-8 rounded-[var(--radius)]">
        <p className="text-2xl md:text-3xl font-bold">{t.closedTitle}</p>
        <p className="mt-3 text-xl">{t.closedText(settings.deadline)}</p>
        <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xl underline underline-offset-4" dir="ltr">@{settings.instagram}</a>
      </div>
    )
  }

  const sending = phase === 'sending'
  const errorCount = Object.keys(errors).length
  return (
    <div ref={top} className="scroll-mt-28">
      {/* progress */}
      <ol className={`grid grid-cols-4 gap-1.5 mb-8 ${compact ? 'text-xs' : 'text-sm md:text-base'}`} aria-label={t.stepsAria}>
        {steps.map((s, i) => (
          <li key={i} aria-current={i === step ? 'step' : undefined} className="flex flex-col gap-2">
            <span className="h-2 rounded-[var(--radius)] border border-[color:var(--line)] overflow-hidden">
              <motion.span className="block h-full bg-[var(--accent-2)] rtl:origin-right ltr:origin-left" initial={false} animate={{ scaleX: i < step ? 1 : i === step ? 0.5 : 0 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </span>
            <span className={i === step ? 'font-bold' : 'opacity-60'}>
              <span className="tabular-nums">{i + 1}.</span> {s}
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{t.stepStatus(step + 1, steps[step])}</p>

      {/* honeypot: hidden from people and assistive tech, bots fill it */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>{t.honeypot} <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.fieldset key={step} disabled={sending} initial={{ opacity: 0, x: 24 * ahead }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * ahead }} transition={{ duration: 0.28 }} className="space-y-7 min-w-0">
          <legend className="sr-only">{steps[step]}</legend>
          {step === 0 && (
            <>
              <Field label={t.name} req err={err('name')} id={f('name').id}><input {...f('name')} className={field} autoComplete="name" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <div className="grid md:grid-cols-2 gap-7">
                <Field label={t.email} req err={err('email')} id={f('email').id}><input {...f('email')} className={field} type="email" dir="ltr" autoComplete="email" inputMode="email" value={d.email} onChange={(e) => set('email', e.target.value)} /></Field>
                <Field label={t.phone} req err={err('phone')} id={f('phone').id}><input {...f('phone')} className={field} type="tel" dir="ltr" autoComplete="tel" inputMode="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                <Field label={t.age} req err={err('age')} id={f('age').id}><input {...f('age')} className={field} inputMode="numeric" value={d.age} onChange={(e) => set('age', e.target.value.replace(/[^\d]/g, ''))} /></Field>
                <Field label={t.city} req err={err('city')} id={f('city').id}><input {...f('city')} className={field} autoComplete="address-level2" value={d.city} onChange={(e) => set('city', e.target.value)} /></Field>
              </div>
              <Choice legend={t.identity} req err={err('identity')} name={`${uid}-identity`} options={IDENTITIES} labels={t.identities} value={d.identity} onChange={(v) => set('identity', v)} />
              {d.identity === 'אחר' && <Field label={t.identityOther} req err={err('identityOther')} id={f('identityOther').id}><input {...f('identityOther')} className={field} value={d.identityOther} onChange={(e) => set('identityOther', e.target.value)} /></Field>}
              <Field label={t.bio} req err={err('bio')} id={f('bio').id} hint={t.bioHint} counter={[words(d.bio), 150]}>
                <textarea {...f('bio')} className={`${field} min-h-36`} value={d.bio} onChange={(e) => set('bio', e.target.value)} />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field label={t.project} req err={err('project')} id={f('project').id}><input {...f('project')} className={field} value={d.project} onChange={(e) => set('project', e.target.value)} /></Field>
              <Choice multi legend={t.disciplines} hint={t.disciplinesHint} req err={err('disciplines')} name={`${uid}-disc`} options={DISCIPLINES} labels={t.disciplineOptions} value={d.disciplines} onChange={(v) => set('disciplines', v)} />
              {d.disciplines.includes('אחר') && <Field label={t.disciplineOther} req err={err('disciplineOther')} id={f('disciplineOther').id}><input {...f('disciplineOther')} className={field} value={d.disciplineOther} onChange={(e) => set('disciplineOther', e.target.value)} /></Field>}
              <Field label={t.description} req err={err('description')} id={f('description').id} hint={t.descriptionHint} counter={[words(d.description), 300]}>
                <textarea {...f('description')} className={`${field} min-h-48`} value={d.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
              <Choice legend={t.location} hint={t.locationHint} req err={err('location')} name={`${uid}-loc`} options={LOCATIONS} labels={t.locations} value={d.location} onChange={(v) => set('location', v)} />
              <Field label={t.jewish} req err={err('jewish')} id={f('jewish').id} hint={t.jewishHint}>
                <textarea {...f('jewish')} className={`${field} min-h-36`} value={d.jewish} onChange={(e) => set('jewish', e.target.value)} />
              </Field>
              <div role="radiogroup" aria-labelledby={`${uid}-stage-l`} aria-invalid={!!errors.stage} aria-describedby={errors.stage ? `${uid}-stage-err` : undefined} tabIndex={errors.stage ? -1 : undefined}>
                <p id={`${uid}-stage-l`} className="text-xl font-bold mb-1">{t.stage} <Req /></p>
                <p className="text-base opacity-75 mb-3">{openCall.stagesNote}</p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {openCall.stages.map((s) => {
                    const value = STAGE_BY_ID[s.id] ?? source.openCall.stages.find((x) => x.id === s.id)?.label ?? s.label
                    return (
                      <label key={s.id} className={`flex gap-3 p-4 border-2 rounded-[var(--radius)] cursor-pointer transition-colors focus-within:outline-3 focus-within:outline-[color:var(--focus)] ${d.stage === value ? 'border-[color:var(--accent)] bg-[var(--accent)] text-[#0a0a0a]' : 'border-[color:var(--line)]/40 hover:border-[color:var(--line)]'}`}>
                        <input type="radio" name={`${uid}-stage`} className="mt-1.5 size-4 accent-[#0a0a0a]" checked={d.stage === value} onChange={() => set('stage', value)} />
                        <span><span className="block text-lg font-bold">{s.label}</span><span className="block text-base opacity-80">{s.desc}</span></span>
                      </label>
                    )
                  })}
                </div>
                {errors.stage && <Err id={`${uid}-stage-err`}>{msg(errors.stage)}</Err>}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <Field label={t.portfolio} req err={err('portfolio')} id={f('portfolio').id} hint={t.portfolioHint}>
                <input {...f('portfolio')} className={field} dir="ltr" inputMode="url" placeholder="https://" value={d.portfolio} onChange={(e) => set('portfolio', e.target.value)} />
              </Field>
              <Field label={t.social} err={err('social')} id={f('social').id} hint={t.socialHint}>
                <input {...f('social')} className={field} dir="ltr" inputMode="url" placeholder="https://instagram.com/..." value={d.social} onChange={(e) => set('social', e.target.value)} />
              </Field>
              <div>
                <p className="text-xl font-bold mb-1">{t.visuals}</p>
                <p className="text-base opacity-80 mb-1">{t.visualsHint}</p>
                <p className="text-sm opacity-70 mb-3">{t.uploadRules(UPLOAD.maxImageSourceMb, UPLOAD.maxMb, UPLOAD.maxFiles)}</p>
                <label
                  className="flex flex-col items-center justify-center gap-1 text-center border-2 border-dashed border-[color:var(--line)] rounded-[var(--radius)] p-8 cursor-pointer hover:bg-[var(--accent)]/40 focus-within:bg-[var(--accent)]/40 focus-within:outline-3 focus-within:outline-[color:var(--focus)]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
                >
                  <span className="text-2xl">{t.chooseFiles}</span>
                  <span className="text-sm opacity-70">{t.dropHere}</span>
                  <input type="file" multiple className="sr-only" accept={UPLOAD.exts.map((x) => '.' + x).join(',')} onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                </label>
                {files.length > 0 && <FileList files={files} progress={progress} msg={msg} onRemove={(i) => setFiles((fs) => fs.filter((_, j) => j !== i))} />}
                {errors.files && <Err>{msg(errors.files)}</Err>}
              </div>
              <Field label={t.links} id={f('links').id} err={err('links')} hint={t.linksHint}>
                <textarea {...f('links')} className={`${field} min-h-24`} dir="ltr" value={d.links} onChange={(e) => set('links', e.target.value)} />
              </Field>
            </>
          )}
          {step === 3 && (
            <>
              <Field label={t.notes} id={f('notes').id} err={err('notes')} hint={t.notesHint}>
                <textarea {...f('notes')} className={`${field} min-h-32`} value={d.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
              {files.length > 0 && (
                <div>
                  <p className="text-lg font-bold mb-1">{t.filesToSend(files.length)}</p>
                  <FileList files={files} progress={progress} msg={msg} onRemove={sending ? undefined : (i) => setFiles((fs) => fs.filter((_, j) => j !== i))} />
                </div>
              )}
              <div>
                <label className="flex gap-3 items-start cursor-pointer text-lg">
                  <input type="checkbox" {...f('privacy')} className="mt-1.5 size-5 accent-[#0a0a0a] shrink-0" checked={d.privacy} onChange={(e) => set('privacy', e.target.checked)} />
                  <span>
                    {t.consentBefore}<a href={privacyHref ?? settings.privacyPolicyUrl} target={privacyHref ? '_blank' : undefined} className="underline underline-offset-4">{t.consentLink}</a>{t.consentAfter} <Req />
                  </span>
                </label>
                {errors.privacy && <Err id={`${f('privacy').id}-err`}>{msg(errors.privacy)}</Err>}
              </div>
            </>
          )}
        </motion.fieldset>
      </AnimatePresence>

      {sendError && <p role="alert" className="mt-8 border-2 border-[color:var(--accent-2)] p-4 text-lg font-bold">{describe(sendError)}</p>}
      <div className="flex flex-wrap items-center gap-3 mt-10">
        {step > 0 && <button type="button" disabled={sending} onClick={back} className="min-h-12 px-5 border-2 border-[color:var(--line)] rounded-[var(--radius)] text-lg disabled:opacity-50">{dict.brand.back} {t.back}</button>}
        <button type="button" disabled={sending} onClick={next} className="min-h-12 px-7 bg-[var(--ink)] text-[color:var(--paper)] rounded-[var(--radius)] text-lg font-bold hover:bg-[var(--accent-2)] hover:text-[color:var(--ink)] transition-colors disabled:opacity-60 disabled:cursor-wait">
          {step < 3 ? `${t.next} ${dict.brand.fwd}` : sending ? t.sending : sendError ? t.retry : t.submit}
        </button>
        {errorCount > 0 && !sendError && <span className="text-[color:var(--accent-2)] font-bold text-base" role="alert">{t.errorCount(errorCount)}</span>}
        {sending && <span className="text-base" role="status">{t.sendingNote(files.length > 0)}</span>}
      </div>
    </div>
  )
}

function FileList({ files, progress, msg, onRemove }: { files: FileItem[]; progress: Record<number, number>; msg: (token: string) => string; onRemove?: (i: number) => void }) {
  const t = useLang().t.form
  return (
    <ul className="mt-3 divide-y divide-[color:var(--line)]/25 border border-[color:var(--line)]/40 rounded-[var(--radius)]">
      {files.map((it, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <span className="flex-1 min-w-0">
            <span className="block truncate" dir="ltr">{it.file.name}</span>
            <span className={`text-sm ${it.error ? 'text-[color:var(--accent-2)] font-bold' : 'opacity-60'}`}>
              {it.error ? msg(it.error) : progress[i] !== undefined ? t.uploaded(Math.round(progress[i] * 100)) : t.ready((it.file.size / 1024 / 1024).toFixed(1))}
            </span>
            {progress[i] !== undefined && <span className="block h-1 mt-1 bg-[color:var(--line)]/15"><span className="block h-full bg-[var(--accent-2)] transition-[width]" style={{ width: `${progress[i] * 100}%` }} /></span>}
          </span>
          {onRemove && <button type="button" className="underline text-sm min-h-10 px-2" onClick={() => onRemove(i)} aria-label={t.removeAria(it.file.name)}>{t.remove}</button>}
        </li>
      ))}
    </ul>
  )
}

const Req = () => <span aria-hidden className="text-[color:var(--accent-2)]">*</span>
const Err = ({ children, id }: { children: ReactNode; id?: string }) => <p id={id} className="mt-1.5 text-base font-bold text-[color:var(--accent-2)]">{children}</p>

function Field({ label, req, err, id, hint, counter, children }: { label: string; req?: boolean; err?: string; id: string; hint?: string; counter?: [number, number]; children: ReactNode }) {
  const t = useLang().t.form
  return (
    <div>
      <label htmlFor={id} className="block text-xl font-bold mb-1">{label} {req && <Req />}<span className="sr-only">{req ? t.required : t.optional}</span></label>
      {hint && <p className="text-base opacity-75 mb-2">{hint}</p>}
      {children}
      <div className="flex justify-between gap-4">
        {err ? <Err id={`${id}-err`}>{err}</Err> : <span />}
        {counter && <span className={`mt-1.5 text-sm tabular-nums ${counter[0] > counter[1] ? 'text-[color:var(--accent-2)] font-bold' : 'opacity-60'}`} aria-live="polite">{t.words(counter[0], counter[1])}</span>}
      </div>
    </div>
  )
}

// options are the stored (Hebrew) values; `labels` gives what to show for each in the current language
function Choice<M extends boolean = false>({ legend, hint, req, err, name, options, labels, value, onChange, multi }: { legend: string; hint?: string; req?: boolean; err?: string; name: string; options: readonly string[]; labels?: Record<string, string>; value: M extends true ? string[] : string; onChange: (v: M extends true ? string[] : string) => void; multi?: M }) {
  const sel = (o: string) => (multi ? (value as string[]).includes(o) : value === o)
  const toggle = (o: string) => {
    if (multi) {
      const v = value as string[]
      ;(onChange as (v: string[]) => void)(v.includes(o) ? v.filter((x) => x !== o) : [...v, o])
    } else (onChange as (v: string) => void)(o)
  }
  return (
    <div role={multi ? 'group' : 'radiogroup'} aria-labelledby={`${name}-l`} aria-invalid={!!err} aria-describedby={err ? `${name}-err` : undefined} tabIndex={err ? -1 : undefined}>
      <p id={`${name}-l`} className="text-xl font-bold mb-1">{legend} {req && <Req />}</p>
      {hint && <p className="text-base opacity-75 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((o) => (
          <label key={o} className={`relative min-h-11 px-4 py-2 border-2 rounded-[var(--radius)] cursor-pointer text-lg transition-colors focus-within:outline-3 focus-within:outline-[color:var(--focus)] ${sel(o) ? 'bg-[var(--ink)] text-[color:var(--paper)] border-[color:var(--ink)]' : 'border-[color:var(--line)]/50 hover:border-[color:var(--line)]'}`}>
            <input type={multi ? 'checkbox' : 'radio'} name={name} className="sr-only" checked={sel(o)} onChange={() => toggle(o)} />
            {labels?.[o] ?? o}
          </label>
        ))}
      </div>
      {err && <Err id={`${name}-err`}>{err}</Err>}
    </div>
  )
}
