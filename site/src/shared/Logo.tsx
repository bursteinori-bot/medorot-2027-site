import { asset } from '../content'

// The official logo, from the festival's .ai file (vector, unchanged). `invert` gives the white version on dark grounds.
export function Logo({ mark = false, invert = false, className = '' }: { mark?: boolean; invert?: boolean; className?: string }) {
  return (
    <img
      src={asset(`brand/${mark ? 'logo-mark' : 'logo'}.svg`)}
      alt={mark ? 'סמל פסטיבל מדורות' : 'פסטיבל מדורות · Festival Medorot'}
      className={`block h-auto ${className}`}
      style={invert ? { filter: 'invert(1)' } : undefined}
      draggable={false}
    />
  )
}
