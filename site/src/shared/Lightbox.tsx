import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { track } from '../analytics'
import { img, type Photo } from '../content'

// Full-screen photo viewer: arrows / swipe / Esc, focus kept inside while open and returned on close.
export function Lightbox({ photos, index, onIndex, onClose, title }: { photos: Photo[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; title: string }) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(null)
  const open = index !== null

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    track('photo_open', { space: title })
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // RTL: the left arrow moves forward
      if (e.key === 'ArrowLeft') onIndex((index! + 1) % photos.length)
      if (e.key === 'ArrowRight') onIndex((index! - 1 + photos.length) % photos.length)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      ;(opener.current as HTMLElement | null)?.focus?.()
    }
  }, [open, index, photos.length, onClose, onIndex])

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] bg-black/92 text-white flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between p-4 text-lg">
            <span>{title} · <span className="tabular-nums">{index! + 1}/{photos.length}</span></span>
            <button ref={closeBtn} type="button" onClick={onClose} className="min-h-11 px-4 border border-white/50">סגירה ×</button>
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
            <button type="button" aria-label="התמונה הקודמת" onClick={() => onIndex((index! - 1 + photos.length) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 size-12 text-3xl bg-black/40 border border-white/40">›</button>
            <button type="button" aria-label="התמונה הבאה" onClick={() => onIndex((index! + 1) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 size-12 text-3xl bg-black/40 border border-white/40">‹</button>
          </div>
          <p className="p-4 text-base text-white/85 text-center">{photos[index!].alt}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
