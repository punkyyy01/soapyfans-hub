import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import Reveal from '@/app/components/Reveal'

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
    <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-10">
      <div className="mb-12 flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
            Airwaves · releases
          </p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.6rem)] font-medium leading-[0.95] tracking-[-0.02em] text-[var(--text-primary)]">
            The <span className="italic text-[var(--accent-gold)]">music</span> corner.
          </h2>
        </div>
        <Link
          href="/music"
          className="group inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)]"
        >
          All music
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      {releasesError ? (
        <p className="text-sm italic text-[var(--text-muted)]">
          Music is temporarily unavailable.{' '}
          <Link href="/music" className="text-[var(--accent-gold)] hover:underline underline-offset-4">
            Try the music page →
          </Link>
        </p>
      ) : releases && releases.length > 0 ? (
        <Reveal
          selector="[data-release-card]"
          stagger={0.07}
          y={42}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {releases.map((release) => {
            const typeLabel = RELEASE_TYPE_LABEL[release.release_type] ?? release.release_type
            const year = release.release_date ? release.release_date.slice(0, 4) : null
            return (
              <div key={release.id} data-release-card>
                <Link
                  href="/music"
                  className="group flex h-full flex-col justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-6 transition-all hover:border-[var(--accent-amber)]/50 hover:bg-[var(--bg-elevated)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-[var(--accent-amber)]/40 px-2.5 py-0.5 text-[0.58rem] uppercase tracking-[0.26em] text-[var(--accent-amber)]">
                      {typeLabel}
                    </span>
                    {year && (
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        {year}
                      </span>
                    )}
                  </div>
                  <p className="mt-5 font-display text-xl font-semibold leading-snug tracking-tight text-[var(--text-primary)] text-pretty transition-colors group-hover:text-[var(--accent-gold)]">
                    {release.title}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-amber)]">
                    Listen
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </div>
            )
          })}
        </Reveal>
      ) : (
        <p className="text-sm italic text-[var(--text-muted)]">
          Music coming soon.{' '}
          <Link href="/music" className="text-[var(--accent-gold)] hover:underline underline-offset-4">
            Visit the music page →
          </Link>
        </p>
      )}
    </section>
  )
}
