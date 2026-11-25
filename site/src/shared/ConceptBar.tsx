import { Link, useLocation } from 'react-router-dom'
import { CONCEPTS } from '../concepts/meta'
import { isEmbed } from './useSection'

// Review-only switcher between the five concepts (hidden inside the gallery's live previews).
export function ConceptBar({ current }: { current: number }) {
  const { pathname } = useLocation()
  if (isEmbed()) return null
  const section = pathname.split('/')[3] ?? ''
  return (
    <div className="fixed bottom-3 left-3 z-[90] flex items-center gap-1 rounded-full bg-black/85 text-white px-2 py-1.5 text-sm shadow-xl backdrop-blur" dir="rtl">
      <Link to="/concepts" className="px-3 py-1.5 rounded-full hover:bg-white/15">← כל הקונספטים</Link>
      {CONCEPTS.map((c) => (
        <Link
          key={c.id}
          to={`/c/${c.id}/${section}`}
          aria-label={`קונספט ${c.id}: ${c.name}`}
          aria-current={c.id === current ? 'page' : undefined}
          className={`size-8 grid place-items-center rounded-full tabular-nums ${c.id === current ? 'bg-white text-black font-bold' : 'hover:bg-white/15'}`}
        >
          {c.id}
        </Link>
      ))}
    </div>
  )
}
