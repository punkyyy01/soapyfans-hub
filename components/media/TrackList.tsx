'use client'

import { useRef, useState } from 'react'
import YoutubeModal from './YoutubeModal'
import { formatDuration } from '@/utils/music'

type Track = {
  id: string
  title: string
  duration_ms: number | null
  track_number: number | null
  youtube_video_id: string | null
}

interface Props {
  tracks: Track[]
}

function sanitizeYoutubeId(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null
}

export default function TrackList({ tracks }: Props) {
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; title: string } | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <>
      <ol className="divide-y divide-[var(--border-subtle)]">
        {tracks.map((track) => {
          const videoId = sanitizeYoutubeId(track.youtube_video_id)
          const trackNum = track.track_number != null ? track.track_number.toString().padStart(2, '0') : '—'

          return (
            <li
              key={track.id}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--bg-elevated)]/50 sm:gap-6 sm:px-6"
            >
              {/* Track Number */}
              <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-amber)]">
                {trackNum}
              </span>

              {/* Track Title */}
              <div className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-medium leading-snug text-[var(--text-primary)]">
                  {track.title}
                </span>
              </div>

              {/* Optional Video Action */}
              {videoId && (
                <button
                  type="button"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget
                    setActiveVideo({ videoId, title: track.title })
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--text-primary)] focus-ring cursor-pointer"
                >
                  <span aria-hidden="true">▶</span>
                  <span>Video</span>
                </button>
              )}

              {/* Duration */}
              {track.duration_ms != null && (
                <span className="shrink-0 text-right font-mono text-xs tabular-nums text-[var(--text-muted)]">
                  {formatDuration(track.duration_ms)}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {activeVideo && (
        <YoutubeModal
          videoId={activeVideo.videoId}
          title={activeVideo.title}
          onClose={() => {
            setActiveVideo(null)
            triggerRef.current?.focus()
          }}
        />
      )}
    </>
  )
}

