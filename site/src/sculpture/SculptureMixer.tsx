import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { track } from '../analytics'
import { ARRANGEMENTS, fit, swapPart, type Arrangement } from './arrangements'
import { PART_IDS, PARTS, partSrc, type Placement } from './parts'

type Props = {
  start?: string // arrangement id
  value?: string // controlled arrangement id: changing it recombines the sculpture (e.g. per section)
  aspect?: number // stage width / height
  interactive?: boolean // tap a part to swap it
  draggable?: boolean // parts can be pulled and spring back
  autoplay?: number // ms between automatic recombinations; paused on interaction and for reduced motion
  intro?: 'assemble' | 'fade' | 'none'
  float?: boolean // gentle idle drift
  controls?: (api: { shuffle: () => void; reset: () => void; name: string }) => ReactNode
  className?: string
  style?: CSSProperties
  filter?: string // css filter on parts (e.g. paper/print treatment)
  label?: string
}

const SPRING = { type: 'spring', stiffness: 70, damping: 14, mass: 0.9 } as const

// where an unused part waits: just outside the stage, turned, small
function offstage(i: number) {
  const a = (i / PART_IDS.length) * Math.PI * 2 + 0.6
  return { x: 50 + Math.cos(a) * 85, y: 50 + Math.sin(a) * 85, rot: (i % 2 ? 1 : -1) * 70 }
}

export function SculptureMixer({ start = 'yellow', value, aspect = 0.8, interactive = true, draggable = false, autoplay = 0, intro = 'assemble', float = true, controls, className = '', style, filter, label = 'פסל מתחבר מחלקי פסלים מקוריים מהפוסטר של הפסטיבל' }: Props) {
  const reduce = useReducedMotion()
  const [arr, setArr] = useState<Arrangement>(() => ARRANGEMENTS.find((a) => a.id === start) ?? ARRANGEMENTS[0])
  const [placements, setPlacements] = useState<Placement[]>(arr.placements)
  const [entered, setEntered] = useState(intro === 'none' || !!reduce)
  const touched = useRef(false)

  useEffect(() => {
    if (entered) return
    const t = setTimeout(() => setEntered(true), 120)
    return () => clearTimeout(t)
  }, [entered])

  const goTo = (a: Arrangement) => {
    setArr(a)
    setPlacements(a.placements)
  }
  const shuffle = () => {
    const i = ARRANGEMENTS.findIndex((a) => a.id === arr.id)
    goTo(ARRANGEMENTS[(i + 1) % ARRANGEMENTS.length])
  }
  const reset = () => goTo(ARRANGEMENTS.find((a) => a.id === start) ?? ARRANGEMENTS[0])

  useEffect(() => {
    const a = value && ARRANGEMENTS.find((x) => x.id === value)
    if (a) goTo(a)
  }, [value])

  // Autoplay: the sculpture keeps recombining by itself, always into one of the curated arrangements (every one of
  // them reads as a whole creature; random part swaps can leave a head floating). The order is shuffled and never
  // returns to the arrangement it just left. It waits while the sculpture is off screen or the tab is hidden, rests
  // for a while after a visitor taps a part, and is off entirely for visitors who asked for reduced motion.
  const stageRef = useRef<HTMLDivElement>(null)
  const visible = useRef(true)
  const lastTouch = useRef(0)
  const previous = useRef('')
  useEffect(() => {
    const el = stageRef.current
    if (!autoplay || reduce || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [autoplay, reduce])
  useEffect(() => {
    if (!autoplay || reduce) return
    const t = setInterval(() => {
      if (document.hidden || !visible.current || Date.now() - lastTouch.current < autoplay * 3) return
      const options = ARRANGEMENTS.filter((a) => a.id !== arr.id && a.id !== previous.current)
      previous.current = arr.id
      goTo(options[Math.floor(Math.random() * options.length)])
    }, autoplay)
    return () => clearInterval(t)
  }, [autoplay, reduce, arr.id])

  const stage = useMemo(() => fit(placements, aspect), [placements, aspect])
  const byPart = Object.fromEntries(stage.map((s) => [s.part, s]))

  return (
    <div className={`relative select-none ${className}`} style={style}>
      <div
        ref={stageRef}
        role="group"
        aria-label={label}
        className="relative w-full"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={() => { touched.current = true; lastTouch.current = Date.now() }}
      >
        {PART_IDS.map((id, i) => {
          const p = byPart[id]
          const part = PARTS[id]
          const off = offstage(i)
          const shown = !!p && entered
          const target = shown
            ? { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, rotate: p.rot, opacity: 1, scale: 1 }
            : intro === 'fade' && !entered && p
              ? { left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, rotate: p.rot, opacity: 0, scale: 0.96 }
              : { left: `${off.x}%`, top: `${off.y}%`, width: `${(p?.w ?? 30) * 0.6}%`, rotate: off.rot, opacity: 0, scale: 0.6 }
          const Tag = interactive && part.role !== 'figure' ? motion.button : motion.div
          return (
            <Tag
              key={id}
              type={interactive ? 'button' : undefined}
              tabIndex={shown && interactive && part.role !== 'figure' ? 0 : -1}
              aria-hidden={!shown}
              aria-label={interactive ? `החלפת חלק: ${part.label}` : undefined}
              onClick={interactive ? () => { touched.current = true; track('sculpture_swap'); setPlacements((cur) => swapPart(cur, id)) } : undefined}
              className={`absolute block p-0 border-0 bg-transparent origin-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current ${interactive && part.role !== 'figure' ? 'cursor-pointer' : ''}`}
              style={{ zIndex: p ? p.z + 1 : 0, pointerEvents: shown ? 'auto' : 'none' }}
              initial={false}
              animate={target}
              transition={{ ...SPRING, delay: entered && intro === 'assemble' ? (p?.z ?? 0) * 0.08 : 0 }}
              drag={draggable && shown}
              dragSnapToOrigin
              dragElastic={0.5}
              whileHover={interactive && shown && !reduce ? { scale: 1.03, rotate: (p?.rot ?? 0) + (i % 2 ? 2 : -2) } : undefined}
              whileTap={interactive ? { scale: 0.97 } : undefined}
            >
              <motion.img
                src={partSrc(id)}
                alt=""
                draggable={false}
                className="block w-full h-auto pointer-events-none"
                style={{ filter }}
                animate={float && shown && !reduce ? { y: [0, -6 - (i % 3) * 3, 0], rotate: [0, i % 2 ? 1.2 : -1.2, 0] } : { y: 0, rotate: 0 }}
                transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
              />
            </Tag>
          )
        })}
      </div>
      <p className="sr-only" aria-live="polite">{arr.name}</p>
      {controls?.({ shuffle: () => { track('sculpture_shuffle'); shuffle() }, reset, name: arr.name })}
    </div>
  )
}
