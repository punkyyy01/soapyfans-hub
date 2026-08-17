import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import Badge from '@/components/ui/Badge'

const RELEASE_TYPE_LABEL: Record<string, string> = {
  ep: 'EP',
  single: 'Single',
  soundtrack: 'Soundtrack',
  album: 'Album',
}

async function fetchReleases() {
  const supabase = await createClient()
  const result = await supabase
    .from('releases')
    .select('id, title, release_type, release_date')
    .order('release_date', { ascending: false })
    .limit(3)
  return result
}

export default async function MusicSection() {
  const { data: releases, error: releasesError } = await fetchReleases()

  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-10 sm:pb-32">
      <div className="mb-10 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-eyebrow">
            Original Music &amp; Discography
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Music Releases
          </h2>
        </div>

        <Link
          href="/music"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-sm py-1"
        >
          <span>Explore music</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {releasesError ? (
        <p className="text-sm italic text-[var(--text-muted)]">
          Music releases are temporarily unavailable.{' '}
          <Link href="/music" className="text-[var(--accent-amber)] hover:underline">
            Visit the music page →
          </Link>
        </p>
      ) : releases && releases.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {releases.map((release) => {
            const typeLabel = RELEASE_TYPE_LABEL[release.release_type] ?? release.release_type
            const year = release.release_date ? release.release_date.slice(0, 4) : null
            return (
              <Link
                key={release.id}
                href="/music"
                className="group relative flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] focus-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="music" size="sm">
                    {typeLabel}
                  </Badge>
                  {year && (
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {year}
                    </span>
                  )}
                </div>

                <div className="my-6 space-y-1">
                  <h3 className="font-display text-xl font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)]">
                    {release.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Sophie Thatcher
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-metadata">
                  <span className="text-[var(--text-muted)]">Stream &amp; Tracklist</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--accent-amber)] transition-transform duration-200 group-hover:translate-x-1">
                    Listen →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-sm italic text-[var(--text-muted)]">
          Music coming soon.{' '}
          <Link href="/music" className="text-[var(--accent-amber)] hover:underline">
            Visit the music page →
          </Link>
        </p>
      )}
    </section>
  )
}

