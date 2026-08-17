'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

interface Photo {
  src: string
  alt: string
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<number | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (active === null) return
      const total = photos.length
      if (e.key === 'Escape') setActive(null)
      if (e.key === 'ArrowRight') setActive((p) => (p !== null ? (p + 1) % total : null))
      if (e.key === 'ArrowLeft') setActive((p) => (p !== null ? (p - 1 + total) % total : null))
    },
    [active, photos.length],
  )

  useEffect(() => {
    if (active === null) return
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [active, handleKeyDown])

  return (
    <>
      {/* ── Photo Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View photo ${i + 1} of ${photos.length}`}
            className="group relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300 ease-out hover:border-[var(--border-strong)] focus-ring"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            {/* Subtle bottom vignette */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </button>
        ))}
      </div>

      {/* ── Lightbox Dialog ─────────────────────────────────── */}
      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs sm:p-6"
          onClick={() => setActive(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close photo viewer"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
          >
            ✕
          </button>

          {/* Prev / Next Controls */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((p) => (p !== null ? (p - 1 + photos.length) % photos.length : null))
                }}
                className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/90 text-sm text-[var(--text-secondary)] backdrop-blur transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring cursor-pointer sm:left-8"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((p) => (p !== null ? (p + 1) % photos.length : null))
                }}
                className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/90 text-sm text-[var(--text-secondary)] backdrop-blur transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring cursor-pointer sm:right-8"
              >
                →
              </button>
            </>
          )}

          {/* Active Image Frame */}
          <figure
            className="relative aspect-[3/4] w-[min(90vw,480px)] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[active].src}
              alt={photos[active].alt}
              fill
              sizes="(max-width: 768px) 90vw, 480px"
              className="object-cover object-top"
              priority
            />
          </figure>

          {/* Image Counter */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-4 py-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)] backdrop-blur-xs">
            {active + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}

