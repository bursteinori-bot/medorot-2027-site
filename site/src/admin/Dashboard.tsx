import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMe } from './AdminApp'
import { STATUS_COLOR, STATUS_LABEL, apiGet, fmtDate, type Status } from './api'
import { Card, Notice, PageTitle, Spinner } from './ui'

type Stats = { counts: Partial<Record<Status, number>>; recent: { id: string; name: string; project: string; disciplines: string[]; status: Status; submitted_at: string }[] }

export default function Dashboard() {
  const me = useMe()
  const reviewer = me.role === 'admin' || me.role === 'reviewer'
  const [s, setS] = useState<Stats | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (reviewer) apiGet<Stats>('stats').then(setS).catch((e) => setErr(e.message))
  }, [reviewer])

  const total = s ? Object.values(s.counts).reduce((a, b) => a + (b ?? 0), 0) : 0
  const tiles: [string, number, string][] = s
    ? [
        ['סה״כ הגשות', total, ''],
        ['חדשות', s.counts.new ?? 0, 'new'],
        ['בבדיקה', s.counts.in_review ?? 0, 'in_review'],
        ['מועמדות להמשך', s.counts.shortlisted ?? 0, 'shortlisted'],
        ['התקבלו', s.counts.accepted ?? 0, 'accepted'],
        ['נדחו', s.counts.rejected ?? 0, 'rejected'],
      ]
    : []
  return (
    <div>
      <PageTitle>שלום{me.display_name ? `, ${me.display_name}` : ''}</PageTitle>
      {!reviewer && (
        <Card>
          <p className="text-lg">מכאן אפשר לערוך את התוכן של האתר: טקסטים, תאריכים, קישורים ותמונות.</p>
          <Link to="/admin/content" className="inline-block mt-3 underline font-bold">לניהול תוכן האתר ←</Link>
        </Card>
      )}
      {err && <Notice kind="error">{err}</Notice>}
      {reviewer && !s && !err && <Spinner />}
      {s && (
        <>
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
            {tiles.map(([label, n, status]) => (
              <li key={label}>
                <Link to={status ? `/admin/applications?status=${status}` : '/admin/applications'} className="block bg-white border border-black/15 rounded-lg p-4 hover:border-black">
                  <span className="block text-sm text-black/60">{label}</span>
                  <span className="block text-4xl font-black tabular-nums">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
          {(s.counts.needs_info ?? 0) > 0 && <div className="mb-6"><Notice>{s.counts.needs_info} הגשות מחכות להשלמת מידע.</Notice></div>}
          <Card>
            <h2 className="text-2xl font-bold mb-3">הגשות אחרונות</h2>
            {s.recent.length === 0 ? (
              <p className="text-black/60">עדיין אין הגשות. הן יופיעו כאן ברגע שיישלחו מהאתר.</p>
            ) : (
              <ul className="divide-y divide-black/10">
                {s.recent.map((a) => (
                  <li key={a.id}>
                    <Link to={`/admin/applications/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-black/[.03] px-2 -mx-2 rounded">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                      <span className="font-bold">{a.project}</span>
                      <span>{a.name}</span>
                      <span className="text-sm text-black/60">{a.disciplines.join(' · ')}</span>
                      <span className="ms-auto text-sm text-black/60 tabular-nums">{fmtDate(a.submitted_at)}</span>
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
