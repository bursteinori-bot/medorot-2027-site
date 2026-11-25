import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { STATUSES, STATUS_COLOR, apiGet, apiPost, fileUrl, fmtSize, useAdmin, type Status } from './api'
import { Button, Card, Field, Notice, PageTitle, Spinner, inputCls } from './ui'

type Answers = Record<string, string | string[] | boolean>
type Detail = {
  application: { id: string; status: Status; submitted_at: string; answers: Answers; name: string; email: string; phone: string; age: number; city: string; identity: string; project: string; disciplines: string[]; location: string; stage: string; notification_error: string | null }
  files: { position: number; original_name: string; size_bytes: number; mime_type: string | null }[]
  notes: { id: string; body: string; created_at: string; author: string | null }[]
  history: { from_status: Status | null; to_status: Status; changed_at: string; by: string | null }[]
  corrections: { field: string; old_value: unknown; new_value: unknown; reason: string; created_at: string; author: string | null }[]
}

// the answer fields a correction can be recorded for (labels: t.detail.fields)
const FIELDS = ['name', 'email', 'phone', 'age', 'city', 'identity', 'bio', 'project', 'description', 'jewish', 'portfolio', 'social', 'links', 'notes']

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="space-y-3">
    <h2 className="text-xl font-bold">{title}</h2>
    {children}
  </Card>
)
// applicants' answers are shown exactly as sent; in the English interface they keep their own direction (dir=auto)
const Row = ({ k, children, auto }: { k: string; children: ReactNode; auto?: boolean }) => (
  <div className="grid sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-0.5 py-2 border-b border-black/10 last:border-0">
    <dt className="text-sm text-black/60">{k}</dt>
    <dd className={`whitespace-pre-wrap break-words ${auto ? 'text-left' : ''}`} dir={auto ? 'auto' : undefined}>{children}</dd>
  </div>
)
// in the English interface, Hebrew names and texts next to dates are isolated so the line keeps its order
const Iso = ({ on, children }: { on: boolean; children: ReactNode }) => (on ? <bdi>{children}</bdi> : <>{children}</>)
const linkify =(s: string) => s.split(/(\s+)/).map((p, i) => (/^https?:\/\/\S+$/.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer noopener" className="underline inline-block max-w-full break-all" dir="ltr">{p}</a> : p))

export default function ApplicationDetail() {
  const { id = '' } = useParams()
  const { t: all, lang, fmt, errText, withLang } = useAdmin()
  const t = all.detail
  const auto = lang === 'en'
  const ad = auto ? 'auto' : undefined
  const [d, setD] = useState<Detail | null>(null)
  const [err, setErr] = useState<unknown>(null)
  const [msg, setMsg] = useState('')
  const [note, setNote] = useState('')
  const [fix, setFix] = useState({ field: 'name', value: '', reason: '' })
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => apiGet<Detail>('application', { id }).then(setD).catch(setErr), [id])
  useEffect(() => {
    load()
  }, [load])

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setMsg('')
    setErr(null)
    try {
      await fn()
      await load()
      setMsg(ok)
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }

  if (err && !d) return <Notice kind="error">{errText(err)}</Notice>
  if (!d) return <Spinner />
  const a = d.application
  const ans = a.answers
  const str = (k: string) => (Array.isArray(ans[k]) ? (ans[k] as string[]).join(', ') : String(ans[k] ?? ''))
  const statusName = (s: Status | null) => (s && all.status[s]) || all.draftStatus

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to={withLang('/admin/applications')} className="underline">{all.backArrow} {t.back}</Link>
      <PageTitle><span dir={ad}>{a.project}</span></PageTitle>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-sm font-bold px-2.5 py-1 rounded ${STATUS_COLOR[a.status]}`}>{all.status[a.status]}</span>
        <span className="text-black/70">{t.submitted(fmt(a.submitted_at))}</span>
        {a.notification_error && <span className="text-sm text-black/60">{t.mailFailed}</span>}
      </div>
      {msg && <Notice kind="ok">{msg}</Notice>}
      {!!err && <Notice kind="error">{errText(err)}</Notice>}

      <Section title={t.statusTitle}>
        <p className="text-sm text-black/60">{t.statusNote}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.statusGroup}>
          {STATUSES.map((s) => (
            <button key={s} type="button" disabled={busy || s === a.status} aria-pressed={s === a.status} onClick={() => act(() => apiPost('status', { id, status: s }), t.statusChanged(all.status[s]))} className={`min-h-10 px-3 rounded-md border-2 text-sm font-bold ${s === a.status ? `${STATUS_COLOR[s]} border-transparent` : 'border-black/20 bg-white hover:border-black'}`}>
              {all.status[s]}
            </button>
          ))}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title={t.personal}>
          <dl>
            <Row k={t.name} auto={auto}>{a.name}</Row>
            <Row k={t.email}><a href={`mailto:${a.email}`} className="underline select-all inline-block max-w-full break-all" dir="ltr">{a.email}</a></Row>
            <Row k={t.phone}><span dir="ltr" className="select-all inline-block">{a.phone}</span></Row>
            <Row k={t.age}>{a.age}</Row>
            <Row k={t.city} auto={auto}>{a.city}</Row>
            <Row k={t.identity} auto={auto}>{a.identity}</Row>
          </dl>
        </Section>
        <Section title={t.project}>
          <dl>
            <Row k={t.disciplines} auto={auto}>{a.disciplines.join(' · ')}</Row>
            <Row k={t.location} auto={auto}>{a.location}</Row>
            <Row k={t.stage} auto={auto}>{a.stage}</Row>
            <Row k={t.portfolio}>{str('portfolio') ? linkify(str('portfolio')) : all.dash}</Row>
            {str('social') && <Row k={t.social}>{linkify(str('social'))}</Row>}
          </dl>
        </Section>
      </div>

      <Section title={t.bio}><p className="whitespace-pre-wrap leading-relaxed" dir={ad}>{str('bio')}</p></Section>
      <Section title={t.description}><p className="whitespace-pre-wrap leading-relaxed" dir={ad}>{str('description')}</p></Section>
      <Section title={t.jewish}><p className="whitespace-pre-wrap leading-relaxed" dir={ad}>{str('jewish')}</p></Section>
      {(str('links') || str('notes')) && (
        <Section title={t.linksNotes}>
          <dl>
            {str('links') && <Row k={t.links} auto={auto}>{linkify(str('links'))}</Row>}
            {str('notes') && <Row k={t.notes} auto={auto}>{str('notes')}</Row>}
          </dl>
        </Section>
      )}

      <Section title={t.files(d.files.length)}>
        {d.files.length === 0 ? <p className="text-black/60">{t.noFiles}</p> : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.files.map((f) => {
              const img = f.mime_type?.startsWith('image/')
              return (
                <li key={f.position} className="border border-black/15 rounded-lg overflow-hidden bg-[#faf8f1]">
                  {img && <a href={fileUrl(id, f.position)} target="_blank" rel="noreferrer"><img src={fileUrl(id, f.position)} alt={t.previewAlt(f.original_name)} loading="lazy" className="w-full aspect-[4/3] object-cover bg-white" /></a>}
                  {f.mime_type?.startsWith('video/') && <video src={fileUrl(id, f.position)} controls preload="metadata" className="w-full aspect-video bg-black" />}
                  <div className="p-3 text-sm">
                    <p className="font-bold truncate" dir="ltr">{f.original_name}</p>
                    <p className="text-black/60">{fmtSize(f.size_bytes)} · {f.mime_type}</p>
                    <p className="flex gap-3 mt-1">
                      <a href={fileUrl(id, f.position)} target="_blank" rel="noreferrer" className="underline">{t.open}</a>
                      <a href={fileUrl(id, f.position, true)} className="underline">{t.download}</a>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title={t.internalNotes}>
        <p className="text-sm text-black/60">{t.internalNotesNote}</p>
        {d.notes.length > 0 && (
          <ul className="space-y-3">
            {d.notes.map((n) => (
              <li key={n.id} className="bg-[#fff7c2] rounded-md p-3">
                <p className="whitespace-pre-wrap" dir={ad}>{n.body}</p>
                <p className="text-xs text-black/60 mt-1"><Iso on={auto}>{n.author ?? all.team}</Iso> · <Iso on={auto}>{fmt(n.created_at)}</Iso></p>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="note" className="sr-only">{t.newNote}</label>
        <textarea id="note" dir={ad} className={`${inputCls} min-h-24`} placeholder={t.newNotePh} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button disabled={busy || !note.trim()} onClick={() => act(async () => { await apiPost('note', { id, body: note }); setNote('') }, t.noteSaved)}>{t.saveNote}</Button>
      </Section>

      <Section title={t.fixTitle}>
        <p className="text-sm text-black/60">{t.fixNote}</p>
        {d.corrections.length > 0 && (
          <ul className="space-y-2">
            {d.corrections.map((c, i) => (
              <li key={i} className="border border-black/15 rounded-md p-3 text-sm">
                <b>{t.fields[c.field] ?? c.field}:</b> <span dir={ad}>{String(c.old_value ?? '')}</span> {all.toArrow} <b dir={ad}>{String(c.new_value ?? '')}</b>
                <span className="block text-black/60"><Iso on={auto}>{c.reason}</Iso> · <Iso on={auto}>{c.author ?? all.team}</Iso> · <Iso on={auto}>{fmt(c.created_at)}</Iso></span>
              </li>
            ))}
          </ul>
        )}
        <div className="grid sm:grid-cols-[12rem_1fr] gap-3">
          <Field label={t.fixField} id="fix-field">
            <select id="fix-field" className={inputCls} value={fix.field} onChange={(e) => setFix({ ...fix, field: e.target.value })}>
              {FIELDS.map((k) => <option key={k} value={k}>{t.fields[k]}</option>)}
            </select>
          </Field>
          <Field label={t.fixValue} id="fix-value"><input id="fix-value" dir={ad} className={inputCls} value={fix.value} onChange={(e) => setFix({ ...fix, value: e.target.value })} /></Field>
        </div>
        <Field label={t.fixReason} id="fix-reason"><input id="fix-reason" dir={ad} className={inputCls} placeholder={t.fixReasonPh} value={fix.reason} onChange={(e) => setFix({ ...fix, reason: e.target.value })} /></Field>
        <Button variant="secondary" disabled={busy || !fix.reason.trim()} onClick={() => act(async () => { await apiPost('correction', { id, ...fix }); setFix({ field: 'name', value: '', reason: '' }) }, t.fixSaved)}>{t.fixSave}</Button>
      </Section>

      <Section title={t.history}>
        <ol className="space-y-1 text-sm">
          {d.history.map((h, i) => (
            <li key={i}>
              {fmt(h.changed_at)} · {h.from_status ? `${statusName(h.from_status)} ${all.toArrow} ` : ''}<b>{statusName(h.to_status)}</b>
              {h.by ? <> · <Iso on={auto}>{h.by}</Iso></> : h.to_status === 'new' ? ` · ${t.fromSite}` : ''}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}
