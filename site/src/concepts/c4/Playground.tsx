import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { ABOUT, FINAL_CTA, HOME, NAV, OPEN_CALL, OPEN_CALL_LEAD, OPEN_CALL_PUNCH, SETTINGS, SPACES, SUPPORT, TAGLINE, asset, img, type SectionId } from '../../content'
import { SculptureMixer } from '../../sculpture/SculptureMixer'
import { ApplicationForm } from '../../shared/ApplicationForm'
import { FestivalYear, OpenCallHeadline, PanelTitle } from '../../shared/Blocks'
import { Donation } from '../../shared/Donation'
import { InfoList, Partners, PrivacyNote } from '../../shared/Info'
import { Lightbox } from '../../shared/Lightbox'
import { Logo } from '../../shared/Logo'
import { MobileNav } from '../../shared/MobileNav'
import { useSection } from '../../shared/useSection'

// Concept 4 — The Surreal Playground. Magenta, tilted tags, letters that wobble, parts you can pull and let go.
const vars = { '--ink': '#0a0a0a', '--paper': '#e13d96', '--accent': '#fee801', '--accent-2': '#0a0a0a', '--line': '#0a0a0a', '--field': '#fefaee', '--radius': '14px', '--focus': '#fee801' } as React.CSSProperties
const TILT = [-4, 3, -2, 5, -3, 2, -5]
const BOUNCY = { type: 'spring', stiffness: 260, damping: 14 } as const

export default function Playground() {
  const { active, go } = useSection(4)
  return (
    <div style={vars} className="min-h-dvh bg-[var(--paper)] text-[color:var(--ink)]">
      <a href="#panel-title" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[200] bg-black text-white px-4 py-2">דילוג לתוכן</a>
      <header className="hidden md:flex sticky top-0 z-40 items-center gap-6 px-8 py-4 bg-[var(--paper)]/95 backdrop-blur">
        <motion.button type="button" whileHover={{ rotate: -6, scale: 1.05 }} transition={BOUNCY} onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי" className="shrink-0"><Logo className="w-52" /></motion.button>
        <nav aria-label="ניווט ראשי" className="flex-1">
          <ul className="flex flex-wrap gap-2.5 justify-end">
            {NAV.map((n, i) => (
              <li key={n.id}>
                <motion.button
                  type="button"
                  aria-current={active === n.id ? 'page' : undefined}
                  onClick={() => go(n.id)}
                  initial={false}
                  animate={{ rotate: active === n.id ? 0 : TILT[i], y: active === n.id ? -3 : 0, scale: active === n.id ? 1.08 : 1 }}
                  whileHover={{ rotate: 0, scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  transition={BOUNCY}
                  className={`min-h-11 px-4 py-2 rounded-full border-2 border-black text-lg xl:text-xl font-bold shadow-[3px_3px_0_#0a0a0a] ${active === n.id ? 'bg-[var(--accent)]' : 'bg-[#fefaee]'}`}
                >
                  {n.label}
                </motion.button>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי"><Logo className="w-40" /></button>
        <Stamp size={64} />
      </div>
      <MobileNav active={active} onGo={go} bar="bg-[var(--paper)] border-y-2 border-black" sheet="bg-[#fefaee]" chip={(a) => `px-4 py-2 rounded-full border-2 border-black text-[17px] font-bold shadow-[2px_2px_0_#0a0a0a] ${a ? 'bg-[var(--accent)]' : 'bg-[#fefaee]'}`} />

      <main className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={active}
            aria-labelledby="panel-title"
            initial={{ opacity: 0, y: 60, rotate: -2.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 120, damping: 15 } }}
            exit={{ opacity: 0, y: -30, rotate: 2, transition: { duration: 0.2 } }}
            className="origin-top px-5 md:px-10 pb-16 pt-6 md:pt-10"
          >
            <Panel id={active} go={go} />
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="bg-black text-[#fefaee] px-5 md:px-10 py-10 flex flex-wrap items-center justify-between gap-6 rounded-t-[2rem]">
        <div><Logo invert className="w-52" /><p className="mt-2 text-xl">{TAGLINE}</p></div>
        <Partners invert />
        <a className="text-xl font-bold text-[color:var(--accent)]" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" dir="ltr">@{SETTINGS.instagram}</a>
      </footer>
    </div>
  )
}

// letters that jump when the pointer passes over them (split by grapheme so niqqud stays on its letter)
const graphemes = (s: string) => Array.from(new Intl.Segmenter('he', { granularity: 'grapheme' }).segment(s), (g) => g.segment)
function Wobbly({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {graphemes(word).map((ch, i) => (
            <motion.span key={i} className="inline-block" whileHover={{ y: -18, rotate: (i + w) % 2 ? 8 : -8, color: '#fee801' }} transition={BOUNCY}>
              {ch}
            </motion.span>
          ))}
          {' '}
        </span>
      ))}
    </span>
  )
}

// rotating round stamp
function Stamp({ size = 140 }: { size?: number }) {
  const text = `${OPEN_CALL_LEAD} ${OPEN_CALL_PUNCH} · הגשות פתוחות · `
  return (
    <motion.svg viewBox="0 0 200 200" width={size} height={size} aria-hidden animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
      <circle cx="100" cy="100" r="98" fill="#fee801" stroke="#0a0a0a" strokeWidth="3" />
      {/* letters placed one by one around the ring, running counter-clockwise as Hebrew reads (textPath mangles RTL) */}
      <g fontSize="19" fontWeight="700" fill="#0a0a0a" fontFamily="Frank Ruhl Libre, serif" textAnchor="middle">
        {graphemes(text).map((g, i, all) => (
          <text key={i} x="100" y="30" transform={`rotate(${(-i * 360) / all.length} 100 100)`}>{g}</text>
        ))}
      </g>
      <image href={asset('brand/logo-mark.svg')} x="62" y="70" width="76" height="60" />
    </motion.svg>
  )
}

function Polaroids({ si, onOpen }: { si: number; onOpen: (i: number) => void }) {
  const area = useRef<HTMLDivElement>(null)
  const photos = SPACES[si].photos.slice(0, 4)
  return (
    <div ref={area} className="relative h-[360px] md:h-[420px]">
      {photos.map((p, i) => (
        <motion.figure
          key={p.src}
          drag
          dragConstraints={area}
          dragElastic={0.2}
          whileDrag={{ scale: 1.06, zIndex: 20, rotate: 0 }}
          initial={{ opacity: 0, y: 40, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: TILT[(i + si) % 7] * 1.4 }}
          transition={{ ...BOUNCY, delay: i * 0.08 }}
          className="absolute bg-[#fefaee] p-2.5 pb-3 border-2 border-black shadow-[5px_5px_0_#0a0a0a] w-[58%] md:w-[44%] cursor-grab active:cursor-grabbing"
          style={{ top: `${[4, 22, 8, 30][i]}%`, left: `${[2, 34, 50, 16][i]}%`, zIndex: i }}
        >
          <img src={img(p)} alt={p.alt} loading="lazy" draggable={false} className="w-full aspect-[4/3] object-cover pointer-events-none" />
          <figcaption className="flex items-center justify-between gap-2 mt-2">
            <span className="text-sm leading-tight line-clamp-1">{p.alt.split(':')[0]}</span>
            <button type="button" onClick={() => onOpen(i)} className="shrink-0 text-sm font-bold underline min-h-8" aria-label={`הגדלה: ${p.alt}`}>הגדלה</button>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  )
}

const Card = ({ children, className = '', tilt = 0 }: { children: React.ReactNode; className?: string; tilt?: number }) => (
  <motion.div initial={{ rotate: tilt * 2, opacity: 0, y: 20 }} animate={{ rotate: tilt, opacity: 1, y: 0 }} transition={BOUNCY} className={`${className.includes('bg-') ? '' : 'bg-[#fefaee]'} border-2 border-black rounded-[14px] shadow-[6px_6px_0_#0a0a0a] ${className}`}>{children}</motion.div>
)
const Btn = ({ onClick, children, alt = false }: { onClick: () => void; children: React.ReactNode; alt?: boolean }) => (
  <motion.button type="button" onClick={onClick} whileHover={{ rotate: -3, scale: 1.05 }} whileTap={{ scale: 0.92 }} transition={BOUNCY} className={`min-h-14 px-7 rounded-full border-2 border-black text-2xl font-bold shadow-[4px_4px_0_#0a0a0a] ${alt ? 'bg-[#fefaee]' : 'bg-[var(--accent)]'}`}>{children}</motion.button>
)

function Panel({ id, go }: { id: SectionId; go: (s: SectionId) => void }) {
  const [box, setBox] = useState<{ s: number; i: number } | null>(null)
  switch (id) {
    case 'home':
      return (
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-center">
          <div className="relative">
            <h1 id="panel-title" tabIndex={-1} className="nikud outline-none">
              <span className="block text-4xl md:text-6xl font-light"><Wobbly text={OPEN_CALL_LEAD} /></span>
              <span className="block text-[clamp(4rem,10.5vw,12rem)] font-black leading-[0.9] -rotate-2 origin-right"><Wobbly text={OPEN_CALL_PUNCH} /></span>
            </h1>
            <p className="mt-6 text-4xl md:text-6xl font-black inline-block bg-[var(--accent)] border-2 border-black px-3 rotate-1"><FestivalYear /></p>
            <p className="mt-4 text-2xl md:text-3xl font-bold">{TAGLINE}</p>
            <Card className="mt-8 p-5 md:p-6 text-xl md:text-2xl leading-relaxed space-y-3" tilt={-1}>
              <p>{HOME.invite}</p>
              <p>{HOME.about}</p>
              <p>{HOME.fields}</p>
              <p className="font-black">{HOME.closing}</p>
            </Card>
            <div className="mt-8 flex flex-wrap gap-4">
              <Btn onClick={() => go('apply')}>{HOME.ctaPrimary} ←</Btn>
              <Btn alt onClick={() => go('about')}>{HOME.ctaSecondary}</Btn>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-2 left-0 z-10 hidden md:block"><Stamp /></div>
            <SculptureMixer
              start="yellow"
              draggable
              aspect={0.82}
              className="max-w-[560px] mx-auto"
              controls={({ shuffle, reset, name }) => (
                <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
                  <Btn onClick={shuffle}>ערבבו את הפסל ↻</Btn>
                  <Btn alt onClick={reset}>מההתחלה</Btn>
                  <p className="basis-full text-center text-base font-bold" aria-hidden>{name} · משכו חלק ושחררו, או לחצו להחלפה</p>
                </div>
              )}
            />
          </div>
          <div className="lg:col-span-2 flex flex-wrap gap-3 text-xl font-bold">
            {[['תאריך הפסטיבל', SETTINGS.festivalDate], ['מועד אחרון להגשה', SETTINGS.deadline], ['מיקום', SETTINGS.venue]].map(([k, v], i) => (
              <span key={k} className="bg-black text-[#fefaee] rounded-full px-5 py-2" style={{ rotate: `${TILT[i + 2]}deg` }}>{k}: <span className="text-[color:var(--accent)]">{v}</span></span>
            ))}
          </div>
        </div>
      )
    case 'about':
      return (
        <div>
          <PanelTitle className="text-[clamp(5rem,16vw,16rem)] font-black leading-[0.85]"><Wobbly text={ABOUT.title} /></PanelTitle>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {ABOUT.paragraphs.map((p, i) => <Card key={i} tilt={TILT[i]} className="p-6 text-xl md:text-2xl leading-relaxed">{p}</Card>)}
          </div>
          <ul className="mt-14 flex flex-wrap justify-center gap-4" aria-label="מילים מרכזיות">
            {ABOUT.words.map((w, i) => (
              <motion.li key={w} drag dragSnapToOrigin dragElastic={0.6} whileDrag={{ scale: 1.2 }} initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: TILT[i] * 2 }} transition={{ ...BOUNCY, delay: 0.3 + i * 0.09 }} className={`cursor-grab text-5xl md:text-7xl font-black px-6 py-3 rounded-full border-2 border-black shadow-[4px_4px_0_#0a0a0a] ${i % 2 ? 'bg-[var(--accent)]' : 'bg-[#fefaee]'}`}>
                {w}
              </motion.li>
            ))}
          </ul>
          <p className="mt-6 text-center text-base font-bold" aria-hidden>(אפשר למשוך את המילים)</p>
          <Card className="mt-10 p-5 text-lg max-w-2xl mx-auto" tilt={1}>{ABOUT.nameNote}</Card>
        </div>
      )
    case 'open-call':
      return (
        <div>
          <OpenCallHeadline id="panel-title" lead="text-4xl md:text-6xl font-light" punch="text-[clamp(4rem,11vw,11rem)] font-black leading-[0.9] -rotate-1 origin-right" />
          <p className="mt-4 text-4xl font-black"><FestivalYear /></p>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {OPEN_CALL.paragraphs.map((p, i) => <Card key={p} tilt={TILT[i + 1] / 2} className="p-6 text-xl leading-relaxed">{p}</Card>)}
          </div>
          <h2 className="mt-16 text-5xl md:text-7xl font-black">תחומים <span className="text-[color:var(--accent)] [-webkit-text-stroke:2px_black]">!</span></h2>
          <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {OPEN_CALL.disciplines.map((d, i) => (
              <motion.li key={d} whileHover={{ rotate: TILT[i % 7] * -2, scale: 1.06 }} transition={BOUNCY} className={`min-h-28 md:min-h-36 flex items-center justify-center text-center p-4 border-2 border-black rounded-[14px] shadow-[5px_5px_0_#0a0a0a] text-2xl md:text-3xl font-black ${['bg-[var(--accent)]', 'bg-[#fefaee]', 'bg-black text-[#fefaee]'][i % 3]} ${i === 0 ? 'md:col-span-2' : ''}`} style={{ rotate: `${TILT[i % 7] / 2}deg` }}>
                {d}
              </motion.li>
            ))}
          </ul>
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <Card className="p-6" tilt={-1}>
              <h2 className="text-3xl font-black mb-4">מה אפשר להגיש?</h2>
              {OPEN_CALL.stages.map((s) => <p key={s.id} className="text-xl mb-2"><span className="font-black">{s.label}</span> · {s.desc}</p>)}
              <p className="mt-4 text-2xl font-black bg-[var(--accent)] inline-block px-2">{OPEN_CALL.stagesNote}</p>
            </Card>
            <Card className="p-6" tilt={1}>
              <h2 className="text-3xl font-black mb-4">{OPEN_CALL.criteriaIntro.replace(':', '')}</h2>
              <ol className="space-y-2 text-xl list-decimal ps-6 marker:font-black">{OPEN_CALL.criteria.map((c) => <li key={c}>{c}</li>)}</ol>
              <p className="mt-5 text-lg">{OPEN_CALL.who}</p>
            </Card>
          </div>
          <p className="mt-10 text-xl md:text-2xl max-w-[50ch]">{OPEN_CALL.spaces}</p>
          <div className="mt-8"><Btn onClick={() => go('apply')}>להגשת הצעה ←</Btn></div>
        </div>
      )
    case 'spaces':
      return (
        <div>
          <PanelTitle className="text-[clamp(4rem,10vw,10rem)] font-black leading-[0.9]"><Wobbly text="מרחבי הפסטיבל" /></PanelTitle>
          <p className="mt-4 text-xl md:text-2xl max-w-[50ch]">{OPEN_CALL.spaces}</p>
          <div className="mt-12 space-y-16">
            {SPACES.map((s, si) => (
              <section key={s.id} aria-labelledby={`c4-${s.id}`} className="grid md:grid-cols-[1fr_1.4fr] gap-8 items-center">
                <Card tilt={TILT[si]} className="p-6">
                  <p className="text-sm font-bold">מרחב #{si + 1}</p>
                  <h2 id={`c4-${s.id}`} className="text-4xl font-black">{s.name}</h2>
                  <p className="mt-2 text-xl">{s.desc}</p>
                  <p className="mt-3 text-sm">אפשר לגרור את התמונות, או ללחוץ על "הגדלה"</p>
                </Card>
                <Polaroids si={si} onOpen={(i) => setBox({ s: si, i })} />
              </section>
            ))}
          </div>
          <Lightbox photos={box ? SPACES[box.s].photos : []} index={box?.i ?? null} onIndex={(i) => setBox((b) => b && { ...b, i })} onClose={() => setBox(null)} title={box ? SPACES[box.s].name : ''} />
        </div>
      )
    case 'apply':
      return (
        <div className="max-w-4xl mx-auto">
          <PanelTitle className="text-[clamp(3.5rem,9vw,8rem)] font-black leading-[0.9]"><Wobbly text="הגשת הצעה" /></PanelTitle>
          <p className="mt-3 mb-8 text-2xl font-bold">{OPEN_CALL.stagesNote}</p>
          {/* the form itself stays calm: no tilt, no wobble */}
          <div className="bg-[#fefaee] border-2 border-black rounded-[14px] shadow-[8px_8px_0_#0a0a0a] p-5 md:p-10" style={{ ['--paper' as string]: '#fefaee', ['--accent-2' as string]: '#c42a7d', ['--focus' as string]: '#e13d96' }}>
            <ApplicationForm />
          </div>
        </div>
      )
    case 'support':
      return (
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <PanelTitle className="text-[clamp(3.5rem,9vw,8rem)] font-black leading-[0.9]">{SUPPORT.title}</PanelTitle>
            <Card className="mt-8 p-6 text-xl md:text-2xl leading-relaxed space-y-3" tilt={-1}>{SUPPORT.paragraphs.map((p) => <p key={p}>{p}</p>)}<p className="font-black">{SUPPORT.closing}</p></Card>
          </div>
          <Card className="p-6 md:p-8" tilt={1.5}>
            <Donation chip={(a) => `size-24 md:size-28 rounded-full border-2 border-black text-2xl font-black shadow-[3px_3px_0_#0a0a0a] ${a ? 'bg-[var(--accent)] rotate-6' : 'bg-white'}`} />
          </Card>
        </div>
      )
    case 'details':
      return (
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10">
          <div>
            <PanelTitle className="text-[clamp(3.5rem,9vw,8rem)] font-black leading-[0.9]"><Wobbly text="פרטים" /></PanelTitle>
            <Card className="mt-8 px-6 py-2" tilt={-0.5}><InfoList /></Card>
          </div>
          <div className="space-y-8">
            <Card className="p-6 bg-[var(--accent)]" tilt={2}>
              <p className="text-3xl font-black nikud">{FINAL_CTA.text}</p>
              <div className="mt-4"><Btn alt onClick={() => go('apply')}>{FINAL_CTA.button} ←</Btn></div>
            </Card>
            <Card className="p-6" tilt={-1}><PrivacyNote /></Card>
          </div>
        </div>
      )
  }
}
