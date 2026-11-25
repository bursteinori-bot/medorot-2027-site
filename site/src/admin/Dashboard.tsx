import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMe } from './AdminApp'
import { STATUS_COLOR, apiGet, useAdmin, type Status } from './api'
import { Card, Notice, PageTitle, Spinner } from './ui'

type Stats = { counts: Partial<Record<Status, number>>; recent: { id: string; name: string; project: string; disciplines: string[]; status: Status; submitted_at: string }[] }

export default function Dashboard() {
  const me = useMe()
  const { t: all, fmt, errText, withLang } = useAdmin()
  const t = all.dashboard
  const reviewer = me.role === 'admin' || me.role === 'reviewer'
  const [s, setS] = useState<Stats | null>(null)
  const [err, setErr] = useState<unknown>(null)
  useEffect(() => {
    if (reviewer) apiGet<Stats>('stats').then(setS).catch(setErr)
  }, [reviewer])

  const total = s ? Object.values(s.counts).reduce((a, b) => a + (b ?? 0), 0) : 0
  const tiles: [string, number, string][] = s
    ? [
        [t.total, total, ''],
        ...(['new', 'in_review', 'shortlisted', 'accepted', 'rejected'] as const).map((k): [string, number, string] => [t.tiles[k], s.counts[k] ?? 0, k]),
      ]
    : []
  return (
    <div>
      <PageTitle>{t.hello(me.display_name)}</PageTitle>
      {!reviewer && (
        <Card>
          <p className="text-lg">{t.editorIntro}</p>
          <Link to={withLang('/admin/content')} className="inline-block mt-3 underline font-bold">{t.toContent}</Link>
        </Card>
      )}
      {!!err && <Notice kind="error">{errText(err)}</Notice>}
      {reviewer && !s && !err && <Spinner />}
      {s && (
        <>
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
            {tiles.map(([label, n, status]) => (
              <li key={status || 'all'}>
                <Link to={withLang(status ? `/admin/applications?status=${status}` : '/admin/applications')} className="block bg-white border border-black/15 rounded-lg p-4 hover:border-black">
                  <span className="block text-sm text-black/60">{label}</span>
                  <span className="block text-4xl font-black tabular-nums">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
          {(s.counts.needs_info ?? 0) > 0 && <div className="mb-6"><Notice>{t.needsInfo(s.counts.needs_info!)}</Notice></div>}
          <Card>
            <h2 className="text-2xl font-bold mb-3">{t.recent}</h2>
            {s.recent.length === 0 ? (
              <p className="text-black/60">{t.empty}</p>
            ) : (
              <ul className="divide-y divide-black/10">
                {s.recent.map((a) => (
                  <li key={a.id}>
                    <Link to={withLang(`/admin/applications/${a.id}`)} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-black/[.03] px-2 -mx-2 rounded">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_COLOR[a.status]}`}>{all.status[a.status]}</span>
                      <span className="font-bold">{a.project}</span>
                      <span>{a.name}</span>
                      <span className="text-sm text-black/60">{a.disciplines.join(' · ')}</span>
                      <span className="ms-auto text-sm text-black/60 tabular-nums">{fmt(a.submitted_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
