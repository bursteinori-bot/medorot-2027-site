import { useEffect, useMemo, useState } from 'react'
import { apiGet, fmtDate } from './api'
import { Card, Notice, PageTitle, Spinner } from './ui'

// "שימושיות": anonymous usage statistics. No names, no IPs, no cookies: a visitor is counted per day only.

type Data = {
  days: number
  totals: { pageviews: number; sessions: number; visitor_days: number }
  daily: { day: string; pageviews: number; visitors: number }[]
  sections: { name: string; views: number; sessions: number }[]
  referrers: { host: string; sessions: number }[]
  devices: { device: string; sessions: number }[]
  countries: { country: string; sessions: number }[]
  cities: { city: string; sessions: number }[]
  funnel: { viewed: number; s1: number; s2: number; s3: number; s4: number; submitted: number }
  events: { name: string; n: number }[]
  live: { session: string; name: string; device: string; country: string | null; city: string | null; at: string }[]
  recent: { at: string; name: string; device: string; country: string | null; city: string | null; referrer_host: string | null }[]
}

const SECTION: Record<string, string> = {
  home: 'ראשי', about: 'על הפסטיבל', 'open-call': 'הקול הקורא', spaces: 'מרחבי הפסטיבל', apply: 'הגשת הצעה', support: 'שותפות ותמיכה', details: 'פרטים', privacy: 'מדיניות פרטיות', accessibility: 'הצהרת נגישות',
}
const DEVICE: Record<string, string> = { mobile: 'טלפון', tablet: 'טאבלט', desktop: 'מחשב' }
const EVENT: Record<string, string> = {
  sculpture_shuffle: 'ערבבו את הפסל', sculpture_swap: 'החליפו חלק בפסל', photo_open: 'צפו בצילומי המרחבים', outbound: 'לחצו על האינסטגרם',
  donation_amount: 'בחרו סכום תרומה', form_submitted: 'שלחו הצעה', form_error: 'נתקלו בשגיאה בשליחה', cta: 'לחצו על כפתור',
}
const SOURCE = (host: string) => {
  if (!host) return 'כניסה ישירה / קישור שנשלח'
  if (/instagram/.test(host)) return 'אינסטגרם'
  if (/facebook|fb\./.test(host)) return 'פייסבוק'
  if (/whatsapp|wa\.me/.test(host)) return 'וואטסאפ'
  if (/google/.test(host)) return 'גוגל'
  if (/t\.co|twitter|x\.com/.test(host)) return 'X / טוויטר'
  if (/linkedin/.test(host)) return 'לינקדאין'
  return host
}
const countryName = (() => {
  let dn: Intl.DisplayNames | null = null
  try { dn = new Intl.DisplayNames(['he'], { type: 'region' }) } catch { /* old browser */ }
  return (code: string | null) => (!code ? 'לא ידוע' : dn?.of(code) ?? code)
})()
const place = (country: string | null, city: string | null) => [city, countryName(country)].filter(Boolean).join(', ')
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
const nf = new Intl.NumberFormat('he-IL')

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-black/15 rounded-lg p-4">
      <p className="text-sm text-black/60">{label}</p>
      <p className="text-4xl font-black tabular-nums">{typeof value === 'number' ? nf.format(value) : value}</p>
      {sub && <p className="text-sm text-black/60 mt-0.5">{sub}</p>}
    </div>
  )
}

// horizontal bars: one hue, value as text in ink beside the bar
function Bars({ rows, empty = 'עדיין אין נתונים.' }: { rows: { label: string; value: number; note?: string }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="text-black/60">{empty}</p>
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${nf.format(r.value)}${r.note ? ` (${r.note})` : ''}`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate">{r.label}</span>
            <span className="tabular-nums text-sm shrink-0">{nf.format(r.value)}{r.note && <span className="text-black/60"> · {r.note}</span>}</span>
          </div>
          <div className="mt-1 h-2.5 bg-black/[.06] rounded-[4px]">
            <div className="h-full rounded-[4px] bg-[#c42a7d]" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// daily visitors: columns from a shared baseline, hover shows the day's numbers
function Daily({ data }: { data: Data['daily'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.visitors))
  const top = Math.ceil(max / 5) * 5 || 5
  const W = 720
  const H = 200
  const pad = { l: 8, r: 36, t: 10, b: 24 }
  const bw = (W - pad.l - pad.r) / data.length
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top)
  const label = (s: string) => new Date(s).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
  const every = Math.ceil(data.length / 8)
  const h = hover !== null ? data[hover] : null
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="מבקרים לפי יום" onMouseLeave={() => setHover(null)}>
        {[0, top / 2, top].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#000" strokeOpacity={v === 0 ? 0.35 : 0.08} />
            <text x={W - pad.r + 6} y={y(v) + 4} fontSize="11" fill="#555" textAnchor="start">{nf.format(v)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          // RTL reading: the newest day sits on the left
          const x = W - pad.r - (i + 1) * bw
          const top4 = Math.min(4, (H - pad.b - y(d.visitors)) / 2)
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${label(d.day)}: ${d.visitors} מבקרים, ${d.pageviews} צפיות`}>
              <rect x={x} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {d.visitors > 0 && <path d={`M${x + 1},${H - pad.b} V${y(d.visitors) + top4} q0,-${top4} ${top4},-${top4} H${x + bw - 1 - top4} q${top4},0 ${top4},${top4} V${H - pad.b} Z`} fill={hover === i ? '#0a0a0a' : '#c42a7d'} />}
              {(data.length - 1 - i) % every === 0 && <text x={x + bw / 2} y={H - 6} fontSize="11" fill="#555" textAnchor="middle">{label(d.day)}</text>}
            </g>
          )
        })}
      </svg>
      {h && (
        <div className="absolute top-0 left-0 bg-black text-white text-sm rounded-md px-3 py-2 pointer-events-none" role="status">
          <b>{new Date(h.day).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</b>
          <br />{nf.format(h.visitors)} מבקרים · {nf.format(h.pageviews)} צפיות בעמודים
        </div>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer underline">טבלה</summary>
        <table className="mt-2 w-full max-w-sm">
          <thead><tr><th className="text-start">יום</th><th className="text-start">מבקרים</th><th className="text-start">צפיות</th></tr></thead>
          <tbody>{[...data].reverse().map((d) => <tr key={d.day} className="border-t border-black/10"><td>{label(d.day)}</td><td className="tabular-nums">{d.visitors}</td><td className="tabular-nums">{d.pageviews}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  )
}

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [d, setD] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    let alive = true
    const load = () => apiGet<Data>('analytics', { days: String(days) }).then((x) => alive && setD(x)).catch((e) => alive && setErr(e.message))
    load()
    const t = setInterval(load, 30_000) // keep "now on the site" fresh
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [days])

  const events = useMemo(() => Object.fromEntries((d?.events ?? []).map((e) => [e.name, e.n])), [d])
  if (err && !d) return <Notice kind="error">{err}</Notice>
  if (!d) return <Spinner />
  const f = d.funnel
  const liveBySection = Object.entries(d.live.reduce<Record<string, number>>((a, l) => ({ ...a, [l.name]: (a[l.name] ?? 0) + 1 }), {}))

  return (
    <div className="max-w-6xl space-y-6">
      <PageTitle
        actions={
          <div role="group" aria-label="טווח זמן" className="flex gap-1 bg-white border border-black/15 rounded-md p-1">
            {[7, 30, 90].map((n) => (
              <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)} className={`min-h-9 px-3 rounded ${days === n ? 'bg-black text-white font-bold' : 'hover:bg-black/5'}`}>{n} ימים</button>
            ))}
          </div>
        }
      >
        שימושיות
      </PageTitle>
      <Notice>הנתונים אנונימיים: בלי עוגיות, בלי כתובות IP ובלי פרטים מזהים. מבקר נספר פעם אחת ביום. מי שביקש בדפדפן לא לעקוב אחריו (Do Not Track) לא נספר.</Notice>

      <Card>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-xl font-bold">עכשיו באתר</h2>
          <span className="text-4xl font-black tabular-nums">{d.live.length}</span>
          <span className="text-black/60">בחמש הדקות האחרונות · מתעדכן כל חצי דקה</span>
        </div>
        {d.live.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {liveBySection.map(([s, n]) => <li key={s} className="bg-[#fff7c2] rounded-full px-3 py-1 text-sm"><b>{n}</b> ב{SECTION[s] ?? s}</li>)}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="מבקרים" value={d.totals.visitor_days} sub={`ב-${d.days} הימים האחרונים`} />
        <Tile label="ביקורים" value={d.totals.sessions} />
        <Tile label="צפיות בעמודים" value={d.totals.pageviews} sub={d.totals.sessions ? `${(d.totals.pageviews / d.totals.sessions).toFixed(1)} לביקור` : undefined} />
        <Tile label="הצעות שנשלחו" value={f.submitted} sub={f.viewed ? `${pct(f.submitted, f.viewed)} ממי שנכנס לעמוד ההגשה` : undefined} />
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-3">מבקרים לפי יום</h2>
        <Daily data={d.daily} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-3">איפה צפו באתר</h2>
          <Bars rows={d.sections.map((s) => ({ label: SECTION[s.name] ?? s.name, value: s.views, note: `${s.sessions} ביקורים` }))} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-1">משפך ההגשה</h2>
          <p className="text-sm text-black/60 mb-3">כמה ביקורים הגיעו לכל שלב בטופס</p>
          <Bars
            rows={[
              { label: 'נכנסו לעמוד ההגשה', value: f.viewed },
              { label: 'התחילו למלא', value: f.s1, note: pct(f.s1, f.viewed) },
              { label: 'הגיעו לשלב 2', value: f.s2, note: pct(f.s2, f.s1) },
              { label: 'הגיעו לשלב 3', value: f.s3, note: pct(f.s3, f.s2) },
              { label: 'הגיעו לשלב 4', value: f.s4, note: pct(f.s4, f.s3) },
              { label: 'שלחו', value: f.submitted, note: pct(f.submitted, f.s4) },
            ]}
          />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">מאיפה הגיעו</h2>
          <Bars rows={d.referrers.map((r) => ({ label: SOURCE(r.host), value: r.sessions }))} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">מה עשו באתר</h2>
          <Bars rows={Object.keys(EVENT).filter((k) => events[k]).map((k) => ({ label: EVENT[k], value: events[k] }))} empty="עוד אין פעולות." />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">מכשירים</h2>
          <Bars rows={d.devices.map((x) => ({ label: DEVICE[x.device] ?? x.device, value: x.sessions }))} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">מאיפה בעולם</h2>
          <Bars rows={(d.cities.length ? d.cities.map((c) => ({ label: c.city, value: c.sessions })) : d.countries.map((c) => ({ label: countryName(c.country), value: c.sessions })))} />
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-3">צפיות אחרונות</h2>
        {d.recent.length === 0 ? <p className="text-black/60">עוד אין צפיות.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-start text-sm">
              <thead><tr className="border-b-2 border-black/20">{['מתי', 'עמוד', 'מכשיר', 'מאיפה', 'הגיע.ה מ'].map((h) => <th key={h} scope="col" className="text-start py-2 pe-3">{h}</th>)}</tr></thead>
              <tbody>
                {d.recent.map((r, i) => (
                  <tr key={i} className="border-b border-black/10">
                    <td className="py-2 pe-3 tabular-nums whitespace-nowrap">{fmtDate(r.at)}</td>
                    <td className="py-2 pe-3">{SECTION[r.name] ?? r.name}</td>
                    <td className="py-2 pe-3">{DEVICE[r.device] ?? r.device}</td>
                    <td className="py-2 pe-3">{place(r.country, r.city)}</td>
                    <td className="py-2 pe-3">{r.referrer_host ? SOURCE(r.referrer_host) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
