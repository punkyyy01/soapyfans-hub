'use client'

import { useEffect, useCallback, useRef } from 'react'

interface Props {
  videoId: string
  title: string
  onClose: () => void
}

export default function YoutubeModal({ videoId, title, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    closeButtonRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="youtube-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-eyebrow">
              Official Video
            </p>
            <h3 id="youtube-modal-title" className="font-display text-lg font-medium text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close video modal"
            className="rounded-full p-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-[var(--border-subtle)]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </div>
  )
}

