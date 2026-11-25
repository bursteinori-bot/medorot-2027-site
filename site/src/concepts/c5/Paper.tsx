import { AnimatePresence, motion } from 'motion/react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { ABOUT, FINAL_CTA, HOME, NAV, OPEN_CALL, SETTINGS, SPACES, SUPPORT, TAGLINE, img, type SectionId } from '../../content'
import { SculptureMixer } from '../../sculpture/SculptureMixer'
import { ApplicationForm } from '../../shared/ApplicationForm'
import { FestivalYear, OpenCallHeadline, PanelTitle } from '../../shared/Blocks'
import { Donation } from '../../shared/Donation'
import { InfoList, Partners, PrivacyNote } from '../../shared/Info'
import { Lightbox } from '../../shared/Lightbox'
import { Logo } from '../../shared/Logo'
import { MobileNav } from '../../shared/MobileNav'
import { useSection } from '../../shared/useSection'

// Concept 5 — Material, Paper and Generations. A folder of sheets: tabs, tape, stamps, and paper-cut sculptures.
const SHEET = '#fffcf3'
const vars = { '--ink': '#0a0a0a', '--paper': SHEET, '--accent': '#fee801', '--accent-2': '#e13d96', '--line': '#0a0a0a', '--field': '#ffffff', '--radius': '2px', '--focus': '#e13d96', '--grain': '0.22' } as CSSProperties
// white "cut-out" edge around each sculpture part, plus a soft paper shadow
const CUTOUT = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(3px 5px 4px rgba(60,40,10,.35))'
const TORN = 'polygon(0 1.2%, 4% 0, 9% 1%, 15% 0.2%, 22% 1.1%, 30% 0.1%, 37% 0.9%, 45% 0, 53% 1%, 60% 0.3%, 68% 1.2%, 75% 0.2%, 83% 1%, 90% 0, 96% 0.8%, 100% 0.2%, 100% 100%, 0 100%)'

export default function Paper() {
  const { active, go } = useSection(5)
  return (
    <div style={vars} className="grain min-h-dvh bg-[#e9e1cc] text-[color:var(--ink)]">
      <a href="#panel-title" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[200] bg-black text-white px-4 py-2">דילוג לתוכן</a>
      <header className="relative z-10 flex items-center justify-between px-5 md:px-12 pt-5 md:pt-8">
        <button type="button" onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי"><Logo className="w-40 md:w-60" /></button>
        <p className="hidden md:block text-lg">{TAGLINE}</p>
        <div className="hidden md:block"><Stamp /></div>
      </header>
      <MobileNav active={active} onGo={go} bar="bg-[#e9e1cc] border-b-2 border-black/70" sheet="bg-[#fffcf3]" chip={(a) => `px-4 pt-2.5 pb-2 text-[17px] leading-none rounded-t-md border-2 border-b-0 border-black/70 ${a ? 'bg-[#fffcf3] font-bold' : 'bg-[#d9cfb3]'}`} />

      <div className="relative z-10 px-3 md:px-12 pt-4 md:pt-8 pb-16">
        {/* folder tabs */}
        <nav aria-label="ניווט ראשי" className="hidden md:block sticky top-0 z-20 pt-3 bg-[#e9e1cc]">
          <ul className="flex items-end gap-1 ps-6">
            {NAV.map((n, i) => {
              const on = active === n.id
              return (
                <li key={n.id}>
                  <motion.button
                    type="button"
                    aria-current={on ? 'page' : undefined}
                    onClick={() => go(n.id)}
                    initial={false}
                    animate={{ y: on ? 0 : 6 }}
                    whileHover={{ y: on ? 0 : 1 }}
                    className={`relative whitespace-nowrap px-3 lg:px-5 pt-2.5 pb-3 text-base lg:text-lg xl:text-xl rounded-t-lg border-2 border-b-0 border-black/70 ${on ? 'font-bold z-10' : 'hover:brightness-105'}`}
                    style={{ background: on ? SHEET : ['#d9cfb3', '#e3d9be', '#d4c9aa', '#ddd3b7'][i % 4], marginBottom: on ? -2 : 0 }}
                  >
                    <span className="hidden xl:inline text-xs tabular-nums opacity-60 me-2">{String(i + 1).padStart(2, '0')}</span>
                    {n.label}
                  </motion.button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* the stack: older sheets peek out underneath */}
        <div className="relative">
          <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-3 rotate-[0.6deg] bg-[#f3ecd9] border-2 border-black/40 shadow-md" />
          <div aria-hidden className="absolute inset-0 -translate-x-1.5 translate-y-1.5 -rotate-[0.4deg] bg-[#f7f1e1] border-2 border-black/50" />
          <main className="relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={active}
                aria-labelledby="panel-title"
                initial={{ y: 70, rotate: 1.2, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 90, damping: 17 } }}
                exit={{ y: 30, rotate: -1, opacity: 0, transition: { duration: 0.22 } }}
                className="relative bg-[#fffcf3] border-2 border-black/70 shadow-[0_18px_40px_-18px_rgba(60,40,10,.5)] px-5 md:px-14 py-10 md:py-14 min-h-[70dvh]"
              >
                <Sheet id={active} go={go} />
              </motion.section>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <footer className="relative z-10 px-5 md:px-12 pb-10 flex flex-wrap items-center justify-between gap-6">
        <p className="text-lg"><FestivalYear /> · {SETTINGS.venue}</p>
        <Partners />
        <a className="text-lg underline underline-offset-4" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" dir="ltr">@{SETTINGS.instagram}</a>
      </footer>
    </div>
  )
}

function Tape({ className = '', rot = -6 }: { className?: string; rot?: number }) {
  return <motion.span aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.35, duration: 0.4 }} className={`absolute h-7 w-28 bg-[#fee801]/80 mix-blend-multiply shadow-sm z-10 origin-right ${className}`} style={{ rotate: `${rot}deg` }} />
}

function Stamp({ className = '' }: { className?: string }) {
  return (
    <motion.div aria-hidden initial={{ scale: 1.6, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 0.9, rotate: -12 }} transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 14 }} className={`size-28 rounded-full border-[5px] border-double border-[color:var(--accent-2)] text-[color:var(--accent-2)] grid place-items-center text-center leading-tight font-black ${className}`}>
      <span>קוֹל קוֹרֵא<br /><span className="text-2xl">2027</span><br />פָּתוּחַ</span>
    </motion.div>
  )
}

// a pasted-on paper slip with a torn top edge
function Slip({ children, className = '', rot = 0, color = '#fff' }: { children: ReactNode; className?: string; rot?: number; color?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, rotate: rot * 2 }} animate={{ opacity: 1, y: 0, rotate: rot }} transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.15 }} className={`relative p-5 md:p-6 shadow-[2px_4px_10px_rgba(60,40,10,.18)] ${className}`} style={{ background: color, clipPath: TORN }}>
      {children}
    </motion.div>
  )
}

function Sheet({ id, go }: { id: SectionId; go: (s: SectionId) => void }) {
  const [box, setBox] = useState<{ s: number; i: number } | null>(null)
  switch (id) {
    case 'home':
      return (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
          <div>
            <OpenCallHeadline id="panel-title" lead="text-4xl md:text-6xl font-light" punch="text-[clamp(4.2rem,11vw,11rem)] font-black leading-[0.92]" />
            <p className="mt-5 text-4xl md:text-6xl"><FestivalYear /></p>
            <p className="mt-2 text-2xl md:text-3xl">{TAGLINE}</p>
            <Slip className="mt-8 text-xl md:text-2xl leading-relaxed space-y-3" rot={-0.6}>
              <p>{HOME.invite}</p>
              <p>{HOME.about}</p>
              <p>{HOME.fields}</p>
              <p className="font-bold">{HOME.closing}</p>
            </Slip>
            <div className="mt-8 flex flex-wrap gap-4">
              <button type="button" onClick={() => go('apply')} className="min-h-14 px-8 bg-black text-[#fffcf3] text-2xl font-bold shadow-[4px_4px_0_#e13d96] hover:-translate-y-0.5 transition-transform">{HOME.ctaPrimary} ←</button>
              <button type="button" onClick={() => go('about')} className="min-h-14 px-6 border-2 border-black text-2xl bg-[#fffcf3]">{HOME.ctaSecondary}</button>
            </div>
          </div>
          <div className="relative">
            <Tape className="-top-2 right-10" rot={8} />
            <Tape className="top-1/2 -left-6" rot={-70} />
            <div className="bg-[#efe7d2] p-4 md:p-6 border border-black/20 rotate-[1.2deg] shadow-[2px_6px_14px_rgba(60,40,10,.25)]">
              <SculptureMixer start="cream" aspect={0.85} filter={CUTOUT} controls={({ shuffle, name }) => (
                <div className="flex items-center justify-between gap-3 mt-3">
                  <p className="text-base">{name}</p>
                  <button type="button" onClick={shuffle} className="min-h-11 px-4 bg-[#fee801] border-2 border-black font-bold shadow-[2px_2px_0_#0a0a0a]">ערבבו את הפסל</button>
                </div>
              )} />
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 text-lg">
              <Slip rot={-1.5} color="#fff7c2"><dt className="text-sm">תאריך הפסטיבל</dt><dd className="text-xl">{SETTINGS.festivalDate}</dd></Slip>
              <Slip rot={1.2}><dt className="text-sm">מועד אחרון להגשה</dt><dd className="text-xl">{SETTINGS.deadline}</dd></Slip>
              <Slip rot={0.5} className="col-span-2"><dt className="text-sm">מיקום</dt><dd className="text-xl">{SETTINGS.venue}</dd></Slip>
            </dl>
          </div>
        </div>
      )
    case 'about':
      return (
        <div>
          <PanelTitle className="text-[clamp(4.5rem,13vw,13rem)] font-black leading-[0.9]">{ABOUT.title}</PanelTitle>
          {/* the name, split into its two layers: fires and generations */}
          <div className="relative mt-10 mb-12 select-none" aria-label={ABOUT.nameNote}>
            <p aria-hidden className="text-[clamp(5rem,17vw,17rem)] font-black leading-none text-black/10 nikud">מְדּוֹרוֹת</p>
            <motion.p aria-hidden initial={{ x: -60, opacity: 0, rotate: -3 }} animate={{ x: 0, opacity: 1, rotate: -2 }} transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 14 }} className="absolute top-[22%] left-[4%] md:left-[18%] bg-[#fee801] px-4 py-1 text-[clamp(3rem,9vw,8rem)] font-black leading-none shadow-md">
              דּוֹרוֹת
            </motion.p>
            <motion.p aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="absolute bottom-0 left-[4%] md:left-[18%] text-lg md:text-xl bg-white px-3 py-1 rotate-1 shadow">מדורות + דורות</motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ABOUT.paragraphs.map((p, i) => <Slip key={i} rot={[-1, 0.8, -0.4][i]} color={i === 1 ? '#fff7c2' : '#fff'} className="text-xl md:text-2xl leading-relaxed">{p}</Slip>)}
          </div>
          <p className="mt-10 text-xl max-w-[56ch]">{ABOUT.nameNote}</p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-4xl md:text-5xl font-black" aria-label="מילים מרכזיות">
            {ABOUT.words.map((w, i) => <li key={w} className={i % 2 ? 'text-[color:var(--accent-2)]' : ''}>{w}</li>)}
          </ul>
        </div>
      )
    case 'open-call':
      return (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <OpenCallHeadline id="panel-title" lead="text-4xl md:text-6xl font-light" punch="text-[clamp(3.8rem,10vw,10rem)] font-black leading-[0.92]" />
              <p className="mt-3 text-4xl"><FestivalYear /></p>
            </div>
            <Stamp />
          </div>
          <div className="mt-10 grid md:grid-cols-2 gap-8 text-xl md:text-2xl leading-relaxed">
            {OPEN_CALL.paragraphs.map((p, i) => <p key={p} className={i === 0 ? 'md:col-span-2 text-2xl md:text-3xl' : ''}>{p}</p>)}
          </div>
          <h2 className="mt-14 mb-5 text-4xl font-black">תחומים</h2>
          <ul className="flex flex-wrap gap-3">
            {OPEN_CALL.disciplines.map((d, i) => (
              <motion.li key={d} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="relative px-5 py-3 text-2xl md:text-3xl border-2 border-black bg-white shadow-[2px_3px_0_rgba(0,0,0,.8)]" style={{ rotate: `${[-1.5, 1, -0.5, 2, -2, 0.8, -1, 1.6, -0.6][i]}deg`, clipPath: TORN }}>
                {d}
              </motion.li>
            ))}
          </ul>
          <div className="mt-14 grid md:grid-cols-2 gap-8">
            <Slip rot={-0.8} color="#fff7c2">
              <h2 className="text-3xl font-black mb-4">מה אפשר להגיש?</h2>
              {OPEN_CALL.stages.map((s) => <p key={s.id} className="text-xl mb-2"><span className="font-bold">{s.label}</span> · {s.desc}</p>)}
              <p className="mt-3 text-xl font-bold">{OPEN_CALL.stagesNote}</p>
            </Slip>
            <Slip rot={0.6}>
              <h2 className="text-3xl font-black mb-4">{OPEN_CALL.criteriaIntro.replace(':', '')}</h2>
              <ol className="space-y-2 text-xl">{OPEN_CALL.criteria.map((c, i) => <li key={c} className="flex gap-3"><span className="text-[color:var(--accent-2)] font-black">{i + 1}.</span>{c}</li>)}</ol>
            </Slip>
          </div>
          <p className="mt-10 text-xl md:text-2xl max-w-[56ch]">{OPEN_CALL.who}</p>
          <p className="mt-4 text-xl md:text-2xl max-w-[56ch]">{OPEN_CALL.spaces}</p>
          <button type="button" onClick={() => go('apply')} className="mt-8 min-h-14 px-8 bg-black text-[#fffcf3] text-2xl font-bold shadow-[4px_4px_0_#e13d96]">להגשת הצעה ←</button>
        </div>
      )
    case 'spaces':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.6rem,9vw,9rem)] font-black leading-[0.92]">מרחבי הפסטיבל</PanelTitle>
          <p className="mt-4 text-xl md:text-2xl max-w-[56ch]">{OPEN_CALL.spaces}</p>
          {SPACES.map((s, si) => (
            <section key={s.id} aria-labelledby={`c5-${s.id}`} className="mt-16">
              <div className="flex flex-wrap items-baseline gap-4 border-b-2 border-black pb-2 mb-6">
                <h2 id={`c5-${s.id}`} className="text-4xl md:text-5xl font-black">{s.name}</h2>
                <p className="text-xl">{s.desc}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {s.photos.slice(0, 4).map((p, i) => (
                  <motion.figure key={p.src} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className={`relative bg-white p-2 pb-3 shadow-[2px_6px_12px_rgba(60,40,10,.25)] ${i === 0 ? 'col-span-2 row-span-2' : ''}`} style={{ rotate: `${[-1.4, 1.8, -0.8, 1.2][i]}deg` }}>
                    <Tape className="-top-3 left-1/2 -translate-x-1/2" rot={[-4, 6, -8, 3][i]} />
                    <button type="button" onClick={() => setBox({ s: si, i })} className="block w-full" aria-label={`הגדלה: ${p.alt}`}>
                      <img src={img(p, i === 0 ? 2000 : 960)} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover sepia-[.12]" />
                    </button>
                    <figcaption className="mt-2 text-sm md:text-base leading-snug">{p.alt}</figcaption>
                  </motion.figure>
                ))}
              </div>
              {s.photos.length > 4 && <button type="button" onClick={() => setBox({ s: si, i: 4 })} className="mt-5 underline underline-offset-4 text-lg">עוד {s.photos.length - 4} צילומים ←</button>}
            </section>
          ))}
          <Lightbox photos={box ? SPACES[box.s].photos : []} index={box?.i ?? null} onIndex={(i) => setBox((b) => b && { ...b, i })} onClose={() => setBox(null)} title={box ? SPACES[box.s].name : ''} />
        </div>
      )
    case 'apply':
      return (
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10">
          <div>
            <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-[0.92]">הגשת הצעה</PanelTitle>
            <Slip className="mt-6 text-xl" rot={-1} color="#fff7c2">{OPEN_CALL.stagesNote}</Slip>
            <p className="mt-6 text-lg">ארבעה שלבים. אפשר לחזור אחורה בכל רגע בלי לאבד את מה שכתבתם.</p>
          </div>
          <div className="bg-white border-2 border-black/70 p-5 md:p-8 shadow-[3px_5px_0_rgba(0,0,0,.15)]"><ApplicationForm /></div>
        </div>
      )
    case 'support':
      return (
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-[0.92]">{SUPPORT.title}</PanelTitle>
            <div className="mt-6 space-y-4 text-xl md:text-2xl leading-relaxed">{SUPPORT.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
            <p className="mt-5 text-2xl font-black inline-block bg-[#fee801] px-2 -rotate-1">{SUPPORT.closing}</p>
          </div>
          <div className="relative">
            <Tape className="-top-3 right-8" rot={6} />
            <Slip rot={0.8} className="p-7"><Donation chip={(a) => `min-h-14 px-5 text-2xl border-2 border-black ${a ? 'bg-[#fee801] font-black shadow-[2px_2px_0_#0a0a0a]' : 'bg-white'}`} /></Slip>
          </div>
        </div>
      )
    case 'details':
      return (
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10">
          <div>
            <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-[0.92]">פרטים</PanelTitle>
            <InfoList className="mt-6 border-t-2 border-black" row="border-b border-dashed border-black/60 py-4" />
          </div>
          <div className="space-y-8">
            <Slip rot={-1} color="#fff7c2"><p className="text-3xl font-black nikud">{FINAL_CTA.text}</p><button type="button" onClick={() => go('apply')} className="mt-4 min-h-12 px-6 bg-black text-[#fffcf3] text-xl font-bold">{FINAL_CTA.button} ←</button></Slip>
            <PrivacyNote />
          </div>
        </div>
      )
  }
}
