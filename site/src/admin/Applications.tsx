import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DISCIPLINES, IDENTITIES, LOCATIONS, STAGES } from '../shared/application'
import { STATUSES, STATUS_COLOR, apiGet, useAdmin, type Status } from './api'
import { Button, Notice, PageTitle, Spinner, inputCls } from './ui'

type Row = { id: string; name: string; email: string; phone: string; project: string; disciplines: string[]; location: string; stage: string; identity: string; city: string; age: number; status: Status; submitted_at: string; files: number; notes: number }

// stored values may carry the applicant's own text ("אחר: …", "מקום אחר: …"): filter on the option they chose
const base = (v: string) => v.split(':')[0]
const exportCls = 'inline-flex items-center min-h-11 px-4 rounded-md font-bold bg-white border-2 border-black hover:bg-[#fff7c2]'

export default function Applications() {
  const { t: all, lang, fmt, errText, withLang } = useAdmin()
  const t = all.list
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState<unknown>(null)
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
    apiGet<{ applications: Row[] }>('applications').then((d) => setRows(d.applications)).catch(setErr)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q])

  // option values are the stored (Hebrew) values; only what is shown is in the interface language
  const select = (k: string, label: string, opts: [string, string][]) => (
    <label className="text-sm">
      <span className="block font-bold mb-1">{label}</span>
      <select className={inputCls} value={f(k)} onChange={(e) => setF(k, e.target.value)}>
        <option value="">{t.all}</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
  const labelled = <T extends string>(values: readonly T[], labels: Record<T, string>): [string, string][] => values.map((v) => [v, labels[v] ?? v])
  const active = ['q', 'status', 'discipline', 'location', 'stage', 'identity', 'from', 'to'].some((k) => f(k))
  const o = all.options
  const ad = lang === 'en' ? 'auto' : undefined // applicants' answers keep their own direction in the English interface

  return (
    <div>
      <PageTitle
        actions={
          <>
            <a href="/api/admin?route=export" className={exportCls}>{t.export}</a>
            {lang === 'en' && <a href="/api/admin?route=export&lang=en" className={exportCls}>{t.exportEn}</a>}
          </>
        }
      >
        {t.title}
      </PageTitle>
      <section aria-label={t.filters} className="bg-white border border-black/15 rounded-lg p-4 mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <label className="text-sm sm:col-span-2 xl:col-span-1">
          <span className="block font-bold mb-1">{t.search}</span>
          <input className={inputCls} type="search" placeholder={t.searchPh} value={f('q')} onChange={(e) => setF('q', e.target.value)} />
        </label>
        {select('status', t.status, labelled(STATUSES, all.status))}
        {select('discipline', t.discipline, labelled(DISCIPLINES, o.disciplines))}
        {select('location', t.location, labelled(LOCATIONS, o.locations))}
        {select('stage', t.stage, labelled(STAGES, o.stages))}
        {select('identity', t.identity, labelled(IDENTITIES, o.identities))}
        <label className="text-sm"><span className="block font-bold mb-1">{t.from}</span><input type="date" className={inputCls} value={f('from')} onChange={(e) => setF('from', e.target.value)} /></label>
        <label className="text-sm"><span className="block font-bold mb-1">{t.to}</span><input type="date" className={inputCls} value={f('to')} onChange={(e) => setF('to', e.target.value)} /></label>
        {select('sort', t.sort, labelled(['new', 'old', 'name', 'project'] as const, t.sorts))}
        {active && <div className="self-end"><Button variant="ghost" onClick={() => setQ(lang === 'en' ? { lang: 'en' } : {}, { replace: true })}>{t.clear}</Button></div>}
      </section>
      {!!err && <Notice kind="error">{errText(err)}</Notice>}
      {!rows && !err && <Spinner />}
      {rows && (
        <>
          <p className="mb-2 text-sm text-black/70" aria-live="polite">{t.count(shown.length, rows.length)}</p>
          {rows.length === 0 ? (
            <Notice>{t.empty}</Notice>
          ) : (
            <div className="overflow-x-auto bg-white border border-black/15 rounded-lg">
              <table className="w-full min-w-[860px] text-start border-collapse">
                <thead className="bg-[#fff7c2] text-sm">
                  <tr>{t.cols.map((h, i) => <th key={i} scope="col" className="text-start px-3 py-2.5">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className="border-t border-black/10 hover:bg-black/[.03] align-top">
                      <td className="px-3 py-3"><span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${STATUS_COLOR[r.status]}`}>{all.status[r.status]}</span></td>
                      <td className="px-3 py-3 font-bold" dir={ad}><Link to={withLang(`/admin/applications/${r.id}`)} className="underline underline-offset-4">{r.project}</Link></td>
                      <td className="px-3 py-3"><span dir={ad}>{r.name}</span><span className="block text-sm text-black/60 text-start break-all" dir="ltr">{r.email}</span></td>
                      <td className="px-3 py-3 text-sm" dir={ad}>{r.disciplines.join(' · ')}</td>
                      <td className="px-3 py-3 text-sm" dir={ad}>{r.location}</td>
                      <td className="px-3 py-3 text-sm" dir={ad}>{r.stage}</td>
                      <td className="px-3 py-3 text-sm tabular-nums whitespace-nowrap">{fmt(r.submitted_at)}</td>
                      <td className="px-3 py-3 text-sm text-black/60 whitespace-nowrap">
                        {r.files ? <span title={t.filesAria(r.files)}>📎 {r.files}</span> : ''} {r.notes ? <span title={t.notesAria(r.notes)}>💬 {r.notes}</span> : ''}
                      </td>
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
