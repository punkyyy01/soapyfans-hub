'use client'

interface Props {
  videoId: string
  title: string
  onClose: () => void
}

export default function YoutubeModal({ videoId, title, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[var(--accent-amber)]">
            {title}
          </p>
          <button
            onClick={onClose}
            aria-label="Close video"
            className="text-xl leading-none text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black ring-1 ring-[var(--border-strong)]">
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
