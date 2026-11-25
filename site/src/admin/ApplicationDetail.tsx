import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { STATUS_COLOR, STATUS_LABEL, apiGet, apiPost, fileUrl, fmtDate, fmtSize, type Status } from './api'
import { Button, Card, Field, Notice, PageTitle, Spinner, inputCls } from './ui'

type Answers = Record<string, string | string[] | boolean>
type Detail = {
  application: { id: string; status: Status; submitted_at: string; answers: Answers; name: string; email: string; phone: string; age: number; city: string; identity: string; project: string; disciplines: string[]; location: string; stage: string; notification_error: string | null }
  files: { position: number; original_name: string; size_bytes: number; mime_type: string | null }[]
  notes: { id: string; body: string; created_at: string; author: string | null }[]
  history: { from_status: Status | null; to_status: Status; changed_at: string; by: string | null }[]
  corrections: { field: string; old_value: unknown; new_value: unknown; reason: string; created_at: string; author: string | null }[]
}

const FIELD_LABEL: Record<string, string> = {
  name: 'שם מלא', email: 'אימייל', phone: 'טלפון', age: 'גיל', city: 'מקום מגורים', identity: 'הגדרה עצמית', bio: 'ספרו לנו על עצמכם.ן',
  project: 'שם הפרויקט', description: 'תיאור הפרויקט', jewish: 'הקשר לעולם היהודי', portfolio: 'תיק עבודות', social: 'אינסטגרם / אתר', links: 'קישורים', notes: 'הערות נוספות',
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="space-y-3">
    <h2 className="text-xl font-bold">{title}</h2>
    {children}
  </Card>
)
const Row = ({ k, children }: { k: string; children: ReactNode }) => (
  <div className="grid sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-0.5 py-2 border-b border-black/10 last:border-0">
    <dt className="text-sm text-black/60">{k}</dt>
    <dd className="whitespace-pre-wrap break-words">{children}</dd>
  </div>
)
const linkify = (s: string) => s.split(/(\s+)/).map((p, i) => (/^https?:\/\/\S+$/.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer noopener" className="underline inline-block max-w-full break-all" dir="ltr">{p}</a> : p))

export default function ApplicationDetail() {
  const { id = '' } = useParams()
  const [d, setD] = useState<Detail | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [note, setNote] = useState('')
  const [fix, setFix] = useState({ field: 'name', value: '', reason: '' })
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => apiGet<Detail>('application', { id }).then(setD).catch((e) => setErr(e.message)), [id])
  useEffect(() => {
    load()
  }, [load])

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setMsg('')
    setErr('')
    try {
      await fn()
      await load()
      setMsg(ok)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (err && !d) return <Notice kind="error">{err}</Notice>
  if (!d) return <Spinner />
  const a = d.application
  const ans = a.answers
  const str = (k: string) => (Array.isArray(ans[k]) ? (ans[k] as string[]).join(', ') : String(ans[k] ?? ''))

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/admin/applications" className="underline">→ כל ההגשות</Link>
      <PageTitle>{a.project}</PageTitle>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-sm font-bold px-2.5 py-1 rounded ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
        <span className="text-black/70">הוגשה {fmtDate(a.submitted_at)}</span>
        {a.notification_error && <span className="text-sm text-black/60">(התראה במייל לא נשלחה)</span>}
      </div>
      {msg && <Notice kind="ok">{msg}</Notice>}
      {err && <Notice kind="error">{err}</Notice>}

      <Section title="סטטוס פנימי">
        <p className="text-sm text-black/60">הסטטוס פנימי בלבד ואינו מוצג למגישים.</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="שינוי סטטוס">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button key={s} type="button" disabled={busy || s === a.status} aria-pressed={s === a.status} onClick={() => act(() => apiPost('status', { id, status: s }), `הסטטוס עודכן ל"${STATUS_LABEL[s]}".`)} className={`min-h-10 px-3 rounded-md border-2 text-sm font-bold ${s === a.status ? `${STATUS_COLOR[s]} border-transparent` : 'border-black/20 bg-white hover:border-black'}`}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="פרטים אישיים">
          <dl>
            <Row k="שם מלא">{a.name}</Row>
            <Row k="אימייל"><a href={`mailto:${a.email}`} className="underline select-all inline-block max-w-full break-all" dir="ltr">{a.email}</a></Row>
            <Row k="טלפון"><span dir="ltr" className="select-all inline-block">{a.phone}</span></Row>
            <Row k="גיל">{a.age}</Row>
            <Row k="מקום מגורים">{a.city}</Row>
            <Row k="הגדרה עצמית">{a.identity}</Row>
          </dl>
        </Section>
        <Section title="על הפרויקט">
          <dl>
            <Row k="תחומים">{a.disciplines.join(' · ')}</Row>
            <Row k="מיקום מבוקש">{a.location}</Row>
            <Row k="שלב">{a.stage}</Row>
            <Row k="תיק עבודות">{str('portfolio') ? linkify(str('portfolio')) : '—'}</Row>
            {str('social') && <Row k="אינסטגרם / אתר">{linkify(str('social'))}</Row>}
          </dl>
        </Section>
      </div>

      <Section title="ביוגרפיה"><p className="whitespace-pre-wrap leading-relaxed">{str('bio')}</p></Section>
      <Section title="תיאור הפרויקט"><p className="whitespace-pre-wrap leading-relaxed">{str('description')}</p></Section>
      <Section title="הקשר לעולם היהודי"><p className="whitespace-pre-wrap leading-relaxed">{str('jewish')}</p></Section>
      {(str('links') || str('notes')) && (
        <Section title="קישורים והערות של המגיש.ה">
          <dl>
            {str('links') && <Row k="קישורים">{linkify(str('links'))}</Row>}
            {str('notes') && <Row k="הערות">{str('notes')}</Row>}
          </dl>
        </Section>
      )}

      <Section title={`קבצים מצורפים (${d.files.length})`}>
        {d.files.length === 0 ? <p className="text-black/60">לא צורפו קבצים.</p> : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.files.map((f) => {
              const img = f.mime_type?.startsWith('image/')
              return (
                <li key={f.position} className="border border-black/15 rounded-lg overflow-hidden bg-[#faf8f1]">
                  {img && <a href={fileUrl(id, f.position)} target="_blank" rel="noreferrer"><img src={fileUrl(id, f.position)} alt={`תצוגה מקדימה: ${f.original_name}`} loading="lazy" className="w-full aspect-[4/3] object-cover bg-white" /></a>}
                  {f.mime_type?.startsWith('video/') && <video src={fileUrl(id, f.position)} controls preload="metadata" className="w-full aspect-video bg-black" />}
                  <div className="p-3 text-sm">
                    <p className="font-bold truncate" dir="ltr">{f.original_name}</p>
                    <p className="text-black/60">{fmtSize(f.size_bytes)} · {f.mime_type}</p>
                    <p className="flex gap-3 mt-1">
                      <a href={fileUrl(id, f.position)} target="_blank" rel="noreferrer" className="underline">פתיחה</a>
                      <a href={fileUrl(id, f.position, true)} className="underline">הורדה</a>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="הערות פנימיות">
        <p className="text-sm text-black/60">גלויות רק לצוות. המגישים לא רואים אותן.</p>
        {d.notes.length > 0 && (
          <ul className="space-y-3">
            {d.notes.map((n) => (
              <li key={n.id} className="bg-[#fff7c2] rounded-md p-3">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="text-xs text-black/60 mt-1">{n.author ?? 'צוות'} · {fmtDate(n.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="note" className="sr-only">הערה חדשה</label>
        <textarea id="note" className={`${inputCls} min-h-24`} placeholder="הערה חדשה…" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button disabled={busy || !note.trim()} onClick={() => act(async () => { await apiPost('note', { id, body: note }); setNote('') }, 'ההערה נשמרה.')}>שמירת הערה</Button>
      </Section>

      <Section title="תיקון פרט">
        <p className="text-sm text-black/60">התשובה המקורית של המגיש.ה נשמרת תמיד. התיקון נרשם לצדה, עם הסיבה ומי תיקן.</p>
        {d.corrections.length > 0 && (
          <ul className="space-y-2">
            {d.corrections.map((c, i) => (
              <li key={i} className="border border-black/15 rounded-md p-3 text-sm">
                <b>{FIELD_LABEL[c.field] ?? c.field}:</b> {String(c.old_value ?? '')} ← <b>{String(c.new_value ?? '')}</b>
                <span className="block text-black/60">{c.reason} · {c.author ?? 'צוות'} · {fmtDate(c.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid sm:grid-cols-[12rem_1fr] gap-3">
          <Field label="שדה" id="fix-field">
            <select id="fix-field" className={inputCls} value={fix.field} onChange={(e) => setFix({ ...fix, field: e.target.value })}>
              {Object.entries(FIELD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="הערך המתוקן" id="fix-value"><input id="fix-value" className={inputCls} value={fix.value} onChange={(e) => setFix({ ...fix, value: e.target.value })} /></Field>
        </div>
        <Field label="סיבת התיקון" id="fix-reason"><input id="fix-reason" className={inputCls} placeholder="למשל: המגישה ביקשה בטלפון לעדכן את המייל" value={fix.reason} onChange={(e) => setFix({ ...fix, reason: e.target.value })} /></Field>
        <Button variant="secondary" disabled={busy || !fix.reason.trim()} onClick={() => act(async () => { await apiPost('correction', { id, ...fix }); setFix({ field: 'name', value: '', reason: '' }) }, 'התיקון נרשם.')}>רישום תיקון</Button>
      </Section>

      <Section title="היסטוריית סטטוסים">
        <ol className="space-y-1 text-sm">
          {d.history.map((h, i) => (
            <li key={i}>
              {fmtDate(h.changed_at)} · {h.from_status ? `${STATUS_LABEL[h.from_status] ?? 'טיוטה'} ← ` : ''}<b>{h.to_status === ('draft' as Status) ? 'טיוטה' : STATUS_LABEL[h.to_status]}</b>
              {h.by ? ` · ${h.by}` : h.to_status === 'new' ? ' · נשלחה מהאתר' : ''}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}
