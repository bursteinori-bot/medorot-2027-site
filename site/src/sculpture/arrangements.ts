// Curated sculpture arrangements: the three poster originals plus approved recombinations built from the same parts.
// Recombinations connect parts at their attach points, so a swapped head always lands on the neck it replaced.
import { PARTS, original, type PartId, type Placement } from './parts'

export type Arrangement = { id: string; name: string; placements: Placement[] }

const at = (id: PartId, x: number, y: number, scale = 1, rot = 0, z = 1): Placement => {
  const p = PARTS[id]
  const w = p.w * p.poster * scale
  const h = (w * p.h) / p.w
  return { part: id, x: x - p.ax * w, y: y - p.ay * h, w, rot, z }
}

// a body with something on its neck and an ornament held at a point given relative to the body image (0..1)
function compose(body: PartId, top: PartId, orn: PartId | null, ornAt: [number, number], opts: { topScale?: number; topRot?: number; ornScale?: number; ornRot?: number; bodyRot?: number } = {}): Placement[] {
  const b = PARTS[body]
  const bw = b.w * b.poster
  const bh = (bw * b.h) / b.w
  const neck: [number, number] = [b.ax * bw, b.ay * bh]
  const out = [
    { part: body, x: 0, y: 0, w: bw, rot: opts.bodyRot ?? 0, z: 1 },
    at(top, neck[0], neck[1] + bh * 0.04, opts.topScale ?? 1, opts.topRot ?? 0, 2),
  ]
  if (orn) out.push(at(orn, ornAt[0] * bw, ornAt[1] * bh, opts.ornScale ?? 1, opts.ornRot ?? 0, 3))
  return out
}

export const ARRANGEMENTS: Arrangement[] = [
  { id: 'yellow', name: 'היצור הצהוב, כמו בפוסטר', placements: original('yellow') },
  { id: 'cream', name: 'היצור השנהב, כמו בפוסטר', placements: original('cream') },
  { id: 'pink', name: 'היצור הוורוד, כמו בפוסטר', placements: original('pink') },
  { id: 'antler-dancer', name: 'רקדן הקרניים', placements: compose('cream_part0', 'yellow_part2', 'pink_part0', [0.5, 0.12], { topScale: 0.78, ornScale: 0.9, ornRot: -18 }) },
  { id: 'bird-watcher', name: 'הציפור המתבוננת', placements: compose('yellow_part1', 'cream_part2', 'yellow_part0', [0.2, 0.62], { topScale: 0.92, topRot: -6, ornScale: 0.85 }) },
  { id: 'crowned-wings', name: 'המכונף המוכתר', placements: [...original('pink').filter((p) => p.part !== 'pink_part0'), at('yellow_part2', 2724 * 0.78, 2642 * 0.07, 0.36, 14, 0), at('cream_part1', 2724 * 0.36, 2642 * 0.48, 0.8, -30, 3)] },
  { id: 'two-heads', name: 'שני דורות', placements: compose('cream_part0', 'cream_part2', 'cream_part1', [0.86, 0.1], { topScale: 0.95, topRot: 4, ornRot: 20 }) },
  { id: 'reader', name: 'הקורא', placements: compose('yellow_part1', 'yellow_part2', 'cream_part1', [0.12, 0.5], { topScale: 0.82, topRot: -8, ornRot: -40 }) },
]

// Fit an arrangement into a stage of the given aspect (w/h); returns placements in % of the stage.
export type StagePlacement = Placement & { h: number }
export function fit(placements: Placement[], aspect: number, margin = 0.06): StagePlacement[] {
  const boxes = placements.map((p) => ({ ...p, h: (p.w * PARTS[p.part].h) / PARTS[p.part].w }))
  const x0 = Math.min(...boxes.map((b) => b.x))
  const y0 = Math.min(...boxes.map((b) => b.y))
  const x1 = Math.max(...boxes.map((b) => b.x + b.w))
  const y1 = Math.max(...boxes.map((b) => b.y + b.h))
  const W = 1000
  const H = 1000 / aspect
  const s = Math.min((W * (1 - 2 * margin)) / (x1 - x0), (H * (1 - 2 * margin)) / (y1 - y0))
  const ox = (W - (x1 - x0) * s) / 2
  const oy = (H - (y1 - y0) * s) / 2
  return boxes.map((b) => ({
    ...b,
    x: ((ox + (b.x - x0) * s) / W) * 100,
    y: ((oy + (b.y - y0) * s) / H) * 100,
    w: ((b.w * s) / W) * 100,
    h: ((b.h * s) / H) * 100,
  }))
}

// Swap one part for the next compatible one, keeping the attach point where it was.
const CYCLE: Record<string, PartId[]> = {
  top: ['yellow_part2', 'cream_part2'],
  body: ['yellow_part1', 'cream_part0'],
  orn: ['yellow_part0', 'cream_part1', 'pink_part0'],
}
export function swapPart(placements: Placement[], id: PartId): Placement[] {
  const p = PARTS[id]
  const ring = CYCLE[p.role]
  if (!ring) return placements
  const used = new Set(placements.map((q) => q.part))
  const next = ring.slice(ring.indexOf(id) + 1).concat(ring.slice(0, ring.indexOf(id))).find((c) => !used.has(c))
  if (!next) return placements
  return placements.map((q) => {
    if (q.part !== id) return q
    const scale = q.w / (p.w * p.poster)
    const h = (q.w * p.h) / p.w
    return at(next, q.x + p.ax * q.w, q.y + p.ay * h, scale, q.rot, q.z)
  })
}
