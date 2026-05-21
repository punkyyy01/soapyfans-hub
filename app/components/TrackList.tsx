'use client'

import { useState } from 'react'
import YoutubeModal from './YoutubeModal'

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

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export default function TrackList({ tracks }: Props) {
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; title: string } | null>(null)

  return (
    <>
      <ol className="divide-y divide-[var(--border-subtle)]/50">
        {tracks.map((track) => {
          const videoId = sanitizeYoutubeId(track.youtube_video_id)
          return (
            <li
              key={track.id}
              className="group flex items-center gap-5 px-5 py-4 transition-colors hover:bg-[var(--bg-elevated)]/60"
            >
              <span className="w-8 shrink-0 text-right font-display text-2xl font-bold tabular-nums text-[var(--accent-amber)] opacity-70 group-hover:opacity-100">
                {(track.track_number ?? 0).toString().padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate font-display text-[1.05rem] font-medium leading-snug text-[var(--text-primary)]">
                  {track.title}
                </span>
              </div>
              {videoId ? (
                <button
                  onClick={() => setActiveVideo({ videoId, title: track.title })}
                  className="shrink-0 rounded-full border border-[var(--border-strong)] px-3 py-1 text-[0.58rem] uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
                >
                  Watch
                </button>
              ) : (
                <span className="shrink-0" aria-hidden />
              )}
              <span className="shrink-0 text-right text-[0.7rem] tabular-nums text-[var(--text-muted)]">
                {track.duration_ms != null ? formatDuration(track.duration_ms) : ''}
              </span>
            </li>
          )
        })}
      </ol>

      {activeVideo && (
        <YoutubeModal
          videoId={activeVideo.videoId}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  )
}
