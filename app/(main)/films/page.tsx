import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  getPersonCombinedCredits,
  normalizeCredit,
  sortByDateDesc,
  type NormalizedCredit,
} from '@/utils/tmdb'
import { getSophieWikidataCredits } from '@/utils/wikidata'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildCollectionPageSchema, serializeJsonLd } from '@/utils/schema'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import SectionHeader from '@/components/ui/SectionHeader'
import FilmographySearch from '@/components/media/FilmographySearch'

const FILMOGRAPHY_DESCRIPTION =
  "Sophie Thatcher's complete filmography and TV credits — films, series, and on-screen work, organized by release chronology."

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Filmography',
  description: FILMOGRAPHY_DESCRIPTION,
  alternates: { canonical: '/films' },
  openGraph: {
    title: 'Filmography · Sophie Thatcher',
    description: FILMOGRAPHY_DESCRIPTION,
    url: '/films',
    type: 'website',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'Filmography · Sophie Thatcher',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filmography · Sophie Thatcher',
    description: FILMOGRAPHY_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

function yearSpan(credits: NormalizedCredit[]): string | null {
  const years = credits
    .map((c) => Number(c.year))
    .filter((n) => Number.isFinite(n))
  if (years.length === 0) return null
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? `${min}` : `${min} — ${max}`
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function BeyondSkeleton() {
  return (
    <section className="mt-24 pb-32">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-[var(--bg-elevated)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--bg-elevated)]/60" />
        ))}
      </div>
    </section>
  )
}

async function WikidataSection({ tmdbTitles }: { tmdbTitles: string[] }) {
  const wikidataCredits = await getSophieWikidataCredits().catch(() => [])

  const tmdbTitlesSet = new Set(tmdbTitles.map(normalizeTitle))
  const beyondCredits = wikidataCredits.filter(
    (c) => !tmdbTitlesSet.has(normalizeTitle(c.title)),
  )

  if (beyondCredits.length === 0) return null

  return (
    <section id="beyond" className="mt-24 scroll-mt-28 pb-32">
      <SectionHeader
        kicker="Stage · Music · Appearances"
        title="Beyond the Screen"
        action={
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {beyondCredits.length} {beyondCredits.length === 1 ? 'credit' : 'credits'}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {beyondCredits.map((c) => (
          <div
            key={c.wikidataId}
            className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]"
          >
            <div>
              <p className="font-display text-base font-medium leading-snug text-[var(--text-primary)]">
                {c.title}
              </p>
              <p className="mt-1 text-xs italic text-[var(--text-muted)]">
                {c.character ? `as ${c.character}` : 'Special appearance'}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-xs text-metadata">
              <span>{c.year ?? '—'}</span>
              {c.mediaType && (
                <span className="rounded-full bg-[var(--accent-amber-dim)] px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]/30">
                  {c.mediaType}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function FilmsPage() {
  const credits = await getPersonCombinedCredits().catch(() => ({ id: 0, cast: [], crew: [] }))

  const seen = new Set<string>()
  const all: NormalizedCredit[] = []
  for (const c of credits.cast) {
    const key = `${c.media_type}:${c.id}`
    if (seen.has(key)) continue
    seen.add(key)
    all.push(normalizeCredit(c))
  }

  const films = all
    .filter((c) => c.mediaType === 'movie' && c.date)
    .sort(sortByDateDesc)

  const tv = all
    .filter((c) => c.mediaType === 'tv' && c.date)
    .sort(sortByDateDesc)

  const undatedFilms = all.filter((c) => c.mediaType === 'movie' && !c.date)
  const undatedTv = all.filter((c) => c.mediaType === 'tv' && !c.date)

  const filmList = [...films, ...undatedFilms]
  const tvList = [...tv, ...undatedTv]

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-24 sm:pt-28">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildCollectionPageSchema({
              name: 'Filmography · Sophie Thatcher',
              description: FILMOGRAPHY_DESCRIPTION,
              path: '/films',
            }),
          ),
        }}
      />

      <PageContainer size="default">
        {/* ── Page Header ─────────────────────────────────────── */}
        <PageHeader
          eyebrow="Archive Index · Screen Credits"
          title="Filmography"
          description="A curated catalog of Sophie Thatcher's feature films, television series, and on-screen work, organized by release chronology."
          meta={
            <>
              <span>
                <strong className="font-medium text-[var(--text-primary)]">
                  {filmList.length.toString().padStart(2, '0')}
                </strong>{' '}
                Feature Films
              </span>
              <span>
                <strong className="font-medium text-[var(--text-primary)]">
                  {tvList.length.toString().padStart(2, '0')}
                </strong>{' '}
                Television Series
              </span>
              {yearSpan(all) && (
                <span>
                  Timeline <strong className="font-medium text-[var(--text-primary)]">{yearSpan(all)}</strong>
                </span>
              )}
              <span className="hidden sm:inline">
                Order · <span className="font-medium text-[var(--accent-amber)]">Most recent first</span>
              </span>
            </>
          }
          actions={
            <nav
              aria-label="Jump to archival section"
              className="flex flex-wrap items-center gap-2"
            >
              <a
                href="#films"
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs uppercase tracking-[0.14em] font-mono text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-amber)] hover:text-[var(--text-primary)] focus-ring"
              >
                Films ↓
              </a>
              <a
                href="#television"
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs uppercase tracking-[0.14em] font-mono text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-forest)] hover:text-[var(--text-primary)] focus-ring"
              >
                Television ↓
              </a>
              <a
                href="#beyond"
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1 text-xs uppercase tracking-[0.14em] font-mono text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)] focus-ring"
              >
                Beyond ↓
              </a>
            </nav>
          }
        />

        {/* ── Search Bar & Filtered Catalog ───────────────────── */}
        <FilmographySearch filmList={filmList} tvList={tvList} />

        {/* ── Beyond the Screen (Wikidata) ────────────────────── */}
        <Suspense fallback={<BeyondSkeleton />}>
          <WikidataSection tmdbTitles={all.map((c) => c.title)} />
        </Suspense>
      </PageContainer>
    </main>
  )
}
