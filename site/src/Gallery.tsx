import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPTS } from './concepts/meta'
import { PART_IDS, PARTS, partSrc } from './sculpture/parts'
import { Logo } from './shared/Logo'

// The review gallery: five concepts side by side, live, with rationale and a way to mark the preferred one.
const SWATCHES = [
  ['צהוב', '#FEE801'],
  ['שנהב', '#FEFAEE'],
  ['מג׳נטה', '#E13D96'],
  ['שחור', '#0A0A0A'],
]
const PICK_KEY = 'medorot-concept-pick'

function Frame({ src, w, h, title, className = '' }: { src: string; w: number; h: number; title: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [load, setLoad] = useState(false)
  useEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(() => setScale(el.clientWidth / w))
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLoad(true), { rootMargin: '400px' })
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [w])
  return (
    <div ref={box} className={`relative overflow-hidden bg-white ${className}`} style={{ aspectRatio: `${w}/${h}` }}>
      {load && <iframe src={src} title={title} loading="lazy" className="absolute top-0 right-0 origin-top-right border-0" style={{ width: w, height: h, transform: `scale(${scale})` }} />}
    </div>
  )
}

export default function Gallery() {
  const [pick, setPick] = useState<number | null>(() => {
    try { return Number(localStorage.getItem(PICK_KEY)) || null } catch { return null }
  })
  const choose = (id: number) => {
    setPick(id)
    try { localStorage.setItem(PICK_KEY, String(id)) } catch { /* private mode */ }
  }
  const chosen = CONCEPTS.find((c) => c.id === pick)

  return (
    <div className="min-h-dvh bg-[#fefaee] text-[#0a0a0a]">
      <header className="px-5 md:px-12 pt-8 pb-10 border-b-2 border-black">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo className="w-56 md:w-72" />
          <p className="text-base md:text-lg">שלב 2 מתוך 7 · חמישה כיווני עיצוב לבחירה</p>
        </div>
        <h1 className="mt-10 text-[clamp(2.8rem,7vw,6.5rem)] font-black leading-[0.95]">חמישה כיוונים<br />לאתר מְדּוֹרוֹת 2027</h1>
        <p className="mt-6 text-xl md:text-2xl max-w-[60ch] leading-relaxed">
          כל הכיוונים משתמשים באותו לוגו, באותם צבעים שנדגמו מקובץ ה-PSD, בגופן Frank Ruhl Libre, בחלקי הפסלים המקוריים מהפוסטר ובצילומים האמיתיים של קהילת כל הנשמה. ההבדל הוא בבימוי האמנותי, בקומפוזיציה, בניווט ובשפת התנועה. כל קונספט הוא אתר לחיץ ומלא: ניווט, טופס בארבעה שלבים, מרחבים, תרומות ופרטים.
        </p>
        <p className="mt-4 text-lg font-bold">איך בוחרים: פותחים כל קונספט, לוחצים, משחקים עם הפסל, ממלאים את הטופס, ובוחרים כיוון אחד. רק אחרי הבחירה בונים את האתר המלא.</p>
      </header>

      {chosen && (
        <div role="status" className="sticky top-0 z-30 bg-black text-[#fefaee] px-5 md:px-12 py-3 text-lg flex flex-wrap items-center gap-3">
          <span>סימנתם את קונספט {chosen.id}: <strong className="text-[#fee801]">{chosen.name}</strong>.</span>
          <span className="opacity-80">הבחירה נשמרת רק בדפדפן הזה. כדי שאתחיל לבנות, כתבו לי בצ׳אט איזה כיוון נבחר.</span>
        </div>
      )}

      {CONCEPTS.map((c, i) => (
        <section key={c.id} aria-labelledby={`g-${c.id}`} className={`px-5 md:px-12 py-14 border-b-2 border-black ${pick === c.id ? 'bg-[#fff7c2]' : ''}`}>
          <div className="grid xl:grid-cols-[1fr_24rem] gap-10">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border-2 border-black shadow-[6px_6px_0_#0a0a0a]">
                <div className="flex items-center gap-2 px-3 py-1.5 border-b-2 border-black text-sm bg-white"><span className="size-2.5 rounded-full bg-black/20" /><span className="size-2.5 rounded-full bg-black/20" /><span className="opacity-60" dir="ltr">medorot.co.il · desktop 1440</span></div>
                <Frame src={`/c/${c.id}?embed`} w={1440} h={900} title={`קונספט ${c.id} בדסקטופ`} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="w-[120px] sm:w-[170px] md:w-[210px] border-[6px] border-black rounded-[26px] overflow-hidden shadow-[6px_6px_0_#0a0a0a]">
                <Frame src={`/c/${c.id}?embed`} w={390} h={844} title={`קונספט ${c.id} במובייל`} />
              </motion.div>
            </div>
            <div>
              <p className="flex items-center gap-3 text-lg">
                <span className="size-6 border-2 border-black" style={{ background: c.color }} />
                <span className="tabular-nums">כיוון {i + 1}</span>
                <span className="opacity-60" dir="ltr">{c.en}</span>
              </p>
              <h2 id={`g-${c.id}`} className="mt-2 text-4xl md:text-5xl font-black leading-tight">{c.name}</h2>
              <p className="mt-4 text-lg leading-relaxed">{c.rationale}</p>
              <h3 className="mt-6 font-bold text-lg">חוזקות</h3>
              <ul className="mt-1 space-y-1 text-base list-disc ps-5">{c.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
              <h3 className="mt-4 font-bold text-lg">פשרות</h3>
              <ul className="mt-1 space-y-1 text-base list-disc ps-5">{c.tradeoffs.map((s) => <li key={s}>{s}</li>)}</ul>
              <h3 className="mt-4 font-bold text-lg">מובייל</h3>
              <p className="text-base">{c.mobile}</p>
              <h3 className="mt-4 font-bold text-lg">תנועה</h3>
              <p className="text-base">{c.motion}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/c/${c.id}`} className="min-h-12 inline-flex items-center px-6 bg-black text-[#fefaee] text-xl font-bold hover:bg-[#e13d96] transition-colors">פתיחת הקונספט ←</Link>
                <button type="button" aria-pressed={pick === c.id} onClick={() => choose(c.id)} className={`min-h-12 px-5 border-2 border-black text-xl ${pick === c.id ? 'bg-[#fee801] font-bold' : 'bg-white hover:bg-[#fee801]'}`}>
                  {pick === c.id ? '✓ הכיוון שבחרנו' : 'זה הכיוון שלנו'}
                </button>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* comparison */}
      <section aria-labelledby="cmp" className="px-5 md:px-12 py-14 border-b-2 border-black">
        <h2 id="cmp" className="text-4xl md:text-5xl font-black mb-8">השוואה מהירה</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-start text-base border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-lg">
                <th className="text-start py-3 pe-4">כיוון</th><th className="text-start py-3 pe-4">הפסל</th><th className="text-start py-3 pe-4">ניווט</th><th className="text-start py-3 pe-4">צילומי המקום</th><th className="text-start py-3 pe-4">אופי</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1. מעבדת הפסל החי', 'ענק, דביק, מתחלף בכל מעבר', 'חדרים ממוספרים בפס עליון', 'רצועה נגללת לכל מרחב', 'קינטי, צהוב, נועז'],
                ['2. כתב העת העצמאי', '"לוח" עם כיתוב, וטקסט זורם סביב הצללית', 'תוכן עניינים עם מספרי עמודים', 'מאמר צילום עם כיתובי איור', 'עריכתי, מעודן'],
                ['3. התערוכה הדיגיטלית', 'על כן, עם זרקור שעוקב אחרי העכבר', 'מפת חדרים בצד', 'הצילומים הם הקירות, במסך מלא', 'מרחבי, כהה, דרמטי'],
                ['4. מגרש המשחקים', 'גרירה, מתיחה ולחיצה', 'תוויות נוטות', 'פולארואידים שאפשר לגרור', 'שובב, ורוד, שיתופי'],
                ['5. חומר, נייר ודורות', 'קולאז׳ גזור עם שוליים לבנים', 'לשוניות תיקייה', 'צילומים מודבקים בסרט', 'חם, חומרי, קהילתי'],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-black/30 align-top">{r.map((x, j) => <td key={j} className={`py-3 pe-4 ${j === 0 ? 'font-bold' : ''}`}>{x}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* brand audit */}
      <section aria-labelledby="audit" className="px-5 md:px-12 py-14">
        <h2 id="audit" className="text-4xl md:text-5xl font-black">שלב 1: ביקורת המותג</h2>
        <p className="mt-3 text-lg max-w-[70ch]">מה נמצא בקבצים שהצוות שלח, ומה נעשה איתו.</p>
        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-3">צבעים (נדגמו מה-PSD)</h3>
            <ul className="grid grid-cols-2 gap-2">
              {SWATCHES.map(([n, hex]) => (
                <li key={hex} className="border-2 border-black"><div className="h-16" style={{ background: hex }} /><p className="px-2 py-1 text-sm flex justify-between"><span>{n}</span><span dir="ltr" className="tabular-nums">{hex}</span></p></li>
              ))}
            </ul>
            <p className="mt-3 text-sm">הצהוב בפועל הוא #FEE801 (ההערכה בבריף הייתה #F7E600). השחור של הטקסט בפוסטר הוא #0A0A0A.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3">לוגו וגופן</h3>
            <div className="border-2 border-black bg-white p-4"><Logo className="w-full" /></div>
            <p className="mt-3 text-base">הלוגו נשלף מקובץ ה-AI כווקטור, בלי שינוי, ונשמר כ-SVG מלא וכסמל בלבד. בפוסטר הטקסטים כתובים ב-Frank Ruhl Pro (Light ו-Regular) וב-Frank Ruhl Libre Light.</p>
            <p className="mt-2 text-base font-bold">כרגע הגופן נטען מ-Google Fonts (אותה משפחה). כדי לטעון אותו מ-Adobe Fonts כמו שהבריף דורש, צריך את ה-Web Project ID מהצוות.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3">חלקי הפסלים</h3>
            <ul className="grid grid-cols-4 gap-2">
              {PART_IDS.map((id) => (
                <li key={id} className="aspect-square border border-black/30 bg-white grid place-items-center p-1.5" title={PARTS[id].label}>
                  <img src={partSrc(id)} alt={PARTS[id].label} className="max-h-full max-w-full object-contain" />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-base">שלושת היצורים בפוסטר בנויים כקבצים חכמים, וכל חלק פסל הוא שכבה ממוסכת נפרדת. חילצנו 8 חלקים שקופים עם המיקום המקורי שלהם, כך שכל צירוף מחדש נבנה מהאמנות המקורית בלבד.</p>
          </div>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-8 text-base">
          <div className="border-2 border-black p-5 bg-white">
            <h3 className="text-xl font-bold mb-2">נמצא ומוכן</h3>
            <ul className="list-disc ps-5 space-y-1">
              <li>3 גרסאות פוסטר (צהוב, קרם, ורוד), ובכל אחת יצור אחר.</li>
              <li>15 צילומי מקום: 4 של גלריה 2, 9 של החלל המרכזי (5 מהם במבט על הגלריות), ו-2 של הפטיו. כולם הומרו מ-HEIC ל-WebP.</li>
              <li>לוגואים של שותפים מהפוסטר: קהילת כל הנשמה, JCU וסמל הנמלה.</li>
              <li>קובץ "ויהי ערב" (באנר בשלושה חלקים) שאפשר להשתמש בו לשיתוף ברשתות.</li>
            </ul>
          </div>
          <div className="border-2 border-black p-5 bg-white">
            <h3 className="text-xl font-bold mb-2">חסר, או דורש החלטה</h3>
            <ul className="list-disc ps-5 space-y-1">
              <li>אין צילום של גלריה 1 מבפנים. רואים אותה רק מלמטה.</li>
              <li>אין צילום ייעודי של הטריבונות.</li>
              <li>היצור הוורוד נשען על תמונה שבשם הקובץ שלה מופיע shutterstock. כדאי לוודא שיש רישיון לשימוש בה באתר.</li>
              <li>ה-Web Project ID של Adobe Fonts, מייל, וואטסאפ, תאריכים, ספק תשלומים ונוסח מדיניות הפרטיות.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
