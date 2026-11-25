import { useEffect, useRef, useState } from 'react'
import { SEED, type SiteContent } from '../content'
import { useMe } from './AdminApp'
import { apiGet, apiPost, fmtDate, uploadMedia } from './api'
import { Button, Card, Field, Notice, PageTitle, Spinner, inputCls } from './ui'

// "ניהול תוכן האתר": every public text, date, link and image, edited as drafts, previewed, then published.
// The public site reads the published version through /api/content, so what is published here is what visitors see.

type Path = (string | number)[]
type Kind = 'text' | 'textarea' | 'list' | 'bool' | 'url' | 'stages' | 'photos' | 'amounts' | 'nav' | 'partners' | 'legal'
type FieldDef = { path: Path; label: string; kind?: Kind; hint?: string; dir?: 'ltr' }
type Section = { id: string; title: string; note?: string; fields: FieldDef[] }

const SECTIONS: Section[] = [
  {
    id: 'general', title: 'פרטים כלליים', note: 'תאריכים, מיקום ופרטי קשר מופיעים בכמה מקומות באתר ומתעדכנים בכולם יחד.',
    fields: [
      { path: ['tagline'], label: 'שורת תג' },
      { path: ['settings', 'festivalDate'], label: 'תאריך הפסטיבל', hint: 'למשל "ל״ג בעומר, 25.5.2027". עד שנקבע: "יפורסם בקרוב"' },
      { path: ['settings', 'deadline'], label: 'מועד אחרון להגשה' },
      { path: ['settings', 'responseDate'], label: 'מועד שליחת תשובות' },
      { path: ['settings', 'venue'], label: 'מיקום' },
      { path: ['settings', 'instagram'], label: 'שם המשתמש באינסטגרם (בלי @)', dir: 'ltr' },
      { path: ['settings', 'instagramUrl'], label: 'קישור לאינסטגרם', kind: 'url' },
      { path: ['settings', 'email'], label: 'מייל ליצירת קשר', hint: 'ריק = השורה לא מוצגת באתר', dir: 'ltr' },
      { path: ['settings', 'whatsapp'], label: 'מספר וואטסאפ', hint: 'ריק = השורה לא מוצגת באתר', dir: 'ltr' },
    ],
  },
  {
    id: 'home', title: 'עמוד ראשי', note: 'הכותרת "קוֹל קוֹרֵא: פַּנּוּ דֶּרֶךְ..." קבועה ואינה ניתנת לקיצור.',
    fields: [
      { path: ['home', 'invite'], label: 'פסקת הזמנה', kind: 'textarea' },
      { path: ['home', 'about'], label: 'על הפסטיבל (קצר)', kind: 'textarea' },
      { path: ['home', 'fields'], label: 'תחומים', kind: 'textarea' },
      { path: ['home', 'closing'], label: 'משפט סיום' },
      { path: ['home', 'ctaPrimary'], label: 'כפתור ראשי' },
      { path: ['home', 'ctaSecondary'], label: 'כפתור משני' },
    ],
  },
  {
    id: 'about', title: 'על הפסטיבל',
    fields: [
      { path: ['about', 'title'], label: 'כותרת' },
      { path: ['about', 'paragraphs'], label: 'פסקאות', kind: 'list' },
      { path: ['about', 'words'], label: 'מילים גרפיות', kind: 'list', hint: 'מילה אחת בכל שורה' },
      { path: ['about', 'nameNote'], label: 'הערה על השם', kind: 'textarea' },
    ],
  },
  {
    id: 'open-call', title: 'הקול הקורא',
    fields: [
      { path: ['openCall', 'paragraphs'], label: 'פסקאות', kind: 'list' },
      { path: ['openCall', 'spaces'], label: 'על המרחבים', kind: 'textarea' },
      { path: ['openCall', 'who'], label: 'מי יכול.ה להגיש', kind: 'textarea' },
      { path: ['openCall', 'disciplines'], label: 'תחומים (תצוגה)', kind: 'list', hint: 'הרשימה שמוצגת בעמוד. אפשרויות הבחירה בטופס קבועות ונשמרות כמו שהן.' },
      { path: ['openCall', 'stages'], label: 'שלבי הפרויקט', kind: 'stages', hint: 'שמות השלבים קבועים (הם חלק מהטופס). אפשר לערוך את ההסברים.' },
      { path: ['openCall', 'stagesNote'], label: 'משפט "אין צורך ביצירה גמורה"' },
    ],
  },
  {
    id: 'spaces', title: 'מרחבי הפסטיבל', note: 'אפשר להחליף, להוסיף ולסדר תמונות. כל תמונה צריכה טקסט חלופי שמתאר מה רואים בה.',
    fields: [0, 1, 2].flatMap((i) => [
      { path: ['spaces', i, 'name'], label: `מרחב ${i + 1}: שם` },
      { path: ['spaces', i, 'desc'], label: `מרחב ${i + 1}: תיאור`, kind: 'textarea' as Kind },
      { path: ['spaces', i, 'photos'], label: `מרחב ${i + 1}: תמונות`, kind: 'photos' as Kind },
    ]),
  },
  {
    id: 'apply', title: 'פרטי ההגשה', note: 'שדות החובה של הטופס והבדיקות שלו קבועים ואינם ניתנים לעריכה כאן.',
    fields: [
      { path: ['confirmation', 'title'], label: 'כותרת מסך האישור' },
      { path: ['confirmation', 'lines'], label: 'שורות מסך האישור', kind: 'list' },
    ],
  },
  {
    id: 'support', title: 'שותפות ותמיכה',
    fields: [
      { path: ['support', 'title'], label: 'כותרת' },
      { path: ['support', 'paragraphs'], label: 'פסקאות', kind: 'list' },
      { path: ['support', 'closing'], label: 'משפט סיום' },
      { path: ['support', 'amounts'], label: 'סכומים מוצעים (₪)', kind: 'amounts', hint: 'מספרים מופרדים בפסיקים' },
      { path: ['support', 'button'], label: 'טקסט הכפתור' },
      { path: ['support', 'notLive'], label: 'הודעה כשהתרומות לא פעילות', kind: 'textarea' },
      { path: ['settings', 'donationUrl'], label: 'קישור לעמוד התשלום של הספק', kind: 'url', hint: 'יופעל רק אחרי שספק התשלום נבחר ונבדק' },
      { path: ['settings', 'paymentsEnabled'], label: 'תרומות מקוונות פעילות', kind: 'bool', hint: 'לסמן רק אחרי שנבדק תשלום אמיתי מול הספק' },
    ],
  },
  {
    id: 'nav', title: 'ניווט ותפריט',
    fields: [
      { path: ['nav'], label: 'שמות וסדר הנושאים', kind: 'nav' },
      { path: ['navHint'], label: 'הסבר בניווט במובייל' },
    ],
  },
  {
    id: 'footer', title: 'פוטר',
    fields: [
      { path: ['finalCta', 'text'], label: 'קריאה לפעולה בעמוד הפרטים' },
      { path: ['finalCta', 'button'], label: 'כפתור' },
      { path: ['partners'], label: 'לוגואים של שותפים', kind: 'partners' },
    ],
  },
  {
    id: 'privacy', title: 'מדיניות פרטיות', note: 'כל עוד השדה ריק, באתר מוצגת הטיוטה המובנית (מסומנת כטיוטה). פסקאות מופרדות בשורה ריקה. שורה שמתחילה ב-"## " היא כותרת.',
    fields: [
      { path: ['legal', 'privacy'], label: 'נוסח מדיניות הפרטיות המאושר', kind: 'legal' },
      { path: ['legal', 'accessibility'], label: 'נוסח הצהרת הנגישות המאושר', kind: 'legal' },
    ],
  },
]

const get = (o: unknown, p: Path): unknown => p.reduce<unknown>((x, k) => (x == null ? x : (x as Record<string | number, unknown>)[k]), o)
function set<T>(o: T, p: Path, v: unknown): T {
  if (!p.length) return v as T
  const [k, ...rest] = p
  const copy = (Array.isArray(o) ? [...o] : { ...(o as object) }) as Record<string | number, unknown>
  copy[k] = set(copy[k], rest, v)
  return copy as T
}

type Version = { id: string; status: 'draft' | 'published' | 'archived'; note: string | null; created_at: string; published_at: string | null; author: string | null }

export default function ContentEditor() {
  const me = useMe()
  const [content, setContent] = useState<SiteContent | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [versions, setVersions] = useState<Version[]>([])
  const [dirty, setDirty] = useState(false)
  const [section, setSection] = useState(SECTIONS[0].id)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)

  const load = () =>
    apiGet<{ current: { id: string | null; content: SiteContent; status: string }; versions: Version[] }>('content').then((d) => {
      // fill fields added to the seed after this version was saved
      setContent({ ...SEED, ...d.current.content, legal: { ...SEED.legal, ...(d.current.content.legal ?? {}) } })
      setDraftId(d.current.status === 'draft' ? d.current.id : null)
      setStatus(d.current.status)
      setVersions(d.versions)
      setDirty(false)
    })
  useEffect(() => {
    load().catch((e) => setMsg({ kind: 'error', text: e.message }))
  }, [])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!content) return msg ? <Notice kind="error">{msg.text}</Notice> : <Spinner />

  const update = (p: Path, v: unknown) => {
    setContent((c) => set(c!, p, v))
    setDirty(true)
  }
  const save = async () => {
    const r = await apiPost<{ id: string }>('content-save', { id: draftId, content })
    setDraftId(r.id)
    setStatus('draft')
    setDirty(false)
    return r.id
  }
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setMsg({ kind: 'ok', text: ok })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  const preview = () =>
    run(async () => {
      const id = dirty || !draftId ? await save() : draftId
      window.open(`/?preview=${id}`, '_blank', 'noopener')
    }, 'הטיוטה נשמרה ונפתחה בתצוגה מקדימה בלשונית חדשה.')
  const publish = () =>
    run(async () => {
      const id = dirty || !draftId ? await save() : draftId
      await apiPost('content-publish', { id })
      setConfirmPublish(false)
      await load()
    }, 'פורסם! השינויים מופיעים באתר תוך כחצי דקה.')

  const sec = SECTIONS.find((s) => s.id === section)!
  return (
    <div className="max-w-5xl">
      <PageTitle
        actions={
          <>
            <Button variant="secondary" disabled={busy || !dirty} onClick={() => run(save, 'הטיוטה נשמרה. היא עוד לא מופיעה באתר.')}>שמירת טיוטה</Button>
            <Button variant="secondary" disabled={busy} onClick={preview}>תצוגה מקדימה ↗</Button>
            {me.canPublish && <Button disabled={busy || (status === 'published' && !dirty) || status === 'seed' && !dirty} onClick={() => setConfirmPublish(true)}>פרסום באתר</Button>}
          </>
        }
      >
        ניהול תוכן האתר
      </PageTitle>
      <p className="mb-4 text-black/70">
        {status === 'seed' && 'עדיין לא נשמרה גרסה: האתר מציג את התוכן המקורי. כל שינוי יישמר כטיוטה.'}
        {status === 'draft' && (dirty ? 'יש שינויים שלא נשמרו.' : 'עובדים על טיוטה שעוד לא פורסמה.')}
        {status === 'published' && (dirty ? 'יש שינויים שלא נשמרו. הם יישמרו כטיוטה חדשה.' : 'זה התוכן שמפורסם עכשיו באתר.')}
        {!me.canPublish && ' אין לך הרשאת פרסום: שמרו טיוטה ובקשו ממנהל.ת לפרסם.'}
      </p>
      {msg && <div className="mb-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {confirmPublish && (
        <div role="alertdialog" aria-labelledby="pub-t" className="mb-5 border-2 border-black rounded-lg p-5 bg-[#fff7c2]">
          <p id="pub-t" className="text-lg font-bold">לפרסם את השינויים באתר הציבורי?</p>
          <p className="mt-1">הגרסה הנוכחית תישמר בהיסטוריה, ואפשר יהיה לשחזר אותה בכל רגע.</p>
          <div className="mt-3 flex gap-2">
            <Button disabled={busy} onClick={publish}>כן, לפרסם</Button>
            <Button variant="secondary" onClick={() => setConfirmPublish(false)}>ביטול</Button>
          </div>
        </div>
      )}

      <div className="md:grid md:grid-cols-[12rem_1fr] gap-6">
        <nav aria-label="חלקי התוכן" className="flex md:flex-col gap-1 overflow-x-auto mb-4 md:mb-0">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" aria-current={s.id === section ? 'page' : undefined} onClick={() => setSection(s.id)} className={`text-start whitespace-nowrap px-3 py-2 rounded-md ${s.id === section ? 'bg-black text-white font-bold' : 'hover:bg-black/5'}`}>
              {s.title}
            </button>
          ))}
        </nav>
        <Card className="space-y-6 min-w-0">
          <h2 className="text-2xl font-bold">{sec.title}</h2>
          {sec.note && <Notice>{sec.note}</Notice>}
          {sec.fields.map((f) => <Editor key={f.path.join('.')} def={f} value={get(content, f.path)} onChange={(v) => update(f.path, v)} />)}
        </Card>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl font-bold mb-3">היסטוריית גרסאות</h2>
        {versions.length === 0 ? <p className="text-black/60">עוד אין גרסאות שמורות.</p> : (
          <ul className="divide-y divide-black/10">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className={`font-bold px-2 py-0.5 rounded ${v.status === 'published' ? 'bg-[#1f7a3d] text-white' : v.status === 'draft' ? 'bg-[#fee801]' : 'bg-black/10'}`}>{{ published: 'מפורסמת', draft: 'טיוטה', archived: 'קודמת' }[v.status]}</span>
                <span className="tabular-nums">{fmtDate(v.published_at ?? v.created_at)}</span>
                <span className="text-black/60">{v.author ?? ''}{v.note ? ` · ${v.note}` : ''}</span>
                {v.status === 'archived' && (
                  <Button variant="ghost" className="ms-auto min-h-8" disabled={busy} onClick={() => run(async () => { await apiPost('content-restore', { id: v.id }); await load() }, 'הגרסה שוחזרה כטיוטה. בדקו אותה ופרסמו כשמוכן.')}>
                    שחזור כטיוטה
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Editor({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = `f-${def.path.join('-')}`
  const kind = def.kind ?? 'text'
  if (kind === 'bool')
    return (
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-black" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span><span className="font-bold">{def.label}</span>{def.hint && <span className="block text-sm text-black/60">{def.hint}</span>}</span>
      </label>
    )
  if (kind === 'list') {
    const arr = (value as string[]) ?? []
    return (
      <Field label={def.label} hint={def.hint ?? 'כל פריט בתיבה משלו. אפשר להוסיף, להסיר ולסדר.'}>
        <ListEditor items={arr} onChange={onChange} render={(v, set) => <textarea aria-label={def.label} className={`${inputCls} min-h-20`} value={v} onChange={(e) => set(e.target.value)} />} empty="" />
      </Field>
    )
  }
  if (kind === 'amounts')
    return (
      <Field label={def.label} hint={def.hint} id={id}>
        <input id={id} dir="ltr" className={inputCls} defaultValue={((value as number[]) ?? []).join(', ')} onBlur={(e) => onChange(e.target.value.split(/[,\s]+/).map(Number).filter((n) => n > 0))} />
      </Field>
    )
  if (kind === 'stages') {
    const arr = value as { id: string; label: string; desc: string }[]
    return (
      <Field label={def.label} hint={def.hint}>
        <div className="space-y-2">
          {arr.map((s, i) => (
            <div key={s.id} className="grid sm:grid-cols-[10rem_1fr] gap-2 items-center">
              <span className="font-bold">{s.label}</span>
              <input aria-label={`הסבר: ${s.label}`} className={inputCls} value={s.desc} onChange={(e) => onChange(arr.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      </Field>
    )
  }
  if (kind === 'nav') {
    const arr = value as { id: string; label: string }[]
    return (
      <Field label={def.label} hint="אפשר לשנות שמות ולסדר מחדש. הקישורים עצמם קבועים.">
        <ListEditor items={arr} onChange={onChange} fixed render={(v, set) => <input aria-label="שם בתפריט" className={inputCls} value={v.label} onChange={(e) => set({ ...v, label: e.target.value })} />} />
      </Field>
    )
  }
  if (kind === 'photos' || kind === 'partners') {
    const arr = (value as { src: string; alt?: string; name?: string }[]) ?? []
    const isPartner = kind === 'partners'
    return (
      <Field label={def.label} hint={isPartner ? 'לוגו בפורמט PNG שקוף עדיף. השם משמש גם כטקסט חלופי.' : 'JPG, PNG או WEBP, עד 4MB. התמונות מוצגות לפי הסדר.'}>
        <ListEditor
          items={arr}
          onChange={onChange}
          render={(v, set) => (
            <div className="flex gap-3 items-start">
              <img src={isPartner ? v.src : v.src.startsWith('/api/media') ? v.src : `${v.src}_960.webp`} alt="" className={`${isPartner ? 'h-12 w-auto bg-black/5 p-1' : 'w-28 aspect-[4/3] object-cover'} rounded border border-black/15 shrink-0`} />
              <input aria-label={isPartner ? 'שם השותף' : 'טקסט חלופי'} className={inputCls} placeholder={isPartner ? 'שם השותף' : 'מה רואים בתמונה'} value={(isPartner ? v.name : v.alt) ?? ''} onChange={(e) => set(isPartner ? { ...v, name: e.target.value } : { ...v, alt: e.target.value })} />
            </div>
          )}
          adder={<Uploader onUploaded={(src, name) => onChange([...arr, isPartner ? { name, src } : { src, alt: '' }])} />}
        />
      </Field>
    )
  }
  if (kind === 'legal')
    return (
      <Field label={def.label} hint="ריק = מוצגת הטיוטה המובנית" id={id}>
        <textarea id={id} className={`${inputCls} min-h-72 font-mono text-sm`} value={(value as string | null) ?? ''} onChange={(e) => onChange(e.target.value.trim() ? e.target.value : null)} />
      </Field>
    )
  return (
    <Field label={def.label} hint={def.hint} id={id}>
      {kind === 'textarea' ? (
        <textarea id={id} className={`${inputCls} min-h-28`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} dir={def.dir ?? (kind === 'url' ? 'ltr' : undefined)} type={kind === 'url' ? 'url' : 'text'} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || (def.path[0] === 'settings' && ['email', 'whatsapp', 'donationUrl'].includes(String(def.path[1])) ? null : ''))} />
      )}
    </Field>
  )
}

function ListEditor<T>({ items, onChange, render, empty, fixed, adder }: { items: T[]; onChange: (v: T[]) => void; render: (v: T, set: (v: T) => void) => React.ReactNode; empty?: T; fixed?: boolean; adder?: React.ReactNode }) {
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const n = [...items]
    ;[n[i], n[j]] = [n[j], n[i]]
    onChange(n)
  }
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">{render(v, (nv) => onChange(items.map((x, j) => (j === i ? nv : x))))}</div>
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" aria-label="הזזה למעלה" disabled={i === 0} onClick={() => move(i, -1)} className="size-8 rounded border border-black/20 disabled:opacity-30">↑</button>
            <button type="button" aria-label="הזזה למטה" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="size-8 rounded border border-black/20 disabled:opacity-30">↓</button>
          </div>
          {!fixed && <button type="button" aria-label="הסרה" onClick={() => onChange(items.filter((_, j) => j !== i))} className="size-8 rounded border border-[#b3261e]/40 text-[#b3261e] shrink-0">×</button>}
        </div>
      ))}
      {adder ?? (!fixed && empty !== undefined && <Button variant="ghost" onClick={() => onChange([...items, empty])}>+ הוספה</Button>)}
    </div>
  )
}

function Uploader({ onUploaded }: { onUploaded: (src: string, name: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div>
      <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'מעלים…' : '+ הוספת תמונה'}</Button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          setErr('')
          try {
            const { shrinkImage } = await import('../shared/submit')
            const small = f.type === 'image/png' ? f : await shrinkImage(f)
            const r = await uploadMedia(small)
            onUploaded(r.src, f.name.replace(/\.\w+$/, ''))
          } catch (e) {
            setErr((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      />
      {err && <p role="alert" className="text-sm text-[#b3261e] mt-1">{err}</p>}
    </div>
  )
}
