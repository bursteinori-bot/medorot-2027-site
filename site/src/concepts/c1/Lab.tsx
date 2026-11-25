import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ABOUT, HOME, NAV, OPEN_CALL, SETTINGS, SPACES, SUPPORT, FINAL_CTA, TAGLINE, img, type SectionId } from '../../content'
import { SculptureMixer } from '../../sculpture/SculptureMixer'
import { ApplicationForm } from '../../shared/ApplicationForm'
import { FestivalYear, OpenCallHeadline, PanelTitle, Reveal } from '../../shared/Blocks'
import { Donation } from '../../shared/Donation'
import { InfoList, Partners, PrivacyNote } from '../../shared/Info'
import { Lightbox } from '../../shared/Lightbox'
import { Logo } from '../../shared/Logo'
import { MobileNav } from '../../shared/MobileNav'
import { useSection } from '../../shared/useSection'

// Concept 1 — The Living Sculpture Lab. Yellow lab, the sculpture is the protagonist and recombines on every room change.
const ROOM_SCULPTURE: Record<SectionId, string> = {
  home: 'yellow', about: 'two-heads', 'open-call': 'antler-dancer', spaces: 'cream', apply: 'bird-watcher', support: 'crowned-wings', details: 'pink',
}

const vars = { '--ink': '#0a0a0a', '--paper': '#fee801', '--accent': '#fefaee', '--accent-2': '#e13d96', '--line': '#0a0a0a', '--field': '#fefaee', '--radius': '0px', '--focus': '#e13d96' } as React.CSSProperties

export default function Lab() {
  const { active, go } = useSection(1)
  const wide = active === 'apply' || active === 'spaces'
  return (
    <div style={vars} className="min-h-dvh bg-[var(--paper)] text-[color:var(--ink)]">
      <a href="#panel-title" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[200] bg-black text-white px-4 py-2">דילוג לתוכן</a>
      {/* desktop header: logo + numbered rooms */}
      <header className="hidden md:flex sticky top-0 z-40 items-stretch border-b-2 border-black bg-[var(--paper)]">
        <button type="button" onClick={() => go('home')} className="px-6 flex items-center border-e-2 border-black" aria-label="מדורות - לעמוד הראשי">
          <Logo className="w-48" />
        </button>
        <nav aria-label="ניווט ראשי" className="flex-1 flex">
          {NAV.map((n, i) => (
            <button
              key={n.id}
              type="button"
              aria-current={active === n.id ? 'page' : undefined}
              onClick={() => go(n.id)}
              className={`group relative flex-1 text-start px-3 py-3 border-e border-black/30 last:border-e-0 overflow-hidden ${active === n.id ? 'text-[color:var(--paper)]' : ''}`}
            >
              {active === n.id && <motion.span layoutId="c1-room" className="absolute inset-0 bg-black" transition={{ type: 'spring', stiffness: 260, damping: 28 }} />}
              <span className="relative block text-xs tabular-nums opacity-70">חדר {String(i + 1).padStart(2, '0')}</span>
              <span className="relative block text-lg xl:text-xl leading-tight group-hover:translate-x-[-3px] transition-transform">{n.label}</span>
            </button>
          ))}
        </nav>
      </header>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--paper)]">
        <button type="button" onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי"><Logo className="w-40" /></button>
        <span className="text-sm tabular-nums">2027</span>
      </div>
      <MobileNav active={active} onGo={go} bar="bg-[var(--paper)] border-y-2 border-black" chip={(a) => `px-4 py-2.5 text-[17px] leading-none border-2 border-black ${a ? 'bg-black text-[color:var(--paper)]' : 'bg-[var(--paper)]'}`} />

      <div className={`flex flex-col md:grid ${wide ? 'md:grid-cols-[1fr_minmax(260px,30vw)]' : 'md:grid-cols-[1fr_minmax(340px,44vw)]'} transition-[grid-template-columns] duration-700`}>
        {/* content panel */}
        <main className="relative min-w-0 border-black md:border-e-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={active}
              aria-labelledby="panel-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="px-5 md:px-10 xl:px-14 py-10 md:py-14"
            >
              <Wipe />
              <Panel id={active} go={go} />
            </motion.section>
          </AnimatePresence>
        </main>
        {/* the sculpture: sticky, recombines with each room */}
        <aside aria-label="פסל מתחלף" className="order-first md:order-none md:sticky md:top-[78px] md:h-[calc(100dvh-78px)] flex flex-col bg-[var(--paper)] border-b-2 md:border-b-0 border-black">
          <SculptureMixer
            value={ROOM_SCULPTURE[active]}
            aspect={0.86}
            className="flex-1 min-h-0 w-full max-w-[min(100%,38vh)] md:max-w-[min(100%,62vh)] mx-auto px-4 md:px-6 pt-4 md:pt-6"
            controls={({ shuffle, reset, name }) => (
              <div className="flex flex-wrap items-center gap-2 px-6 pb-5 pt-2 justify-center">
                <motion.button type="button" whileTap={{ scale: 0.92, rotate: -3 }} onClick={shuffle} className="min-h-12 px-6 bg-black text-[color:var(--paper)] text-xl font-bold">
                  ערבבו את הפסל ↻
                </motion.button>
                <button type="button" onClick={reset} className="min-h-12 px-4 border-2 border-black text-lg">איפוס</button>
                <span className="basis-full text-center text-sm opacity-75 mt-1" aria-hidden>{name} · לחצו על חלק כדי להחליף אותו</span>
              </div>
            )}
          />
        </aside>
      </div>

      <footer className="border-t-2 border-black px-5 md:px-10 py-10 grid md:grid-cols-3 gap-8 items-end bg-black text-[color:var(--paper)]">
        <div>
          <Logo invert className="w-56 mb-3" />
          <p className="text-xl">{TAGLINE}</p>
        </div>
        <nav aria-label="ניווט בכותרת התחתונה" className="flex flex-wrap gap-x-5 gap-y-2 text-lg">
          {NAV.map((n) => <button key={n.id} type="button" onClick={() => go(n.id)} className="underline-offset-4 hover:underline">{n.label}</button>)}
        </nav>
        <div className="md:text-left space-y-3">
          <a className="text-xl underline underline-offset-4" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" dir="ltr">@{SETTINGS.instagram}</a>
          <Partners invert className="md:justify-end" />
        </div>
      </footer>
    </div>
  )
}

// a magenta bar sweeps across the panel on every room change
function Wipe() {
  return <motion.span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[var(--accent-2)] origin-left z-10" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }} />
}

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="text-3xl md:text-4xl font-bold mt-14 mb-5 flex items-center gap-3"><span className="inline-block w-8 h-[3px] bg-black" />{children}</h2>

function Panel({ id, go }: { id: SectionId; go: (s: SectionId) => void }) {
  const [box, setBox] = useState<{ s: number; i: number } | null>(null)
  switch (id) {
    case 'home':
      return (
        <div>
          <OpenCallHeadline id="panel-title" lead="text-4xl md:text-6xl font-light" punch="text-[clamp(4.2rem,11vw,10.5rem)] font-black leading-[0.95] tracking-tight" />
          <p className="mt-6 text-3xl md:text-5xl font-medium"><FestivalYear /></p>
          <p className="mt-2 text-xl md:text-2xl">{TAGLINE}</p>
          <div className="mt-10 space-y-4 text-xl md:text-2xl leading-relaxed max-w-[38ch]">
            <p>{HOME.invite}</p>
            <p>{HOME.about}</p>
            <p>{HOME.fields}</p>
            <p className="font-bold">{HOME.closing}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <motion.button type="button" whileHover={{ rotate: -2, scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => go('apply')} className="min-h-14 px-8 bg-black text-[color:var(--paper)] text-2xl font-bold">{HOME.ctaPrimary} ←</motion.button>
            <button type="button" onClick={() => go('about')} className="min-h-14 px-6 border-2 border-black text-2xl">{HOME.ctaSecondary}</button>
          </div>
          <dl className="mt-12 grid grid-cols-1 sm:grid-cols-3 border-2 border-black text-lg">
            {[['תאריך הפסטיבל', SETTINGS.festivalDate], ['מועד אחרון להגשה', SETTINGS.deadline], ['מיקום', SETTINGS.venue]].map(([k, v]) => (
              <div key={k} className="p-4 border-b-2 sm:border-b-0 sm:border-e-2 last:border-0 border-black bg-[var(--accent)]">
                <dt className="text-sm opacity-70">{k}</dt>
                <dd className="text-xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    case 'about':
      return (
        <div>
          <PanelTitle className="text-[clamp(4rem,10vw,9rem)] font-black leading-none">{ABOUT.title}</PanelTitle>
          <div className="mt-8 space-y-5 text-2xl md:text-3xl leading-snug max-w-[34ch]">
            {ABOUT.paragraphs.map((p, i) => <p key={i}><Reveal text={p} delay={0.2 + i * 0.25} stagger={0.02} /></p>)}
          </div>
          <ul className="mt-12 flex flex-wrap gap-3" aria-label="מילים מרכזיות">
            {ABOUT.words.map((w, i) => (
              <motion.li key={w} initial={{ opacity: 0, scale: 0.6, rotate: i % 2 ? 8 : -8 }} animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 2 : -2 }} transition={{ delay: 0.8 + i * 0.08, type: 'spring' }} drag dragSnapToOrigin className={`cursor-grab px-5 py-2 text-4xl md:text-5xl font-bold border-2 border-black ${i % 3 === 1 ? 'bg-[var(--accent-2)]' : i % 3 === 2 ? 'bg-black text-[color:var(--paper)]' : 'bg-[var(--accent)]'}`}>
                {w}
              </motion.li>
            ))}
          </ul>
          <p className="mt-10 text-lg max-w-[50ch] border-s-4 border-black ps-4">{ABOUT.nameNote}</p>
        </div>
      )
    case 'open-call':
      return (
        <div>
          <OpenCallHeadline id="panel-title" lead="text-4xl md:text-5xl font-light" punch="text-[clamp(3.6rem,9vw,8rem)] font-black leading-[0.95]" />
          <p className="mt-3 text-3xl"><FestivalYear /></p>
          <div className="mt-8 space-y-5 text-xl md:text-2xl leading-relaxed max-w-[44ch]">{OPEN_CALL.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
          <H2>תחומים</H2>
          <ul className="grid grid-cols-2 lg:grid-cols-3 border-t-2 border-s-2 border-black">
            {OPEN_CALL.disciplines.map((d, i) => (
              <motion.li key={d} whileHover={{ backgroundColor: '#0a0a0a', color: '#fee801' }} className="border-b-2 border-e-2 border-black p-4 min-h-28 flex flex-col justify-between">
                <span className="text-sm tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-2xl md:text-3xl font-bold leading-tight">{d}</span>
              </motion.li>
            ))}
          </ul>
          <H2>מי יכול.ה להגיש?</H2>
          <p className="text-xl md:text-2xl max-w-[44ch]">{OPEN_CALL.who}</p>
          <H2>מה אפשר להגיש?</H2>
          <div className="grid sm:grid-cols-2 gap-3">
            {OPEN_CALL.stages.map((s, i) => (
              <div key={s.id} className="border-2 border-black p-5 bg-[var(--accent)]" style={{ transform: `rotate(${[-1, 0.8, -0.5, 1][i]}deg)` }}>
                <p className="text-2xl font-bold">{s.label}</p>
                <p className="text-lg">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-2xl font-bold bg-black text-[color:var(--paper)] inline-block px-3 py-1">{OPEN_CALL.stagesNote}</p>
          <H2>המרחבים</H2>
          <p className="text-xl md:text-2xl max-w-[44ch]">{OPEN_CALL.spaces}</p>
          <H2>{OPEN_CALL.criteriaIntro.replace(':', '')}</H2>
          <ol className="space-y-3">
            {OPEN_CALL.criteria.map((c, i) => <li key={c} className="flex gap-4 text-xl md:text-2xl"><span className="font-black tabular-nums text-[color:var(--accent-2)] [-webkit-text-stroke:1px_black]">{i + 1}</span>{c}</li>)}
          </ol>
          <button type="button" onClick={() => go('apply')} className="mt-12 min-h-14 px-8 bg-black text-[color:var(--paper)] text-2xl font-bold">להגשת הצעה ←</button>
        </div>
      )
    case 'spaces':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-none">מרחבי הפסטיבל</PanelTitle>
          <p className="mt-4 text-xl md:text-2xl max-w-[44ch]">{OPEN_CALL.spaces}</p>
          <div className="mt-10 space-y-16">
            {SPACES.map((s, si) => (
              <article key={s.id} aria-labelledby={`sp-${s.id}`}>
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-6xl font-black tabular-nums">0{si + 1}</span>
                  <div>
                    <h2 id={`sp-${s.id}`} className="text-3xl md:text-4xl font-bold">{s.name}</h2>
                    <p className="text-xl">{s.desc}</p>
                  </div>
                </div>
                <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
                  {s.photos.map((p, i) => (
                    <motion.button key={p.src} type="button" whileHover={{ y: -6 }} onClick={() => setBox({ s: si, i })} className={`snap-start shrink-0 border-2 border-black bg-black ${i === 0 ? 'w-[82%] md:w-[60%]' : 'w-[60%] md:w-[34%]'}`} aria-label={`הגדלה: ${p.alt}`}>
                      <img src={img(p)} alt="" loading="lazy" className="block w-full aspect-[4/3] object-cover" />
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm mt-1 opacity-70">{s.photos.length} צילומים · גללו הצידה או לחצו להגדלה</p>
              </article>
            ))}
          </div>
          <Lightbox photos={box ? SPACES[box.s].photos : []} index={box?.i ?? null} onIndex={(i) => setBox((b) => b && { ...b, i })} onClose={() => setBox(null)} title={box ? SPACES[box.s].name : ''} />
        </div>
      )
    case 'apply':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-none">הגשת הצעה</PanelTitle>
          <p className="mt-3 mb-10 text-xl md:text-2xl max-w-[44ch]">{OPEN_CALL.stagesNote} ארבעה שלבים קצרים, ואפשר לחזור אחורה בכל רגע בלי לאבד את מה שכתבתם.</p>
          <ApplicationForm />
        </div>
      )
    case 'support':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-[0.95]">{SUPPORT.title}</PanelTitle>
          <div className="mt-8 space-y-4 text-xl md:text-2xl leading-relaxed max-w-[42ch]">{SUPPORT.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
          <p className="mt-6 text-2xl md:text-3xl font-bold">{SUPPORT.closing}</p>
          <div className="mt-10 border-2 border-black bg-[var(--accent)] p-6 md:p-8"><Donation /></div>
        </div>
      )
    case 'details':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-none">פרטים</PanelTitle>
          <InfoList className="mt-8 border-t-2 border-black" row="border-b-2 border-black py-4" />
          <div className="mt-12 p-6 md:p-8 bg-black text-[color:var(--paper)]">
            <p className="text-3xl md:text-4xl font-bold nikud">{FINAL_CTA.text}</p>
            <button type="button" onClick={() => go('apply')} className="mt-5 min-h-14 px-8 bg-[var(--paper)] text-black text-2xl font-bold">{FINAL_CTA.button} ←</button>
          </div>
          <div className="mt-12"><PrivacyNote /></div>
        </div>
      )
  }
}
