import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { enableTracking, track, trackPage } from '../analytics'
import { useContent, useSourceContent } from '../cms/content'
import { img, type SectionId } from '../content'
import { useLang } from '../i18n/lang'
import { SculptureMixer } from '../sculpture/SculptureMixer'
import { FestivalYear, OpenCallHeadline, PanelTitle, Reveal } from '../shared/Blocks'
import { Donation } from '../shared/Donation'
import { InfoList, Partners } from '../shared/Info'
import { LangToggle } from '../shared/LangToggle'
import { Lightbox } from '../shared/Lightbox'
import { Logo } from '../shared/Logo'
import { MobileNav } from '../shared/MobileNav'
import { useSection } from '../shared/useSection'
import { Accessibility, Privacy } from './Legal'

// the form (and its validation library) loads only when someone opens the application room
const ApplicationForm = lazy(() => import('../shared/ApplicationForm').then((m) => ({ default: m.ApplicationForm })))

// The festival site, in the chosen direction (concept 1, "The Living Sculpture Lab"): a yellow lab where the
// sculpture is the protagonist and recombines on every room change.
const ROOM_SCULPTURE: Record<SectionId, string> = {
  home: 'yellow', about: 'two-heads', 'open-call': 'antler-dancer', spaces: 'cream', apply: 'bird-watcher', support: 'crowned-wings', details: 'pink',
}
// the sculpture box steps through the poster's three backgrounds on each room change: yellow, pink, cream
const BOX_COLORS = ['#fee801', '#e13d96', '#fefaee']
// the sculpture recombines by itself every few seconds: noticeable, never frantic
const SCULPTURE_BEAT_MS = 4200
const VARS = { '--ink': '#0a0a0a', '--paper': '#fee801', '--accent': '#fefaee', '--accent-2': '#e13d96', '--line': '#0a0a0a', '--field': '#fefaee', '--radius': '0px', '--focus': '#e13d96' } as CSSProperties

// title, description and the Open Graph tags follow the language (link previews read index.html, which stays Hebrew)
const setMeta = (sel: string, content: string) => document.querySelector(sel)?.setAttribute('content', content)
function usePageMeta(title: string, description: string | undefined, og: { title: string; description: string; locale: string; imageAlt: string }) {
  useEffect(() => {
    document.title = title
    if (description) setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', og.title)
    setMeta('meta[property="og:description"]', og.description)
    setMeta('meta[property="og:locale"]', og.locale)
    setMeta('meta[property="og:image:alt"]', og.imageAlt)
  }, [title, description, og.title, og.description, og.locale, og.imageAlt])
}

export default function Site({ page }: { page?: 'privacy' | 'accessibility' }) {
  const { active, go, label, settle } = useSection('', { manual: true })
  const c = useContent()
  const { t, withLang } = useLang()
  const [boxColor, setBoxColor] = useState(0)
  const sculpture = ROOM_SCULPTURE[page ? 'details' : active]
  const nextColor = () => setBoxColor((n) => (n + 1) % BOX_COLORS.length)
  const boxBg = { initial: false, animate: { backgroundColor: BOX_COLORS[boxColor] }, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } } as const
  const wide = active === 'apply' || active === 'spaces' || !!page
  const pageTitle = page === 'privacy' ? t.site.privacy : page === 'accessibility' ? t.site.accessibility : active === 'home' ? '' : label
  const m = t.meta
  usePageMeta(`${pageTitle ? pageTitle + ' · ' : ''}${m.site}`, (page ? undefined : m.descriptions[active]) ?? m.descriptions.home, { title: m.ogTitle, description: m.ogDescription, locale: m.ogLocale, imageAlt: m.ogImageAlt })
  useEffect(() => enableTracking(), [])
  useEffect(() => trackPage(page ?? active), [page, active])
  // a room change recombines the sculpture, so the box takes the next color too (not on the first render)
  const lastRoom = useRef(page ?? active)
  useEffect(() => {
    if (lastRoom.current === (page ?? active)) return
    lastRoom.current = page ?? active
    nextColor()
  }, [page, active])

  return (
    <div style={VARS} className="min-h-dvh bg-[var(--paper)] text-[color:var(--ink)]">
      <a href="#panel-title" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[200] bg-black text-white px-4 py-2">{t.site.skip}</a>
      {/* desktop header: logo + numbered rooms */}
      <header className="hidden md:flex sticky top-0 z-40 items-stretch border-b-2 border-black bg-[var(--paper)]">
        <Link to={withLang('/')} className="px-6 flex items-center border-e-2 border-black" aria-label={t.site.homeLink}>
          <Logo className="w-44 lg:w-48" />
        </Link>
        <nav aria-label={t.site.mainNav} className="flex-1 flex">
          {c.nav.map((n, i) => {
            const on = !page && active === n.id
            return (
              <button
                key={n.id}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => go(n.id)}
                className={`group relative flex-1 text-start px-3 py-3 border-e border-black/30 last:border-e-0 overflow-hidden ${on ? 'text-[color:var(--paper)]' : 'hover:bg-black/5'}`}
              >
                {on && <motion.span layoutId="site-room" className="absolute inset-0 bg-black" transition={{ type: 'spring', stiffness: 260, damping: 28 }} />}
                <span className="relative block text-xs tabular-nums opacity-70">{t.site.room(String(i + 1).padStart(2, '0'))}</span>
                <span className="relative block text-base lg:text-lg xl:text-xl leading-tight rtl:group-hover:-translate-x-[3px] ltr:group-hover:translate-x-[3px] transition-transform">{n.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="flex items-center px-4 border-s-2 border-black">
          <LangToggle className="h-10 min-w-12 px-2 border-2 border-black text-base hover:bg-black hover:text-[color:var(--paper)]" />
        </div>
      </header>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--paper)]">
        <Link to={withLang('/')} aria-label={t.site.homeLink}><Logo className="w-40" /></Link>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums">{c.year}</span>
          <LangToggle className="size-11 border-2 border-black text-base active:bg-black active:text-[color:var(--paper)]" />
        </div>
      </div>
      <MobileNav active={page ? ('' as SectionId) : active} onGo={go} bar="bg-[var(--paper)] border-y-2 border-black" chip={(a) => `px-4 py-2.5 text-[17px] leading-none border-2 border-black ${a ? 'bg-black text-[color:var(--paper)]' : 'bg-[var(--paper)]'}`} />

      <div className={`flex flex-col md:grid ${wide ? 'md:grid-cols-[1fr_minmax(260px,30vw)]' : 'md:grid-cols-[1fr_minmax(340px,44vw)]'} transition-[grid-template-columns] duration-700`}>
        <main className="relative min-w-0 border-black md:border-e-2">
          {/* old room fades out, then the page returns to the top, then the new room eases in */}
          <AnimatePresence mode="wait" initial={false} onExitComplete={settle}>
            <motion.section
              key={page ?? active}
              aria-labelledby="panel-title"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 } }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }}
              className="px-5 md:px-10 xl:px-14 py-10 md:py-14"
            >
              <Wipe />
              {page === 'privacy' ? <Privacy /> : page === 'accessibility' ? <Accessibility /> : <Panel id={active} go={go} />}
            </motion.section>
          </AnimatePresence>
        </main>
        {/* the sculpture: sticky on desktop, recombines by itself and takes the room's arrangement and color on each room change */}
        <motion.aside
          aria-label={t.site.sculpture}
          className="order-first md:order-none md:sticky md:top-[78px] md:h-[calc(100dvh-78px)] flex flex-col md:justify-center border-b-2 md:border-b-0 border-black"
          {...boxBg}
        >
          <SculptureMixer
            value={sculpture}
            aspect={0.86}
            autoplay={SCULPTURE_BEAT_MS}
            className="w-full max-w-[min(100%,30svh)] md:max-w-[min(100%,66vh)] mx-auto px-4 md:px-6 py-3 md:py-6"
          />
        </motion.aside>
      </div>

      <footer className="border-t-2 border-black px-5 md:px-10 py-10 grid md:grid-cols-3 gap-8 items-end bg-black text-[color:var(--paper)]">
        <div>
          <Logo invert className="w-56 mb-3" />
          <p className="text-xl">{c.tagline}</p>
          <p className="mt-1 text-base opacity-80">{c.settings.venue}</p>
        </div>
        <nav aria-label={t.site.footerNav} className="flex flex-wrap gap-x-5 gap-y-2 text-lg">
          {c.nav.map((n) => <button key={n.id} type="button" onClick={() => go(n.id)} className="underline-offset-4 hover:underline">{n.label}</button>)}
          <Link to={withLang('/privacy')} className="underline-offset-4 hover:underline">{t.site.privacy}</Link>
          <Link to={withLang('/accessibility')} className="underline-offset-4 hover:underline">{t.site.accessibility}</Link>
        </nav>
        <div className="flex flex-wrap items-center gap-6 md:justify-end">
          <a className="inline-flex p-1 -m-1 rounded hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fee801] transition-opacity" href={c.settings.instagramUrl} target="_blank" rel="noreferrer" aria-label={t.site.instagram} onClick={() => track('outbound', { to: 'instagram' })}>
            <InstagramIcon className="size-9 text-white" />
          </a>
          <Partners invert />
        </div>
      </footer>
    </div>
  )
}

// Instagram's glyph (rounded square, lens, flash dot), drawn in currentColor so it can be white on the black footer
function InstagramIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// a thin magenta line draws across the top of the panel on every room change
function Wipe() {
  return <motion.span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--accent-2)] rtl:origin-right ltr:origin-left z-10" initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: 1, opacity: 0 }} transition={{ scaleX: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.5, delay: 0.8 } }} />
}

const H2 = ({ children }: { children: ReactNode }) => <h2 className="text-3xl md:text-4xl font-bold mt-14 mb-5 flex items-center gap-3"><span aria-hidden className="inline-block w-8 h-[3px] bg-black" />{children}</h2>
const Cta = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <motion.button type="button" whileHover={{ rotate: -2, scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={onClick} className="min-h-14 px-8 bg-black text-[color:var(--paper)] text-2xl font-bold">{children}</motion.button>
)

function Panel({ id, go }: { id: SectionId; go: (s: SectionId) => void }) {
  const c = useContent()
  const source = useSourceContent()
  const { t, withLang } = useLang()
  const s = t.site
  const fwd = t.brand.fwd
  const [box, setBox] = useState<{ s: number; i: number } | null>(null)
  switch (id) {
    case 'home':
      return (
        <div>
          {/* the open call on one line as the lead-in, then the festival name as the page's big headline (h1) */}
          <header>
            <OpenCallHeadline as="p" inline className="text-4xl md:text-6xl font-light leading-tight" />
            <h1 id="panel-title" tabIndex={-1} className="mt-4 outline-none text-[clamp(4.2rem,11vw,10.5rem)] font-black leading-[0.95] tracking-tight">
              <FestivalYear className="block !leading-[0.95]" />
            </h1>
          </header>
          <p className="mt-2 text-xl md:text-2xl">{c.tagline}</p>
          <div className="mt-10 space-y-4 text-xl md:text-2xl leading-relaxed max-w-[38ch]">
            <p>{c.home.invite}</p>
            <p>{c.home.about}</p>
            <p>{c.home.fields}</p>
            <p className="font-bold">{c.home.closing}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Cta onClick={() => go('apply')}>{c.home.ctaPrimary} {fwd}</Cta>
            <button type="button" onClick={() => go('about')} className="min-h-14 px-6 border-2 border-black text-2xl hover:bg-black/5">{c.home.ctaSecondary}</button>
          </div>
          <dl className="mt-12 grid grid-cols-1 sm:grid-cols-3 border-2 border-black text-lg">
            {[[s.festivalDate, c.settings.festivalDate], [s.deadline, c.settings.deadline], [s.venue, c.settings.venue]].map(([k, v]) => (
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
          <PanelTitle className="text-[clamp(4rem,10vw,9rem)] font-black leading-none">{c.about.title}</PanelTitle>
          <div className="mt-8 space-y-5 text-2xl md:text-3xl leading-snug max-w-[34ch]">
            {c.about.paragraphs.map((p, i) => <p key={i}><Reveal text={p} delay={0.2 + i * 0.25} stagger={0.02} /></p>)}
          </div>
          <ul className="mt-12 flex flex-wrap gap-3" aria-label={s.keyWords}>
            {c.about.words.map((w, i) => (
              <motion.li key={w} initial={{ opacity: 0, scale: 0.6, rotate: i % 2 ? 8 : -8 }} animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 2 : -2 }} transition={{ delay: 0.8 + i * 0.08, type: 'spring' }} drag dragSnapToOrigin className={`cursor-grab px-5 py-2 text-4xl md:text-5xl font-bold border-2 border-black ${i % 3 === 1 ? 'bg-[var(--accent-2)]' : i % 3 === 2 ? 'bg-black text-[color:var(--paper)]' : 'bg-[var(--accent)]'}`}>
                {w}
              </motion.li>
            ))}
          </ul>
          <p className="mt-10 text-lg max-w-[50ch] border-s-4 border-black ps-4">{c.about.nameNote}</p>
          <div className="mt-10"><Cta onClick={() => go('open-call')}>{s.toOpenCall} {fwd}</Cta></div>
        </div>
      )
    case 'open-call':
      return (
        <div>
          <OpenCallHeadline id="panel-title" lead="text-4xl md:text-5xl font-light" punch="text-[clamp(3.6rem,9vw,8rem)] font-black leading-[0.95]" />
          <p className="mt-3 text-3xl"><FestivalYear /></p>
          <div className="mt-8 space-y-5 text-xl md:text-2xl leading-relaxed max-w-[44ch]">{c.openCall.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
          <H2>{s.disciplines}</H2>
          <ul className="grid grid-cols-2 lg:grid-cols-3 border-t-2 border-s-2 border-black">
            {c.openCall.disciplines.map((d, i) => (
              <motion.li key={d} whileHover={{ backgroundColor: '#0a0a0a', color: '#fee801' }} className="border-b-2 border-e-2 border-black p-4 min-h-28 flex flex-col justify-between">
                <span className="text-sm tabular-nums opacity-60">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-2xl md:text-3xl font-bold leading-tight">{d}</span>
              </motion.li>
            ))}
          </ul>
          <H2>{s.who}</H2>
          <p className="text-xl md:text-2xl max-w-[44ch]">{c.openCall.who}</p>
          <H2>{s.what}</H2>
          <div className="grid sm:grid-cols-2 gap-3">
            {c.openCall.stages.map((s, i) => (
              <div key={s.id} className="border-2 border-black p-5 bg-[var(--accent)]" style={{ transform: `rotate(${[-1, 0.8, -0.5, 1][i % 4]}deg)` }}>
                <p className="text-2xl font-bold">{s.label}</p>
                <p className="text-lg">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-2xl font-bold bg-black text-[color:var(--paper)] inline-block px-3 py-1">{c.openCall.stagesNote}</p>
          <H2>{s.spaces}</H2>
          <p className="text-xl md:text-2xl max-w-[44ch]">{c.openCall.spaces}</p>
          <button type="button" onClick={() => go('spaces')} className="mt-3 text-xl underline underline-offset-4">{s.toSpacePhotos} {fwd}</button>
          <div className="mt-12"><Cta onClick={() => go('apply')}>{s.apply} {fwd}</Cta></div>
        </div>
      )
    case 'spaces':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-none">{s.spacesTitle}</PanelTitle>
          <p className="mt-4 text-xl md:text-2xl max-w-[44ch]">{c.openCall.spaces}</p>
          <div className="mt-10 space-y-16">
            {c.spaces.map((sp, si) => (
              <article key={sp.id} aria-labelledby={`sp-${sp.id}`}>
                <div className="flex items-baseline gap-4 mb-4">
                  <span aria-hidden className="text-6xl font-black tabular-nums">0{si + 1}</span>
                  <div>
                    <h2 id={`sp-${sp.id}`} className="text-3xl md:text-4xl font-bold">{sp.name}</h2>
                    <p className="text-xl">{sp.desc}</p>
                  </div>
                </div>
                <div className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2" role="list">
                  {sp.photos.map((p, i) => (
                    <motion.button role="listitem" key={p.src} type="button" whileHover={{ y: -6 }} onClick={() => setBox({ s: si, i })} className={`snap-start shrink-0 border-2 border-black bg-black ${i === 0 ? 'w-[82%] md:w-[60%]' : 'w-[60%] md:w-[34%]'}`} aria-label={s.enlarge(p.alt)}>
                      <img src={img(p)} alt="" loading="lazy" className="block w-full aspect-[4/3] object-cover" />
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm mt-1 opacity-70">{t.site.photosHint(sp.photos.length)}</p>
              </article>
            ))}
          </div>
          <Lightbox photos={box ? c.spaces[box.s].photos : []} index={box?.i ?? null} onIndex={(i) => setBox((b) => b && { ...b, i })} onClose={() => setBox(null)} title={box ? c.spaces[box.s].name : ''} trackAs={box ? source.spaces[box.s]?.name : undefined} />
        </div>
      )
    case 'apply':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-none">{s.applyTitle}</PanelTitle>
          <p className="mt-3 mb-10 text-xl md:text-2xl max-w-[44ch]">{c.openCall.stagesNote} {s.applyIntro}</p>
          <Suspense fallback={<p className="text-xl" role="status">{s.loadingForm}</p>}>
            <ApplicationForm mode="live" privacyHref={withLang('/privacy')} />
          </Suspense>
        </div>
      )
    case 'support':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-[0.95]">{c.support.title}</PanelTitle>
          <div className="mt-8 space-y-4 text-xl md:text-2xl leading-relaxed max-w-[42ch]">{c.support.paragraphs.map((p) => <p key={p}>{p}</p>)}</div>
          <p className="mt-6 text-2xl md:text-3xl font-bold">{c.support.closing}</p>
          <div className="mt-10 border-2 border-black bg-[var(--accent)] p-6 md:p-8"><Donation /></div>
        </div>
      )
    case 'details':
      return (
        <div>
          <PanelTitle className="text-[clamp(3.4rem,8vw,7rem)] font-black leading-none">{s.detailsTitle}</PanelTitle>
          <InfoList className="mt-8 border-t-2 border-black" row="border-b-2 border-black py-4" />
          <div className="mt-12 p-6 md:p-8 bg-black text-[color:var(--paper)]">
            <p className="text-3xl md:text-4xl font-bold nikud">{c.finalCta.text}</p>
            <button type="button" onClick={() => go('apply')} className="mt-5 min-h-14 px-8 bg-[var(--paper)] text-black text-2xl font-bold">{c.finalCta.button} {fwd}</button>
          </div>
          <p className="mt-10 text-lg flex flex-wrap gap-x-6 gap-y-2">
            <Link to={withLang('/privacy')} className="underline underline-offset-4">{s.privacy}</Link>
            <Link to={withLang('/accessibility')} className="underline underline-offset-4">{s.accessibility}</Link>
          </p>
        </div>
      )
  }
}
