'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface Photo {
  src: string
  alt: string
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    if (active === null) return
    document.body.style.overflow = 'hidden'
    const total = photos.length
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      if (e.key === 'ArrowRight') setActive((p) => (p !== null ? (p + 1) % total : null))
      if (e.key === 'ArrowLeft') setActive((p) => (p !== null ? (p - 1 + total) % total : null))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active, photos.length])

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            data-photo
            onClick={() => setActive(i)}
            aria-label={`View photo ${i + 1} of ${photos.length}`}
            className="group relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-md bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)] transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber)] hover:ring-[var(--accent-amber)]/50 hover:shadow-[0_16px_48px_-12px_rgba(232,137,12,0.45)]"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-all duration-500 ease-out [filter:grayscale(0.15)_contrast(1.05)_brightness(0.92)] group-hover:scale-[1.05] group-hover:[filter:grayscale(0)_contrast(1.05)_brightness(1)]"
            />
            {/* Hover overlay */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            {/* Bottom shine line — same as FilmCard */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-[var(--accent-amber)] to-transparent opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,7,4,0.96)] p-4"
          onClick={() => setActive(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActive(null)}
            aria-label="Close photo viewer"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-elevated)]/80 text-lg text-[var(--text-muted)] backdrop-blur transition-colors hover:text-[var(--accent-amber)]"
          >
            ✕
          </button>

          {/* Prev / Next */}
          {photos.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((p) => (p !== null ? (p - 1 + photos.length) % photos.length : null))
                }}
                className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-elevated)]/80 text-[var(--text-muted)] backdrop-blur transition-colors hover:text-[var(--accent-amber)]"
              >
                ←
              </button>
              <button
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((p) => (p !== null ? (p + 1) % photos.length : null))
                }}
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-elevated)]/80 text-[var(--text-muted)] backdrop-blur transition-colors hover:text-[var(--accent-amber)]"
              >
                →
              </button>
            </>
          )}

          {/* Active image */}
          <figure
            className="relative aspect-[3/4] w-[min(90vw,440px)] overflow-hidden rounded-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[active].src}
              alt={photos[active].alt}
              fill
              sizes="(max-width: 768px) 90vw, 440px"
              className="object-cover object-top"
              priority
            />
          </figure>

          {/* Counter */}
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.45em] text-[var(--text-muted)]">
            {active + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}
