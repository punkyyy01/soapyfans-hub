import Image from 'next/image'
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
    .select('id, title, release_type, release_date, cover_art_url')
    .order('release_date', { ascending: false })
    .limit(4)
  return result
}

export default async function MusicSection() {
  const { data: releases, error: releasesError } = await fetchReleases()

  const [featuredRelease, ...otherReleases] = releases ?? []

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
          <span>Explore full discography</span>
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
      ) : featuredRelease ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
          {/* Main Featured Release */}
          <Link
            href="/music"
            className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] focus-ring sm:flex-row sm:gap-6 sm:p-7"
          >
            <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md bg-[var(--bg-elevated)] sm:w-48">
              {featuredRelease.cover_art_url ? (
                <Image
                  src={featuredRelease.cover_art_url}
                  alt={featuredRelease.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center font-display italic text-[var(--text-muted)]">
                  <span className="text-2xl mb-1 text-[var(--text-muted)]">♫</span>
                  <span className="text-xs">Artwork</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-1 flex-col justify-between sm:mt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="music" size="sm">
                    {RELEASE_TYPE_LABEL[featuredRelease.release_type] ?? featuredRelease.release_type}
                  </Badge>
                  {featuredRelease.release_date && (
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {featuredRelease.release_date.slice(0, 4)}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-2xl font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)] sm:text-3xl">
                  {featuredRelease.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Sophie Thatcher · Debut Studio EP
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-metadata">
                <span className="text-[var(--text-muted)]">5 tracks recorded in Asheville</span>
                <span className="inline-flex items-center gap-1 font-medium text-[var(--accent-amber)] transition-transform duration-200 group-hover:translate-x-1">
                  Listen &amp; lyrics →
                </span>
              </div>
            </div>
          </Link>

          {/* Secondary Discography Records */}
          <div className="flex flex-col justify-between divide-y divide-[var(--border-subtle)] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-5">
            <p className="pb-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Archival Discography
            </p>

            {otherReleases.length > 0 ? (
              otherReleases.map((release) => (
                <Link
                  key={release.id}
                  href="/music"
                  className="group flex items-center justify-between py-3.5 transition-colors hover:bg-[var(--bg-elevated)]/40 focus-ring rounded-sm px-2 -mx-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-display text-base font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)]">
                      {release.title}
                    </p>
                    <p className="font-mono text-[0.68rem] text-[var(--text-muted)]">
                      {RELEASE_TYPE_LABEL[release.release_type] ?? release.release_type}
                      {release.release_date ? ` · ${release.release_date.slice(0, 4)}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-amber)]">
                    →
                  </span>
                </Link>
              ))
            ) : (
              <div className="py-4 text-xs italic text-[var(--text-muted)]">
                More releases coming soon.
              </div>
            )}

            <div className="pt-3">
              <Link
                href="/music"
                className="inline-flex items-center gap-1 font-mono text-xs text-[var(--accent-amber)] hover:underline focus-ring"
              >
                <span>View complete discography index</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
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

