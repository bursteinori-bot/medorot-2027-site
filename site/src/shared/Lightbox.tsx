import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { track } from '../analytics'
import { img, type Photo } from '../content'
import { useLang } from '../i18n/lang'

// Full-screen photo viewer: arrows / swipe / Esc, focus kept inside while open and returned on close.
// `trackAs` names the space in the statistics (the Hebrew name, so the stored data doesn't depend on the language)
export function Lightbox({ photos, index, onIndex, onClose, title, trackAs }: { photos: Photo[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; title: string; trackAs?: string }) {
  const { dir, t: d } = useLang()
  const t = d.lightbox
  const rtl = dir === 'rtl'
  const closeBtn = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(null)
  const open = index !== null

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    track('photo_open', { space: trackAs ?? title })
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // the arrow pointing in the reading direction moves forward (left in Hebrew, right in English)
      if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) onIndex((index! + 1) % photos.length)
      if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) onIndex((index! - 1 + photos.length) % photos.length)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      ;(opener.current as HTMLElement | null)?.focus?.()
    }
  }, [open, index, photos.length, onClose, onIndex, rtl])

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] bg-black/92 text-white flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between p-4 text-lg">
            <span>{title} · <span className="tabular-nums">{index! + 1}/{photos.length}</span></span>
            <button ref={closeBtn} type="button" onClick={onClose} className="min-h-11 px-4 border border-white/50">{t.close}</button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={index}
                src={img(photos[index!], 2000)}
                alt={photos[index!].alt}
                className="max-h-full max-w-full object-contain"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, i) => {
                  if (i.offset.x < -60) onIndex((index! + 1) % photos.length)
                  if (i.offset.x > 60) onIndex((index! - 1 + photos.length) % photos.length)
                }}
              />
            </AnimatePresence>
            <button type="button" aria-label={t.prev} onClick={() => onIndex((index! - 1 + photos.length) % photos.length)} className="absolute start-2 top-1/2 -translate-y-1/2 size-12 text-3xl bg-black/40 border border-white/40">{rtl ? '›' : '‹'}</button>
            <button type="button" aria-label={t.next} onClick={() => onIndex((index! + 1) % photos.length)} className="absolute end-2 top-1/2 -translate-y-1/2 size-12 text-3xl bg-black/40 border border-white/40">{rtl ? '‹' : '›'}</button>
          </div>
          <p className="p-4 text-base text-white/85 text-center">{photos[index!].alt}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
