import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { NAV, type SectionId } from '../content'

// Tab navigation over real routes: deep links, back/forward, panel scroll and focus reset.
// `base` is a concept number (prototype routes /c/<n>/<section>) or a path prefix ('' for the live site).
// With `manual`, the caller runs the returned `settle()` itself (the live site does it once the old panel has
// faded out, so the page never jumps under a panel that is still visible).
export function useSection(base: number | string, { manual = false } = {}) {
  const { section } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const prefix = typeof base === 'number' ? `/c/${base}` : base
  const active: SectionId = NAV.some((n) => n.id === section) ? (section as SectionId) : 'home'
  const first = useRef(true)

  const go = (id: SectionId) => {
    if (id === active && section !== undefined) return
    navigate(`${prefix}/${id === 'home' ? '' : id}${search}`)
  }

  const settle = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    // move focus to the new panel's heading so keyboard and screen-reader users land in the content
    setTimeout(() => document.getElementById('panel-title')?.focus({ preventScroll: true }), 60)
  }

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!manual) settle()
  }, [active])

  const label = NAV.find((n) => n.id === active)!.label
  return { active, go, label, settle }
}

// gallery previews open concepts with ?embed
export const isEmbed = () => /[?&]embed\b/.test(window.location.search + window.location.hash)
