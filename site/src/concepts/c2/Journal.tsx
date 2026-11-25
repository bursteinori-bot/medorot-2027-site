import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { ABOUT, FINAL_CTA, HOME, NAV, OPEN_CALL, SETTINGS, SPACES, SUPPORT, TAGLINE, img, type SectionId } from '../../content'
import { partSrc } from '../../sculpture/parts'
import { SculptureMixer } from '../../sculpture/SculptureMixer'
import { ApplicationForm } from '../../shared/ApplicationForm'
import { FestivalYear, OpenCallHeadline, PanelTitle, Reveal } from '../../shared/Blocks'
import { Donation } from '../../shared/Donation'
import { InfoList, Partners, PrivacyNote } from '../../shared/Info'
import { Lightbox } from '../../shared/Lightbox'
import { Logo } from '../../shared/Logo'
import { MobileNav } from '../../shared/MobileNav'
import { useSection } from '../../shared/useSection'

// Concept 2 — The Independent Art Journal. Each section is an article in an issue; creatures cut into the text.
const vars = { '--ink': '#0a0a0a', '--paper': '#fefaee', '--accent': '#fee801', '--accent-2': '#e13d96', '--line': '#0a0a0a', '--field': '#fffdf6', '--radius': '0px', '--focus': '#e13d96', '--grain': '0.12' } as React.CSSProperties
const PAGE: Record<SectionId, string> = { home: '01', about: '04', 'open-call': '09', spaces: '17', apply: '25', support: '33', details: '38' }

export default function Journal() {
  const { active, go } = useSection(2)
  return (
    <div style={vars} className="grain min-h-dvh bg-[var(--paper)] text-[color:var(--ink)]">
      <a href="#panel-title" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[200] bg-black text-white px-4 py-2">דילוג לתוכן</a>
      <header className="relative z-10 px-5 md:px-12 pt-4">
        <div className="flex items-center justify-between text-xs md:text-sm tracking-wide border-b border-[color:var(--ink)] pb-2">
          <span>גיליון 01 · ל״ג בעומר <span className="tabular-nums">2027</span></span>
          <span className="hidden md:inline">{TAGLINE}</span>
          <span>ירושלים</span>
        </div>
        <div className="flex items-end justify-between py-4 md:py-6">
          <button type="button" onClick={() => go('home')} aria-label="מדורות - לעמוד הראשי"><Logo className="w-44 md:w-72" /></button>
          <span className="hidden md:block text-sm text-left leading-tight">כתב עת לאמנות,<br />יהדות ותרבות</span>
        </div>
      </header>
      {/* table of contents */}
      <nav aria-label="ניווט ראשי" className="hidden md:block sticky top-0 z-30 mx-12 border-y-2 border-[color:var(--ink)] bg-[var(--paper)]">
        <ol className="flex">
          {NAV.map((n) => (
            <li key={n.id} className="flex-1">
              <button type="button" aria-current={active === n.id ? 'page' : undefined} onClick={() => go(n.id)} className="relative w-full text-start px-2 py-3 flex items-baseline justify-between gap-2 group">
                <span className={`whitespace-nowrap text-base lg:text-lg xl:text-xl ${active === n.id ? 'font-bold' : ''}`}>{n.label}</span>
                <span className="hidden xl:inline text-xs tabular-nums opacity-60">עמ׳ {PAGE[n.id]}</span>
                <motion.span aria-hidden className="absolute bottom-0 inset-x-2 h-[3px] bg-[var(--accent-2)] origin-right" initial={false} animate={{ scaleX: active === n.id ? 1 : 0 }} transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }} />
                <span aria-hidden className="absolute bottom-0 inset-x-2 h-px bg-[var(--ink)] scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-300" />
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <MobileNav active={active} onGo={go} bar="bg-[var(--paper)] border-y-2 border-[color:var(--ink)]" chip={(a) => `px-3 py-2 text-[18px] leading-none ${a ? 'font-bold underline decoration-[color:var(--accent-2)] decoration-[3px] underline-offset-[6px]' : ''}`} />

      <main className="relative z-10 px-5 md:px-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={active}
            aria-labelledby="panel-title"
            initial={{ clipPath: 'inset(0 0 0 100%)' }}
            animate={{ clipPath: 'inset(0 0 0 0%)', transition: { duration: 0.75, ease: [0.65, 0, 0.25, 1] } }}
            exit={{ clipPath: 'inset(0 100% 0 0)', transition: { duration: 0.35, ease: [0.65, 0, 0.35, 1] } }}
            className="py-10 md:py-16"
          >
            <Folio n={PAGE[active]} label={NAV.find((n) => n.id === active)!.label} />
            <Article id={active} go={go} />
          </motion.article>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 mx-5 md:mx-12 border-t-2 border-[color:var(--ink)] py-8 grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        <p className="text-lg">קולופון · <FestivalYear /> · {SETTINGS.venue}</p>
        <Partners />
        <a className="md:text-left text-lg underline underline-offset-4" href={SETTINGS.instagramUrl} target="_blank" rel="noreferrer" dir="ltr">instagram/@{SETTINGS.instagram}</a>
      </footer>
    </div>
  )
}

function Folio({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm mb-6 md:mb-10" aria-hidden>
      <span className="tabular-nums font-bold">{n}</span>
      <span className="h-px flex-1 bg-[var(--ink)]" />
      <span>{label}</span>
    </div>
  )
}

// a creature part the text flows around (shape-outside follows the part's real silhouette)
function Cutout({ part, side = 'left', w = 'w-[42%]', rot = 0 }: { part: string; side?: 'left' | 'right'; w?: string; rot?: number }) {
  return (
    <motion.img
      src={partSrc(part)}
      alt=""
      aria-hidden
      className={`${side === 'left' ? 'float-left ms-6' : 'float-right me-6'} ${w} h-auto mb-4`}
      style={{ shapeOutside: `url(${partSrc(part)})`, shapeMargin: '14px', shapeImageThreshold: 0.3 }}
      initial={{ opacity: 0, y: 30, rotate: rot - 6 }}
      animate={{ opacity: 1, y: 0, rotate: rot }}
      transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
    />
  )
}

const Note = ({ n, children }: { n: number; children: ReactNode }) => (
  <aside className="text-sm leading-relaxed border-t border-[color:var(--ink)] pt-2"><sup className="text-[color:var(--accent-2)] font-bold me-1">{n}</sup>{children}</aside>
)
const Mark = ({ children }: { children: ReactNode }) => (
  <span className="relative isolate">
    <motion.span aria-hidden className="absolute inset-x-[-2px] bottom-[0.08em] top-[0.45em] bg-[var(--accent)] -z-10 origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.6 }} />
    {children}
  </span>
)

function Article({ id, go }: { id: SectionId; go: (s: SectionId) => void }) {
  const [box, setBox] = useState<{ s: number; i: number } | null>(null)
  switch (id) {
    case 'home':
      return (
        <div className="grid md:grid-cols-12 gap-x-8">
          <div className="md:col-span-12">
            <OpenCallHeadline id="panel-title" lead="text-3xl md:text-5xl font-light" punch="text-[clamp(4.5rem,15vw,15rem)] font-light leading-[0.9] -ms-1 tracking-tight" />
          </div>
          <div className="md:col-span-5 mt-8 md:mt-12">
            <p className="text-4xl md:text-6xl font-bold"><FestivalYear /></p>
            <p className="text-2xl mt-2 italic">{TAGLINE}</p>
            <p className="mt-8 text-xl md:text-2xl leading-relaxed first-letter:float-right first-letter:text-[4.6em] first-letter:leading-[0.8] first-letter:me-2 first-letter:font-bold">{HOME.invite}</p>
            <p className="mt-4 text-xl leading-relaxed">{HOME.about}</p>
            <p className="mt-4 text-xl leading-relaxed">{HOME.fields}</p>
            <p className="mt-4 text-2xl font-bold"><Mark>{HOME.closing}</Mark></p>
            <div className="mt-8 flex flex-wrap gap-6 items-center">
              <button type="button" onClick={() => go('apply')} className="min-h-14 px-7 bg-[var(--ink)] text-[color:var(--paper)] text-2xl hover:bg-[var(--accent-2)] transition-colors">{HOME.ctaPrimary} ←</button>
              <button type="button" onClick={() => go('about')} className="text-2xl underline decoration-1 underline-offset-8 hover:decoration-[color:var(--accent-2)] hover:decoration-4">{HOME.ctaSecondary}</button>
            </div>
          </div>
          {/* the plate: a sculpture with a caption, recombinable */}
          <figure className="md:col-span-6 md:col-start-7 mt-12 xl:-mt-10">
            <div className="border-2 border-[color:var(--ink)] p-4 bg-[#fffdf6]">
              <SculptureMixer start="cream" aspect={0.95} float={false} intro="fade" controls={({ shuffle, name }) => (
                <figcaption className="flex items-center justify-between gap-3 border-t border-[color:var(--ink)] pt-3 mt-2 text-base">
                  <span><span className="font-bold">לוח 1.</span> {name}. חלקי פסלים מקוריים מתוך הפוסטר.</span>
                  <button type="button" onClick={shuffle} className="shrink-0 min-h-11 px-4 border-2 border-[color:var(--ink)] hover:bg-[var(--accent)]">ערבבו את הפסל</button>
                </figcaption>
              )} />
            </div>
          </figure>
          <dl className="md:col-span-12 mt-14 grid grid-cols-1 md:grid-cols-3 border-t-2 border-[color:var(--ink)]">
            {[['תאריך הפסטיבל', SETTINGS.festivalDate], ['מועד אחרון להגשה', SETTINGS.deadline], ['מיקום', SETTINGS.venue]].map(([k, v], i) => (
              <div key={k} className={`py-4 md:px-4 border-b md:border-b-0 border-[color:var(--ink)] ${i ? 'md:border-s' : ''}`}>
                <dt className="text-sm">{k}</dt>
                <dd className="text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    case 'about':
      return (
        <div className="grid md:grid-cols-12 gap-x-8">
          <PanelTitle className="md:col-span-12 text-[clamp(5rem,16vw,16rem)] font-light leading-[0.85] tracking-tight">{ABOUT.title}</PanelTitle>
          <div className="md:col-span-8 mt-10 text-2xl md:text-[1.7rem] leading-[1.6]">
            <Cutout part="cream_part2" w="w-[46%] md:w-[38%]" rot={-4} />
            {ABOUT.paragraphs.map((p, i) => <p key={i} className="mb-6"><Reveal text={p} delay={0.15 + i * 0.3} stagger={0.018} />{i === 0 && <sup className="text-[color:var(--accent-2)] font-bold">1</sup>}</p>)}
          </div>
          <div className="md:col-span-3 md:col-start-10 mt-10 space-y-6">
            <Note n={1}>{ABOUT.nameNote}</Note>
            <ul className="space-y-1" aria-label="מילים מרכזיות">
              {ABOUT.words.map((w, i) => (
                <motion.li key={w} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="text-5xl font-black leading-[1.05]" style={{ WebkitTextStroke: i % 2 ? '1.5px #0a0a0a' : undefined, color: i % 2 ? 'transparent' : undefined }}>
                  {w}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )
    case 'open-call':
      return (
        <div className="grid md:grid-cols-12 gap-x-8">
          <div className="md:col-span-12">
            <OpenCallHeadline id="panel-title" lead="text-3xl md:text-5xl font-light" punch="text-[clamp(4rem,12vw,12rem)] font-light leading-[0.9]" />
            <p className="text-3xl md:text-4xl font-bold mt-4"><FestivalYear /></p>
          </div>
          <div className="md:col-span-8 mt-10 text-xl md:text-2xl leading-[1.65] md:columns-2 md:gap-10 [&>p]:mb-5 [&>p]:break-inside-avoid-column">
            {OPEN_CALL.paragraphs.map((p) => <p key={p}>{p}</p>)}
            <p>{OPEN_CALL.spaces}<sup className="text-[color:var(--accent-2)] font-bold">2</sup></p>
          </div>
          <div className="md:col-span-3 md:col-start-10 mt-10 space-y-6">
            <Note n={2}>בית הכנסת של קהילת כל הנשמה, בקעה. פירוט המרחבים בעמ׳ 17.</Note>
            <Note n={3}>{OPEN_CALL.who}</Note>
          </div>
          {/* disciplines as a typographic sentence */}
          <section className="md:col-span-12 mt-16 border-y-2 border-[color:var(--ink)] py-8" aria-labelledby="disc-t">
            <h2 id="disc-t" className="text-sm mb-4">תחומי האמנות והיצירה</h2>
            <p className="text-[clamp(2rem,4.6vw,4.4rem)] leading-[1.15]">
              {OPEN_CALL.disciplines.map((d, i) => (
                <span key={d}>
                  <motion.span whileHover={{ color: '#e13d96' }} className={i % 2 ? 'font-light italic' : 'font-black'}>{d}</motion.span>
                  {i < OPEN_CALL.disciplines.length - 1 && <span className="text-[color:var(--accent-2)] mx-2 font-light">/</span>}
                </span>
              ))}
            </p>
          </section>
          <section className="md:col-span-7 mt-14" aria-labelledby="st-t">
            <h2 id="st-t" className="text-4xl font-bold mb-6">מה אפשר להגיש?</h2>
            <ol className="space-y-5">
              {OPEN_CALL.stages.map((s, i) => (
                <li key={s.id} className="grid grid-cols-[3rem_1fr] gap-2 border-t border-[color:var(--ink)] pt-3">
                  <span className="text-4xl font-light tabular-nums">{i + 1}</span>
                  <span><span className="block text-2xl font-bold">{s.label}</span><span className="text-xl">{s.desc}</span></span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-2xl"><Mark>{OPEN_CALL.stagesNote}</Mark></p>
          </section>
          <section className="md:col-span-4 md:col-start-9 mt-14" aria-labelledby="cr-t">
            <h2 id="cr-t" className="text-4xl font-bold mb-6">{OPEN_CALL.criteriaIntro.replace(':', '')}</h2>
            <ol className="space-y-3 text-xl">
              {OPEN_CALL.criteria.map((c, i) => <li key={c} className="flex gap-3"><span className="font-bold text-[color:var(--accent-2)]">{'אבגדה'[i]}׳</span>{c}</li>)}
            </ol>
            <button type="button" onClick={() => go('apply')} className="mt-8 min-h-14 px-7 bg-[var(--ink)] text-[color:var(--paper)] text-2xl hover:bg-[var(--accent-2)] transition-colors">להגשת הצעה (עמ׳ 25) ←</button>
          </section>
        </div>
      )
    case 'spaces':
      return (
        <div>
          <PanelTitle className="text-[clamp(4rem,11vw,11rem)] font-light leading-[0.9]">מרחבי הפסטיבל</PanelTitle>
          <p className="mt-6 text-2xl max-w-[48ch] leading-relaxed">{OPEN_CALL.spaces}</p>
          {SPACES.map((s, si) => (
            <section key={s.id} aria-labelledby={`sp-${s.id}`} className="mt-16 grid md:grid-cols-12 gap-x-8 gap-y-4 border-t-2 border-[color:var(--ink)] pt-6">
              <div className="md:col-span-3">
                <p className="text-sm">מרחב {['א', 'ב', 'ג'][si]}׳</p>
                <h2 id={`sp-${s.id}`} className="text-4xl font-bold leading-tight">{s.name}</h2>
                <p className="mt-3 text-xl">{s.desc}</p>
              </div>
              <div className="md:col-span-9 grid grid-cols-6 gap-3">
                {s.photos.slice(0, 5).map((p, i) => (
                  <figure key={p.src} className={i === 0 ? 'col-span-6 md:col-span-4 md:row-span-2' : 'col-span-3 md:col-span-2'}>
                    <button type="button" onClick={() => setBox({ s: si, i })} className="block w-full overflow-hidden group" aria-label={`הגדלה: ${p.alt}`}>
                      <img src={img(p, i === 0 ? 2000 : 960)} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover grayscale-[35%] group-hover:grayscale-0 group-hover:scale-[1.03] transition duration-500" />
                    </button>
                    <figcaption className="text-xs mt-1"><span className="font-bold">איור {si + 1}.{i + 1}</span> {p.alt}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
          <Lightbox photos={box ? SPACES[box.s].photos : []} index={box?.i ?? null} onIndex={(i) => setBox((b) => b && { ...b, i })} onClose={() => setBox(null)} title={box ? SPACES[box.s].name : ''} />
        </div>
      )
    case 'apply':
      return (
        <div className="grid md:grid-cols-12 gap-x-8">
          <div className="md:col-span-4">
            <PanelTitle className="text-[clamp(3.5rem,8vw,7rem)] font-light leading-[0.9]">הגשת הצעה</PanelTitle>
            <p className="mt-6 text-xl leading-relaxed">{OPEN_CALL.stagesNote}</p>
            <div className="mt-8 space-y-5 md:sticky md:top-24">
              <Note n={4}>ארבעה שלבים. אפשר לחזור אחורה בכל שלב, והנתונים נשמרים.</Note>
              <Note n={5}>מועד אחרון להגשה: {SETTINGS.deadline}.</Note>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6 mt-10 md:mt-0"><ApplicationForm /></div>
        </div>
      )
    case 'support':
      return (
        <div className="grid md:grid-cols-12 gap-x-8">
          <PanelTitle className="md:col-span-12 text-[clamp(3.5rem,10vw,10rem)] font-light leading-[0.9]">{SUPPORT.title}</PanelTitle>
          <div className="md:col-span-6 mt-10 text-2xl leading-[1.6]">
            <Cutout part="pink_part0" side="left" w="w-[30%]" rot={-20} />
            {SUPPORT.paragraphs.map((p) => <p key={p} className="mb-5">{p}</p>)}
            <p className="font-bold"><Mark>{SUPPORT.closing}</Mark></p>
          </div>
          <div className="md:col-span-5 md:col-start-8 mt-10 border-2 border-[color:var(--ink)] p-6 bg-[#fffdf6]">
            <p className="text-sm mb-4">מינוי תומך · גיליון 01</p>
            <Donation />
          </div>
        </div>
      )
    case 'details':
      return (
        <div className="grid md:grid-cols-12 gap-x-8">
          <PanelTitle className="md:col-span-12 text-[clamp(3.5rem,10vw,10rem)] font-light leading-[0.9]">פרטים</PanelTitle>
          <InfoList className="md:col-span-7 mt-8 border-t-2 border-[color:var(--ink)]" row="border-b border-[color:var(--ink)] py-4" />
          <div className="md:col-span-4 md:col-start-9 mt-8 space-y-8">
            <div className="bg-[var(--accent)] p-6">
              <p className="text-3xl font-bold leading-tight nikud">{FINAL_CTA.text}</p>
              <button type="button" onClick={() => go('apply')} className="mt-4 min-h-12 px-6 bg-[var(--ink)] text-[color:var(--paper)] text-xl">{FINAL_CTA.button} ←</button>
            </div>
            <PrivacyNote />
          </div>
        </div>
      )
  }
}
