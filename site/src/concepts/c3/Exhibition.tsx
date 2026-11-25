import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { ABOUT, FINAL_CTA, HOME, NAV, OPEN_CALL, SETTINGS, SPACES, SUPPORT, TAGLINE, img, type Photo, type SectionId } from '../../content'
import { SculptureMixer } from '../../sculpture/SculptureMixer'
import { ApplicationForm } from '../../shared/ApplicationForm'
import { FestivalYear, OpenCallHeadline, PanelTitle } from '../../shared/Blocks'
import { Donation } from '../../shared/Donation'
import { InfoList, Partners, PrivacyNote } from '../../shared/Info'
import { Lightbox } from '../../shared/Lightbox'
import { Logo } from '../../shared/Logo'
import { MobileNav } from '../../shared/MobileNav'
import { useSection } from '../../shared/useSection'

// Concept 3 — The Digital Exhibition. Every section is a room; the real venue photographs are the walls.
const vars = { '--ink': '#fefaee', '--paper': '#0a0a0a', '--accent': '#fee801', '--accent-2': '#e13d96', '--line': '#fefaee', '--field': '#161616', '--radius': '0px', '--focus': '#fee801' } as React.CSSProperties
const P = (s: number, i: number) => SPACES[s].photos[i]
const ROOM_PHOTO: Record<SectionId, Photo> = { home: P(1, 2), about: P(1, 5), 'open-call': P(1, 0), spaces: P(0, 0), apply: P(0, 2), support: P(2, 0), details: P(2, 1) }

export default function Exhibition() {
  const { active, go } = useSection(3)
  const idx = NAV.findIndex((n) => n.id === active)
  return (
    <div style={vars} className="min-h-dvh bg-[var(--paper)] text-[color:var(--ink)]">
      <a href="#panel-title" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[200] bg-[var(--accent)] text-black px-4 py-2">דילוג לתוכן</a>
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי"><Logo invert className="w-40" /></button>
        <span className="text-sm text-[color:var(--accent)] tabular-nums">חדר {String(idx + 1).padStart(2, '0')}/07</span>
      </div>
      <MobileNav active={active} onGo={go} bar="bg-[#0a0a0a]/95 backdrop-blur border-y border-white/20" sheet="bg-[#0a0a0a]" chip={(a) => `px-4 py-2.5 text-[17px] leading-none border ${a ? 'bg-[var(--accent)] text-black border-[color:var(--accent)]' : 'border-white/30'}`} />

      <div className="md:grid md:grid-cols-[17rem_1fr]">
        {/* floor plan rail */}
        <aside className="hidden md:flex sticky top-0 h-dvh flex-col justify-between border-e border-white/15 p-6">
          <button type="button" onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי"><Logo invert className="w-full" /></button>
          <nav aria-label="ניווט ראשי - מפת החדרים">
            <p className="text-xs text-[color:var(--accent)] mb-3 tracking-widest">מפת התערוכה</p>
            <FloorPlan active={active} go={go} />
            <ol className="mt-5 space-y-0.5">
              {NAV.map((n, i) => (
                <li key={n.id}>
                  <button type="button" aria-current={active === n.id ? 'page' : undefined} onClick={() => go(n.id)} className={`w-full flex items-baseline gap-3 py-1.5 text-start transition-colors ${active === n.id ? 'text-[color:var(--accent)]' : 'text-white/60 hover:text-white'}`}>
                    <span className="text-xs tabular-nums w-6">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-xl">{n.label}</span>
                    {active === n.id && <motion.span layoutId="c3-here" className="ms-auto text-xs">אתם כאן</motion.span>}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <p className="text-sm text-white/60">{SETTINGS.venue}</p>
        </aside>

        <main className="relative min-w-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={active}
              aria-labelledby="panel-title"
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(14px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } }}
              exit={{ opacity: 0, scale: 1.06, filter: 'blur(10px)', transition: { duration: 0.35, ease: 'easeIn' } }}
              className="origin-center"
            >
              <Room id={active} go={go} n={idx + 1} />
            </motion.section>
          </AnimatePresence>
          <footer className="border-t border-white/15 px-6 md:px-14 py-10 flex flex-wrap items-center justify-between gap-6">
            <div><Logo invert className="w-52" /><p className="mt-2 text-white/70">{TAGLINE}</p></div>
            <Partners invert />
            <a className="text-lg underline underline-offset-4" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" dir="ltr">@{SETTINGS.instagram}</a>
          </footer>
        </main>
      </div>
    </div>
  )
}

// seven rooms laid out like a plan; the active one lights up
function FloorPlan({ active, go }: { active: SectionId; go: (s: SectionId) => void }) {
  const cells: [SectionId, string][] = [['home', 'col-span-2 row-span-2'], ['about', ''], ['open-call', ''], ['spaces', 'col-span-2'], ['apply', 'col-span-1 row-span-2'], ['support', ''], ['details', '']]
  return (
    <div className="grid grid-cols-3 grid-rows-4 gap-1 h-36" aria-hidden>
      {cells.map(([id, cls], i) => (
        <button key={id} tabIndex={-1} type="button" onClick={() => go(id)} className={`relative border ${active === id ? 'border-[color:var(--accent)]' : 'border-white/25 hover:border-white/60'} ${cls}`}>
          {active === id && <motion.span layoutId="c3-plan" className="absolute inset-0 bg-[var(--accent)]" transition={{ type: 'spring', stiffness: 200, damping: 26 }} />}
          <span className={`relative text-[10px] tabular-nums ${active === id ? 'text-black' : 'text-white/50'}`}>{String(i + 1).padStart(2, '0')}</span>
        </button>
      ))}
    </div>
  )
}

// the room's wall: a real photograph, slowly drifting, darkened for legibility
function Wall({ photo, children, tall = true }: { photo: Photo; children: ReactNode; tall?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  return (
    <div ref={ref} className={`relative ${tall ? 'min-h-[88dvh]' : 'min-h-[60dvh]'} flex items-end overflow-hidden`}>
      <motion.img src={img(photo, 2000)} alt={photo.alt} style={{ y }} initial={{ scale: 1.15 }} animate={{ scale: 1.04 }} transition={{ duration: 6, ease: 'easeOut' }} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
      <div className="relative w-full px-6 md:px-14 pb-12 md:pb-16 pt-32">{children}</div>
    </div>
  )
}

const Label = ({ n, title }: { n: number; title: string }) => (
  <p className="inline-flex items-center gap-3 text-sm tracking-widest text-[color:var(--accent)] mb-4">
    <span className="tabular-nums">חדר {String(n).padStart(2, '0')}</span><span className="w-10 h-px bg-[var(--accent)]" /><span>{title}</span>
  </p>
)
const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`px-6 md:px-14 py-14 md:py-20 ${className}`}>{children}</div>

// the sculpture on a plinth, lit by a spotlight that follows the pointer
function Pedestal() {
  const mx = useMotionValue(50)
  const my = useMotionValue(30)
  const sx = useSpring(mx, { stiffness: 60, damping: 18 })
  const sy = useSpring(my, { stiffness: 60, damping: 18 })
  const bg = useMotionTemplate`radial-gradient(circle at ${sx}% ${sy}%, rgba(254,250,238,.20), rgba(254,250,238,.05) 28%, transparent 55%)`
  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set(((e.clientX - r.left) / r.width) * 100)
        my.set(((e.clientY - r.top) / r.height) * 100)
      }}
    >
      <motion.div aria-hidden className="absolute inset-0" style={{ background: bg }} />
      <SculptureMixer start="pink" aspect={0.9} className="relative w-full max-w-[520px] mx-auto" controls={({ shuffle, name }) => (
        <div className="relative">
          <div aria-hidden className="mx-auto w-[70%] h-6 bg-gradient-to-b from-white/25 to-white/5 [clip-path:polygon(6%_0,94%_0,100%_100%,0_100%)]" />
          <div aria-hidden className="mx-auto w-[70%] h-28 bg-gradient-to-b from-white/12 to-transparent" />
          <div className="absolute inset-x-0 top-8 text-center">
            <p className="text-sm text-white/70">{name}</p>
            <button type="button" onClick={shuffle} className="mt-2 min-h-11 px-5 border border-[color:var(--accent)] text-[color:var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-colors">ערבבו את הפסל</button>
          </div>
        </div>
      )} />
    </div>
  )
}

function Room({ id, go, n }: { id: SectionId; go: (s: SectionId) => void; n: number }) {
  const [box, setBox] = useState<{ s: number; i: number } | null>(null)
  const title = NAV.find((x) => x.id === id)!.label
  switch (id) {
    case 'home':
      return (
        <>
          <Wall photo={ROOM_PHOTO.home}>
            <Label n={n} title="הכניסה" />
            <OpenCallHeadline id="panel-title" lead="text-3xl md:text-5xl font-light" punch="text-[clamp(4rem,10vw,10rem)] font-black leading-[0.95]" />
            <p className="mt-4 text-3xl md:text-5xl"><FestivalYear /></p>
            <p className="mt-2 text-xl md:text-2xl text-white/85">{TAGLINE}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => go('apply')} className="min-h-14 px-8 bg-[var(--accent)] text-black text-2xl font-bold hover:bg-white transition-colors">{HOME.ctaPrimary} ←</button>
              <button type="button" onClick={() => go('about')} className="min-h-14 px-6 border border-white/60 text-2xl hover:bg-white/10">{HOME.ctaSecondary}</button>
            </div>
          </Wall>
          <Body className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 text-xl md:text-2xl leading-relaxed">
              <p>{HOME.invite}</p>
              <p className="text-white/80">{HOME.about}</p>
              <p className="text-white/80">{HOME.fields}</p>
              <p className="font-bold text-[color:var(--accent)]">{HOME.closing}</p>
              <dl className="grid grid-cols-2 gap-4 pt-4 text-base">
                <div className="border-t border-white/30 pt-2"><dt className="text-white/60">תאריך הפסטיבל</dt><dd className="text-xl">{SETTINGS.festivalDate}</dd></div>
                <div className="border-t border-white/30 pt-2"><dt className="text-white/60">מועד אחרון להגשה</dt><dd className="text-xl">{SETTINGS.deadline}</dd></div>
              </dl>
            </div>
            <Pedestal />
          </Body>
        </>
      )
    case 'about':
      return (
        <>
          <Wall photo={ROOM_PHOTO.about}>
            <Label n={n} title="טקסט קיר" />
            <PanelTitle className="text-[clamp(4.5rem,13vw,13rem)] font-black leading-none">{ABOUT.title}</PanelTitle>
          </Wall>
          <Body className="grid md:grid-cols-[1.4fr_1fr] gap-12">
            <div className="space-y-6 text-2xl md:text-3xl leading-snug">
              {ABOUT.paragraphs.map((p, i) => (
                <motion.p key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.7 }}>{p}</motion.p>
              ))}
            </div>
            <div>
              <div className="border border-white/30 p-5 text-base text-white/80"><p className="text-xs text-[color:var(--accent)] mb-2 tracking-widest">על השם</p>{ABOUT.nameNote}</div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-1" aria-label="מילים מרכזיות">
                {ABOUT.words.map((w, i) => (
                  <motion.li key={w} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }} className={`text-5xl font-black ${i % 2 ? 'text-[color:var(--accent)]' : 'text-white/90'}`}>{w}</motion.li>
                ))}
              </ul>
            </div>
          </Body>
        </>
      )
    case 'open-call':
      return (
        <>
          <Wall photo={ROOM_PHOTO['open-call']}>
            <Label n={n} title={title} />
            <OpenCallHeadline id="panel-title" lead="text-3xl md:text-5xl font-light" punch="text-[clamp(3.6rem,9vw,9rem)] font-black leading-[0.95]" />
            <p className="mt-3 text-3xl md:text-4xl"><FestivalYear /></p>
          </Wall>
          <Body>
            <div className="grid md:grid-cols-2 gap-10 text-xl md:text-2xl leading-relaxed">
              {OPEN_CALL.paragraphs.map((p, i) => <p key={p} className={i === 0 ? 'md:col-span-2 text-2xl md:text-4xl leading-snug' : 'text-white/85'}>{p}</p>)}
            </div>
            <h2 className="mt-16 mb-6 text-sm tracking-widest text-[color:var(--accent)]">התחומים</h2>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/20">
              {OPEN_CALL.disciplines.map((d) => (
                <li key={d} className="bg-[var(--paper)] p-5 md:p-7 text-2xl md:text-3xl hover:bg-[var(--accent)] hover:text-black transition-colors duration-300">{d}</li>
              ))}
            </ul>
            <div className="mt-16 grid md:grid-cols-2 gap-12">
              <section aria-labelledby="c3-st">
                <h2 id="c3-st" className="text-3xl font-bold mb-5">מה אפשר להגיש?</h2>
                {OPEN_CALL.stages.map((s) => <div key={s.id} className="border-t border-white/25 py-3"><p className="text-2xl">{s.label}</p><p className="text-lg text-white/70">{s.desc}</p></div>)}
                <p className="mt-4 text-xl text-[color:var(--accent)]">{OPEN_CALL.stagesNote}</p>
              </section>
              <section aria-labelledby="c3-cr">
                <h2 id="c3-cr" className="text-3xl font-bold mb-5">{OPEN_CALL.criteriaIntro.replace(':', '')}</h2>
                <ol className="space-y-3 text-xl">{OPEN_CALL.criteria.map((c, i) => <li key={c} className="flex gap-4"><span className="text-[color:var(--accent)] tabular-nums">{String(i + 1).padStart(2, '0')}</span>{c}</li>)}</ol>
                <p className="mt-8 text-lg text-white/80">{OPEN_CALL.who}</p>
                <p className="mt-4 text-lg text-white/80">{OPEN_CALL.spaces}</p>
                <button type="button" onClick={() => go('apply')} className="mt-8 min-h-14 px-8 bg-[var(--accent)] text-black text-2xl font-bold">להגשת הצעה ←</button>
              </section>
            </div>
          </Body>
        </>
      )
    case 'spaces':
      return (
        <>
          <Body className="pb-4">
            <Label n={n} title={title} />
            <PanelTitle className="text-[clamp(3.5rem,8vw,8rem)] font-black leading-none">{title}</PanelTitle>
            <p className="mt-5 text-xl md:text-2xl max-w-[50ch] text-white/85">{OPEN_CALL.spaces}</p>
          </Body>
          {SPACES.map((s, si) => (
            <section key={s.id} aria-labelledby={`c3-${s.id}`} className="mb-6">
              <Wall photo={s.photos[0]} tall={false}>
                <p className="text-sm tracking-widest text-[color:var(--accent)]">אגף {si + 1}</p>
                <h2 id={`c3-${s.id}`} className="text-4xl md:text-6xl font-black">{s.name}</h2>
                <p className="mt-2 text-xl md:text-2xl text-white/90 max-w-[40ch]">{s.desc}</p>
              </Wall>
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 md:px-14 py-3">
                {s.photos.map((p, i) => (
                  <button key={p.src} type="button" onClick={() => setBox({ s: si, i })} className="shrink-0 w-44 md:w-56 group relative overflow-hidden" aria-label={`הגדלה: ${p.alt}`}>
                    <img src={img(p)} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />
                  </button>
                ))}
              </div>
            </section>
          ))}
          <Lightbox photos={box ? SPACES[box.s].photos : []} index={box?.i ?? null} onIndex={(i) => setBox((b) => b && { ...b, i })} onClose={() => setBox(null)} title={box ? SPACES[box.s].name : ''} />
        </>
      )
    case 'apply':
      return (
        <>
          <Wall photo={ROOM_PHOTO.apply} tall={false}>
            <Label n={n} title="סטודיו" />
            <PanelTitle className="text-[clamp(3.5rem,9vw,9rem)] font-black leading-none">{title}</PanelTitle>
            <p className="mt-3 text-xl md:text-2xl max-w-[44ch]">{OPEN_CALL.stagesNote}</p>
          </Wall>
          <Body className="max-w-4xl"><ApplicationForm /></Body>
        </>
      )
    case 'support':
      return (
        <>
          <Wall photo={ROOM_PHOTO.support}>
            <Label n={n} title={title} />
            <PanelTitle className="text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.95]">{SUPPORT.title}</PanelTitle>
          </Wall>
          <Body className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4 text-xl md:text-2xl leading-relaxed text-white/85">{SUPPORT.paragraphs.map((p) => <p key={p}>{p}</p>)}<p className="text-[color:var(--accent)] font-bold">{SUPPORT.closing}</p></div>
            <div className="border border-white/25 p-6 md:p-8"><Donation chip={(a) => `min-h-14 px-5 text-2xl border ${a ? 'bg-[var(--accent)] text-black border-[color:var(--accent)]' : 'border-white/40'}`} /></div>
          </Body>
        </>
      )
    case 'details':
      return (
        <>
          <Wall photo={ROOM_PHOTO.details} tall={false}>
            <Label n={n} title="היציאה" />
            <PanelTitle className="text-[clamp(3.5rem,9vw,9rem)] font-black leading-none">{title}</PanelTitle>
          </Wall>
          <Body className="grid md:grid-cols-[1.3fr_1fr] gap-12">
            <InfoList className="border-t border-white/30" row="border-b border-white/20 py-4" />
            <div className="space-y-8">
              <div className="bg-[var(--accent)] text-black p-6">
                <p className="text-3xl font-bold nikud">{FINAL_CTA.text}</p>
                <button type="button" onClick={() => go('apply')} className="mt-4 min-h-12 px-6 bg-black text-[color:var(--accent)] text-xl font-bold">{FINAL_CTA.button} ←</button>
              </div>
              <PrivacyNote />
            </div>
          </Body>
        </>
      )
  }
}
