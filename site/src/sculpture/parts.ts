// The sculpture-part library, cut from the original poster PSD (tools/export_parts.py). Every part is a real masked
// artifact photo from the festival's own artwork; nothing here is generated.
import data from '../../public/assets/creatures/parts.json'
import { asset } from '../content'

export type Role = 'top' | 'body' | 'orn' | 'figure'
export type PartId = string

export type Part = {
  id: PartId
  label: string
  role: Role
  w: number // image size in px (web asset)
  h: number
  poster: number // px -> poster units (each creature sits at a different scale on the poster)
  ax: number // attach point, 0..1 within the image: where a part of the neighbouring role connects
  ay: number
}

type Raw = { w: number; h: number; parts: { file: string; x: number; y: number; w: number; h: number; z: number }[] }
const RAW = data as Record<'yellow' | 'cream' | 'pink', Raw>

// width of each creature's smart object on its 2835px poster artboard
const POSTER_W = { yellow: 1669, cream: 2080, pink: 2724 }

const META: Record<string, { label: string; role: Role; ax: number; ay: number }> = {
  yellow_part2: { label: 'כתר הקרניים', role: 'top', ax: 0.47, ay: 0.96 },
  yellow_part1: { label: 'גוף הברונזה עם העין', role: 'body', ax: 0.47, ay: 0.08 },
  yellow_part0: { label: 'תלתן הכסף', role: 'orn', ax: 0.5, ay: 0.5 },
  cream_part2: { label: 'ראש הציפור השחור', role: 'top', ax: 0.55, ay: 0.95 },
  cream_part0: { label: 'גוף ירוק עם ידיים מורמות', role: 'body', ax: 0.43, ay: 0.06 },
  cream_part1: { label: 'סיכת הכסף', role: 'orn', ax: 0.5, ay: 0.5 },
  pink_part1: { label: 'היצור המכונף', role: 'figure', ax: 0.5, ay: 0.5 },
  pink_part0: { label: 'צלב הכסף', role: 'orn', ax: 0.5, ay: 0.5 },
}

export const PARTS: Record<PartId, Part> = {}
for (const [creature, raw] of Object.entries(RAW) as ['yellow' | 'cream' | 'pink', Raw][]) {
  for (const p of raw.parts) {
    PARTS[p.file] = { id: p.file, w: p.w, h: p.h, poster: POSTER_W[creature] / raw.w, ...META[p.file] }
  }
}
export const PART_IDS = Object.keys(PARTS)
export const partSrc = (id: PartId) => asset(`creatures/${id}.webp`)

// The three creatures exactly as composed on the posters, in poster units.
export type Placement = { part: PartId; x: number; y: number; w: number; rot: number; z: number }
export function original(creature: 'yellow' | 'cream' | 'pink'): Placement[] {
  const raw = RAW[creature]
  const s = POSTER_W[creature] / raw.w
  return raw.parts.map((p) => ({ part: p.file, x: p.x * s, y: p.y * s, w: p.w * s, rot: 0, z: p.z }))
}
