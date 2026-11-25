import { useEffect, useMemo, useState } from 'react'
import { apiGet, useAdmin } from './api'
import { Card, Notice, PageTitle, Spinner } from './ui'

// "שימושיות" (Usage): anonymous usage statistics. No names, no IPs, no cookies: a visitor is counted per day only.

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

type T = ReturnType<typeof useAdmin>['t']['analytics']
const sourceName = (t: T, host: string) => {
  const s = t.sources
  if (!host) return s.direct
  if (/instagram/.test(host)) return s.instagram
  if (/facebook|fb\./.test(host)) return s.facebook
  if (/whatsapp|wa\.me/.test(host)) return s.whatsapp
  if (/google/.test(host)) return s.google
  if (/t\.co|twitter|x\.com/.test(host)) return s.x
  if (/linkedin/.test(host)) return s.linkedin
  return host
}
const regionNames = (lang: string) => {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' })
  } catch {
    return null // old browser
  }
}
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')

function Tile({ label, value, sub, nf }: { label: string; value: string | number; sub?: string; nf: Intl.NumberFormat }) {
  return (
    <div className="bg-white border border-black/15 rounded-lg p-4">
      <p className="text-sm text-black/60">{label}</p>
      <p className="text-4xl font-black tabular-nums">{typeof value === 'number' ? nf.format(value) : value}</p>
      {sub && <p className="text-sm text-black/60 mt-0.5">{sub}</p>}
    </div>
  )
}

// horizontal bars: one hue, value as text in ink beside the bar
function Bars({ rows, empty, nf }: { rows: { label: string; value: number; note?: string }[]; empty: string; nf: Intl.NumberFormat }) {
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
function Daily({ data, nf }: { data: Data['daily']; nf: Intl.NumberFormat }) {
  const { t: all, lang } = useAdmin()
  const t = all.analytics
  const rtl = lang === 'he'
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.visitors))
  const top = Math.ceil(max / 5) * 5 || 5
  const W = 720
  const H = 200
  // the value axis sits at the end of the reading direction's start: on the right in Hebrew, on the left in English
  const pad = rtl ? { l: 8, r: 36, t: 10, b: 24 } : { l: 36, r: 8, t: 10, b: 24 }
  const bw = (W - pad.l - pad.r) / data.length
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top)
  const label = (s: string) => new Date(s).toLocaleDateString(all.dateLocale, { day: 'numeric', month: 'numeric' })
  const every = Math.ceil(data.length / 8)
  const h = hover !== null ? data[hover] : null
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={t.daily} onMouseLeave={() => setHover(null)}>
        {[0, top / 2, top].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#000" strokeOpacity={v === 0 ? 0.35 : 0.08} />
            <text x={rtl ? W - pad.r + 6 : pad.l - 6} y={y(v) + 4} fontSize="11" fill="#555" textAnchor={rtl ? 'start' : 'end'}>{nf.format(v)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          // reading order: in Hebrew (RTL) the newest day sits on the left, in English on the right
          const x = rtl ? W - pad.r - (i + 1) * bw : pad.l + i * bw
          const top4 = Math.min(4, (H - pad.b - y(d.visitors)) / 2)
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={t.dayAria(label(d.day), d.visitors, d.pageviews)}>
              <rect x={x} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              {d.visitors > 0 && <path d={`M${x + 1},${H - pad.b} V${y(d.visitors) + top4} q0,-${top4} ${top4},-${top4} H${x + bw - 1 - top4} q${top4},0 ${top4},${top4} V${H - pad.b} Z`} fill={hover === i ? '#0a0a0a' : '#c42a7d'} />}
              {(data.length - 1 - i) % every === 0 && <text x={x + bw / 2} y={H - 6} fontSize="11" fill="#555" textAnchor="middle">{label(d.day)}</text>}
            </g>
          )
        })}
      </svg>
      {h && (
        <div className="absolute top-0 left-0 bg-black text-white text-sm rounded-md px-3 py-2 pointer-events-none" role="status">
          <b>{new Date(h.day).toLocaleDateString(all.dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
          <br />{t.dayTip(nf.format(h.visitors), nf.format(h.pageviews))}
        </div>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer underline">{t.table}</summary>
        <table className="mt-2 w-full max-w-sm">
          <thead><tr>{t.tableCols.map((c) => <th key={c} className="text-start">{c}</th>)}</tr></thead>
          <tbody>{[...data].reverse().map((d) => <tr key={d.day} className="border-t border-black/10"><td>{label(d.day)}</td><td className="tabular-nums">{d.visitors}</td><td className="tabular-nums">{d.pageviews}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  )
}

export default function Analytics() {
  const { t: all, lang, fmt, errText } = useAdmin()
  const t = all.analytics
  const [days, setDays] = useState(30)
  const [d, setD] = useState<Data | null>(null)
  const [err, setErr] = useState<unknown>(null)
  useEffect(() => {
    let alive = true
    const load = () => apiGet<Data>('analytics', { days: String(days) }).then((x) => alive && setD(x)).catch((e) => alive && setErr(e))
    load()
    const timer = setInterval(load, 30_000) // keep "now on the site" fresh
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [days])

  const nf = useMemo(() => new Intl.NumberFormat(all.dateLocale), [all.dateLocale])
  const dn = useMemo(() => regionNames(lang), [lang])
  const events = useMemo(() => Object.fromEntries((d?.events ?? []).map((e) => [e.name, e.n])), [d])
  if (err && !d) return <Notice kind="error">{errText(err)}</Notice>
  if (!d) return <Spinner />
  const f = d.funnel
  const liveBySection = Object.entries(d.live.reduce<Record<string, number>>((a, l) => ({ ...a, [l.name]: (a[l.name] ?? 0) + 1 }), {}))
  const page = (name: string) => t.pages[name] ?? name
  const device = (name: string) => t.devices[name] ?? name
  const countryName = (code: string | null) => (!code ? t.unknown : dn?.of(code) ?? code)
  const place = (country: string | null, city: string | null) => [city, countryName(country)].filter(Boolean).join(', ')
  const fs = t.funnelSteps

  return (
    <div className="max-w-6xl space-y-6">
      <PageTitle
        actions={
          <div role="group" aria-label={t.range} className="flex gap-1 bg-white border border-black/15 rounded-md p-1">
            {[7, 30, 90].map((n) => (
              <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)} className={`min-h-9 px-3 rounded ${days === n ? 'bg-black text-white font-bold' : 'hover:bg-black/5'}`}>{t.days(n)}</button>
            ))}
          </div>
        }
      >
        {t.title}
      </PageTitle>
      <Notice>{t.privacy}</Notice>

      <Card>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-xl font-bold">{t.liveNow}</h2>
          <span className="text-4xl font-black tabular-nums">{d.live.length}</span>
          <span className="text-black/60">{t.liveNote}</span>
        </div>
        {d.live.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {liveBySection.map(([s, n]) => <li key={s} className="bg-[#fff7c2] rounded-full px-3 py-1 text-sm"><b>{n}</b> {t.liveIn(page(s))}</li>)}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile nf={nf} label={t.visitors} value={d.totals.visitor_days} sub={t.lastDays(d.days)} />
        <Tile nf={nf} label={t.sessions} value={d.totals.sessions} />
        <Tile nf={nf} label={t.pageviews} value={d.totals.pageviews} sub={d.totals.sessions ? t.perSession((d.totals.pageviews / d.totals.sessions).toFixed(1)) : undefined} />
        <Tile nf={nf} label={t.submitted} value={f.submitted} sub={f.viewed ? t.ofApplyViews(pct(f.submitted, f.viewed)) : undefined} />
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-3">{t.daily}</h2>
        <Daily data={d.daily} nf={nf} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold mb-3">{t.sections}</h2>
          <Bars nf={nf} empty={t.noData} rows={d.sections.map((s) => ({ label: page(s.name), value: s.views, note: t.sectionNote(s.sessions) }))} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-1">{t.funnel}</h2>
          <p className="text-sm text-black/60 mb-3">{t.funnelNote}</p>
          <Bars
            nf={nf}
            empty={t.noData}
            rows={[
              { label: fs.viewed, value: f.viewed },
              { label: fs.s1, value: f.s1, note: pct(f.s1, f.viewed) },
              { label: fs.s2, value: f.s2, note: pct(f.s2, f.s1) },
              { label: fs.s3, value: f.s3, note: pct(f.s3, f.s2) },
              { label: fs.s4, value: f.s4, note: pct(f.s4, f.s3) },
              { label: fs.submitted, value: f.submitted, note: pct(f.submitted, f.s4) },
            ]}
          />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">{t.referrers}</h2>
          <Bars nf={nf} empty={t.noData} rows={d.referrers.map((r) => ({ label: sourceName(t, r.host), value: r.sessions }))} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">{t.events}</h2>
          <Bars nf={nf} rows={Object.keys(t.eventNames).filter((k) => events[k]).map((k) => ({ label: t.eventNames[k], value: events[k] }))} empty={t.noEvents} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">{t.devicesTitle}</h2>
          <Bars nf={nf} empty={t.noData} rows={d.devices.map((x) => ({ label: device(x.device), value: x.sessions }))} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold mb-3">{t.world}</h2>
          <Bars nf={nf} empty={t.noData} rows={(d.cities.length ? d.cities.map((c) => ({ label: c.city, value: c.sessions })) : d.countries.map((c) => ({ label: countryName(c.country), value: c.sessions })))} />
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-3">{t.recent}</h2>
        {d.recent.length === 0 ? <p className="text-black/60">{t.noRecent}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-start text-sm">
              <thead><tr className="border-b-2 border-black/20">{t.recentCols.map((h) => <th key={h} scope="col" className="text-start py-2 pe-3">{h}</th>)}</tr></thead>
              <tbody>
                {d.recent.map((r, i) => (
                  <tr key={i} className="border-b border-black/10">
                    <td className="py-2 pe-3 tabular-nums whitespace-nowrap">{fmt(r.at)}</td>
                    <td className="py-2 pe-3">{page(r.name)}</td>
                    <td className="py-2 pe-3">{device(r.device)}</td>
                    <td className="py-2 pe-3">{place(r.country, r.city)}</td>
                    <td className="py-2 pe-3">{r.referrer_host ? sourceName(t, r.referrer_host) : '—'}</td>
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
