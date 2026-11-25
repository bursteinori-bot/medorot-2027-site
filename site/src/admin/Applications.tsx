import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DISCIPLINES, IDENTITIES, LOCATIONS, STAGES } from '../shared/application'
import { STATUS_COLOR, STATUS_LABEL, apiGet, fmtDate, type Status } from './api'
import { Button, Notice, PageTitle, Spinner, inputCls } from './ui'

type Row = { id: string; name: string; email: string; phone: string; project: string; disciplines: string[]; location: string; stage: string; identity: string; city: string; age: number; status: Status; submitted_at: string; files: number; notes: number }

// stored values may carry the applicant's own text ("אחר: …", "מקום אחר: …"): filter on the option they chose
const base = (v: string) => v.split(':')[0]

export default function Applications() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useSearchParams()
  const f = (k: string) => q.get(k) ?? ''
  const setF = (k: string, v: string) => {
    const n = new URLSearchParams(q)
    if (v) n.set(k, v)
    else n.delete(k)
    setQ(n, { replace: true })
  }
  useEffect(() => {
    document.getElementById('admin-title')?.focus()
    apiGet<{ applications: Row[] }>('applications').then((d) => setRows(d.applications)).catch((e) => setErr(e.message))
  }, [])

  const shown = useMemo(() => {
    if (!rows) return []
    const text = f('q').trim().toLowerCase()
    const from = f('from') ? new Date(f('from')).getTime() : -Infinity
    const to = f('to') ? new Date(f('to')).getTime() + 86400000 : Infinity
    const out = rows.filter((r) => {
      const t = new Date(r.submitted_at).getTime()
      return (
        (!text || `${r.name} ${r.project} ${r.email}`.toLowerCase().includes(text)) &&
        (!f('status') || r.status === f('status')) &&
        (!f('discipline') || r.disciplines.some((d) => base(d) === f('discipline'))) &&
        (!f('location') || base(r.location) === f('location')) &&
        (!f('stage') || r.stage === f('stage')) &&
        (!f('identity') || base(r.identity) === f('identity')) &&
        t >= from && t < to
      )
    })
    const sort = f('sort') || 'new'
    return out.sort((a, b) =>
      sort === 'old' ? a.submitted_at.localeCompare(b.submitted_at) : sort === 'name' ? a.name.localeCompare(b.name, 'he') : sort === 'project' ? a.project.localeCompare(b.project, 'he') : b.submitted_at.localeCompare(a.submitted_at),
    )
  }, [rows, q])

  const select = (k: string, label: string, opts: readonly string[] | [string, string][]) => (
    <label className="text-sm">
      <span className="block font-bold mb-1">{label}</span>
      <select className={inputCls} value={f(k)} onChange={(e) => setF(k, e.target.value)}>
        <option value="">הכל</option>
        {opts.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
      </select>
    </label>
  )
  const active = ['q', 'status', 'discipline', 'location', 'stage', 'identity', 'from', 'to'].some((k) => f(k))

  return (
    <div>
      <PageTitle actions={<a href="/api/admin?route=export" className="inline-flex items-center min-h-11 px-4 rounded-md font-bold bg-white border-2 border-black hover:bg-[#fff7c2]">ייצוא ל-CSV (אקסל)</a>}>הגשות</PageTitle>
      <section aria-label="חיפוש וסינון" className="bg-white border border-black/15 rounded-lg p-4 mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <label className="text-sm sm:col-span-2 xl:col-span-1">
          <span className="block font-bold mb-1">חיפוש</span>
          <input className={inputCls} type="search" placeholder="שם, פרויקט או אימייל" value={f('q')} onChange={(e) => setF('q', e.target.value)} />
        </label>
        {select('status', 'סטטוס', Object.entries(STATUS_LABEL) as [string, string][])}
        {select('discipline', 'תחום', DISCIPLINES)}
        {select('location', 'מיקום מבוקש', LOCATIONS)}
        {select('stage', 'שלב הפרויקט', STAGES)}
        {select('identity', 'הגדרה עצמית', IDENTITIES)}
        <label className="text-sm"><span className="block font-bold mb-1">מתאריך</span><input type="date" className={inputCls} value={f('from')} onChange={(e) => setF('from', e.target.value)} /></label>
        <label className="text-sm"><span className="block font-bold mb-1">עד תאריך</span><input type="date" className={inputCls} value={f('to')} onChange={(e) => setF('to', e.target.value)} /></label>
        {select('sort', 'מיון', [['new', 'החדשות קודם'], ['old', 'הישנות קודם'], ['name', 'לפי שם'], ['project', 'לפי פרויקט']])}
        {active && <div className="self-end"><Button variant="ghost" onClick={() => setQ({}, { replace: true })}>ניקוי הסינון</Button></div>}
      </section>
      {err && <Notice kind="error">{err}</Notice>}
      {!rows && !err && <Spinner />}
      {rows && (
        <>
          <p className="mb-2 text-sm text-black/70" aria-live="polite">{shown.length} מתוך {rows.length} הגשות</p>
          {rows.length === 0 ? (
            <Notice>עדיין אין הגשות. הן יופיעו כאן ברגע שיישלחו מהאתר.</Notice>
          ) : (
            <div className="overflow-x-auto bg-white border border-black/15 rounded-lg">
              <table className="w-full min-w-[860px] text-start border-collapse">
                <thead className="bg-[#fff7c2] text-sm">
                  <tr>{['סטטוס', 'פרויקט', 'שם', 'תחומים', 'מיקום', 'שלב', 'הוגשה', ''].map((h) => <th key={h} scope="col" className="text-start px-3 py-2.5">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className="border-t border-black/10 hover:bg-black/[.03] align-top">
                      <td className="px-3 py-3"><span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                      <td className="px-3 py-3 font-bold"><Link to={`/admin/applications/${r.id}`} className="underline underline-offset-4">{r.project}</Link></td>
                      <td className="px-3 py-3">{r.name}<span className="block text-sm text-black/60 text-start break-all" dir="ltr">{r.email}</span></td>
                      <td className="px-3 py-3 text-sm">{r.disciplines.join(' · ')}</td>
                      <td className="px-3 py-3 text-sm">{r.location}</td>
                      <td className="px-3 py-3 text-sm">{r.stage}</td>
                      <td className="px-3 py-3 text-sm tabular-nums whitespace-nowrap">{fmtDate(r.submitted_at)}</td>
                      <td className="px-3 py-3 text-sm text-black/60 whitespace-nowrap">{r.files ? `📎 ${r.files}` : ''} {r.notes ? `💬 ${r.notes}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
