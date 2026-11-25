import { asset } from '../content'
import { useT } from '../i18n/lang'

// The official logo, from the festival's .ai file (vector, unchanged). `invert` gives the white version on dark grounds.
export function Logo({ mark = false, invert = false, className = '' }: { mark?: boolean; invert?: boolean; className?: string }) {
  const t = useT().brand
  return (
    <img
      src={asset(`brand/${mark ? 'logo-mark' : 'logo'}.svg`)}
      alt={mark ? t.logoMarkAlt : t.logoAlt}
      className={`block h-auto ${className}`}
      style={invert ? { filter: 'invert(1)' } : undefined}
      draggable={false}
    />
  )
}
