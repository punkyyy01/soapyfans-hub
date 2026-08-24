import type { Metadata } from 'next'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTvDetails, getTmdbImageUrl, getWatchProvidersForCountry } from '@/utils/tmdb'
import { createClient, getUser } from '@/utils/supabase/server'
import WhereToWatch from '@/components/media/WhereToWatch'
import MediaDetailTabs from '@/components/media/MediaDetailTabs'
import WatchlistButton from '@/components/media/WatchlistButton'
import { buildTvSeriesSchema, buildBreadcrumbSchema, serializeJsonLd } from '@/utils/schema'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

// Streamed independently via its own Suspense boundary so a slow watchlist
// lookup never delays the rest of the page (same pattern as
// FilmWatchlistButton in app/(main)/films/[id]/page.tsx).
async function TvWatchlistButton({ tmdbId }: { tmdbId: number }) {
  const [supabase, user] = await Promise.all([createClient(), getUser()])

  const isOnWatchlist = user
    ? Boolean(
        (
          await supabase
            .from('watchlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('tmdb_id', tmdbId)
            .eq('media_type', 'tv')
            .maybeSingle()
        ).data,
      )
    : false

  return (
    <WatchlistButton
      tmdbId={tmdbId}
      mediaType="tv"
      isOnWatchlist={isOnWatchlist}
      isSignedIn={Boolean(user)}
    />
  )
}

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tvId = Number(id)
  if (!Number.isFinite(tvId) || tvId <= 0) return {}

  try {
    const tv = await getTvDetails(tvId)
    const firstYear = tv.first_air_date ? tv.first_air_date.slice(0, 4) : null
    const lastYear = tv.last_air_date ? tv.last_air_date.slice(0, 4) : null
    const yearLabel =
      firstYear && lastYear && firstYear !== lastYear
        ? `${firstYear}–${tv.in_production ? 'present' : lastYear}`
        : firstYear ?? ''
    const titleWithYear = yearLabel ? `${tv.name} (${yearLabel})` : tv.name
    const description = tv.overview
      ? `${tv.overview.slice(0, 200)}${tv.overview.length > 200 ? '…' : ''} · A Sophie Thatcher TV credit on SoapyFans Hub.`
      : `${titleWithYear} — a Sophie Thatcher TV credit on SoapyFans Hub.`
    const ogImage = getTmdbImageUrl(tv.backdrop_path, 'w1280') ?? getTmdbImageUrl(tv.poster_path, 'w780')
    const canonical = `/tv/${tvId}`

    return {
      title: titleWithYear,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'video.tv_show',
        title: `${titleWithYear} · Sophie Thatcher`,
        description,
        url: canonical,
        images: ogImage ? [{ url: ogImage, alt: tv.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${titleWithYear} · Sophie Thatcher`,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
    }
  } catch {
    return {
      title: 'TV',
      robots: { index: false, follow: false },
    }
  }
}

export default async function TvDetailPage({ params }: Props) {
  const { id } = await params
  const tvId = Number(id)

  let tv
  try {
    tv = await getTvDetails(tvId)
  } catch (err: any) {
    if (err?.message?.includes('404')) {
      notFound()
    }
    console.error(`[TvDetailPage] Error loading TV details for tvId ${tvId}:`, err)
    throw new Error('Failed to load TV details from TMDB. Please try again.')
  }
  if (!tv) notFound()

  const poster = getTmdbImageUrl(tv.poster_path, 'w500')
  const backdrop = getTmdbImageUrl(tv.backdrop_path, 'w1280')
  const firstYear = tv.first_air_date ? tv.first_air_date.slice(0, 4) : null
  const lastYear = tv.last_air_date ? tv.last_air_date.slice(0, 4) : null
  const yearLabel =
    firstYear && lastYear && firstYear !== lastYear
      ? `${firstYear} — ${tv.in_production ? 'present' : lastYear}`
      : firstYear ?? '—'

  // Locate Sophie's character in TV cast
  const sophieCastMember = tv.credits?.cast?.find(
    (c) =>
      c.name.toLowerCase().includes('sophie thatcher') ||
      c.id === 2099307 ||
      c.name.toLowerCase() === 'sophie thatcher',
  )
  const sophieCharacter = sophieCastMember?.character?.trim() || null

  const avgRuntime = tv.episode_run_time?.[0] ?? null

  const seriesSchema = buildTvSeriesSchema({
    tmdbId: tvId,
    title: tv.name,
    overview: tv.overview,
    firstAirDate: tv.first_air_date,
    lastAirDate: tv.last_air_date,
    posterUrl: poster,
    genres: tv.genres,
    numberOfSeasons: tv.number_of_seasons,
    numberOfEpisodes: tv.number_of_episodes,
  })

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Filmography', path: '/films' },
    { name: tv.name, path: `/tv/${tvId}` },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(seriesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbItems)) }}
      />

      {/* ── Contained Backdrop Header ───────────────────────── */}
      <section className="relative h-48 w-full overflow-hidden sm:h-64">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%] opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.7)] to-[rgba(8,7,4,0.3)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.5)] to-transparent" />
      </section>

      {/* ── Header Title Block ──────────────────────────────── */}
      <PageContainer size="default" className="relative z-10 -mt-16 sm:-mt-24">
        <div className="mb-10 space-y-4">
          <Breadcrumbs items={breadcrumbItems} />

          <Link
            href="/films#television"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs py-1"
          >
            <span aria-hidden="true">←</span>
            <span>Back to television index</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="tv" size="md">
              Television Series
            </Badge>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {yearLabel}
            </span>
            {tv.number_of_seasons > 0 && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                · {tv.number_of_seasons} {tv.number_of_seasons === 1 ? 'season' : 'seasons'}
              </span>
            )}
            {tv.number_of_episodes > 0 && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                · {tv.number_of_episodes} eps
              </span>
            )}
            {avgRuntime && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                · ~{avgRuntime} min
              </span>
            )}
            {tv.status && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                · {tv.status}
              </span>
            )}
          </div>

          <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[0.98] tracking-tight text-[var(--text-primary)] text-balance">
            {tv.name}
          </h1>

          {tv.tagline && (
            <p className="max-w-2xl font-display text-lg italic text-[var(--text-secondary)] text-pretty sm:text-xl">
              &ldquo;{tv.tagline}&rdquo;
            </p>
          )}
        </div>

        {/* ── Dossier Grid (Sidebar + Main Content) ──────────── */}
        {/* On mobile the two wrappers below become `contents`, so their children
            flatten into this grid and reorder via `order-*` (identity → synopsis →
            cast → secondary details → platforms). At `lg:` they become real boxes
            again and the original two-column sidebar layout is restored untouched. */}
        <div className="grid gap-10 pb-32 lg:grid-cols-[280px_1fr] lg:gap-14">
          {/* Left Column: Dossier Sidebar */}
          <aside className="contents lg:sticky lg:top-24 lg:block lg:self-start lg:space-y-6">
            {/* Primary Media (Poster) */}
            <div className="order-1 relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg">
              {poster ? (
                <Image
                  src={poster}
                  alt={tv.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 280px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center font-display text-sm italic text-[var(--text-muted)]">
                  Poster not available in archive
                </div>
              )}
            </div>

            {/* Sophie Connection Card */}
            <div className="order-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-1.5">
              <p className="text-eyebrow">
                Archive Subject
              </p>
              <p className="font-display text-lg font-medium text-[var(--text-primary)]">
                Sophie Thatcher
              </p>
              {sophieCharacter ? (
                <p className="text-xs italic text-[var(--accent-forest)] font-medium">
                  as {sophieCharacter}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  Series Credit
                </p>
              )}
              <div className="pt-2">
                <Suspense
                  fallback={<div className="h-9 w-full animate-pulse rounded-full bg-[var(--bg-elevated)]" />}
                >
                  <TvWatchlistButton tmdbId={tvId} />
                </Suspense>
              </div>
            </div>

            {/* Factsheet Metadata Table */}
            <div className="order-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">TMDB Rating</span>
                <span className="font-medium text-[var(--accent-gold)]">
                  ★ {tv.vote_average ? tv.vote_average.toFixed(1) : '—'} / 10
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">First Aired</span>
                <span className="text-[var(--text-secondary)]">
                  {tv.first_air_date || '—'}
                </span>
              </div>
              {tv.last_air_date && (
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Last Aired</span>
                  <span className="text-[var(--text-secondary)]">{tv.last_air_date}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Seasons</span>
                <span className="text-[var(--text-secondary)]">{tv.number_of_seasons}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Episodes</span>
                <span className="text-[var(--text-secondary)]">{tv.number_of_episodes}</span>
              </div>
              {tv.networks && tv.networks.length > 0 && (
                <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Network</span>
                  <span className="text-right text-[var(--text-secondary)]">
                    {tv.networks.map((n) => n.name).join(', ')}
                  </span>
                </div>
              )}
              {tv.created_by && tv.created_by.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Created By</span>
                  <span className="text-right text-[var(--text-secondary)]">
                    {tv.created_by.map((c) => c.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Where to Watch */}
            <div className="order-6">
              <WhereToWatch providers={getWatchProvidersForCountry(tv.watchProvidersByCountry)} />
            </div>
          </aside>

          {/* Right Column: Main Content */}
          <div className="contents lg:block lg:space-y-14">
            {/* Synopsis */}
            <div className="order-3 space-y-3">
              <p className="text-eyebrow">
                Synopsis
              </p>
              <p className="max-w-2xl font-display text-xl font-normal leading-relaxed text-[var(--text-primary)] text-pretty sm:text-2xl">
                {tv.overview || 'No synopsis recorded for this title.'}
              </p>
            </div>

            {/* Media Detail Tabs */}
            <div className="order-4">
              <MediaDetailTabs
                tmdbId={tvId}
                mediaType="tv"
                cast={tv.credits.cast}
                crew={tv.credits.crew}
                genres={tv.genres}
                productionCompanies={tv.production_companies}
                productionCountries={tv.production_countries}
                spokenLanguages={tv.spoken_languages}
                alternativeTitles={tv.alternativeTitles}
              />
            </div>

            {/* Television Fan Notes Information */}
            <section className="order-7 space-y-6">
              <SectionHeader
                kicker="Fan Notes"
                title="Television Reviews"
              />
              <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="font-display text-base font-medium text-[var(--text-primary)]">
                    Television reviews coming soon
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    The review floor is currently active across feature films in the archive.
                  </p>
                </div>
                <Button href="/films#films" variant="secondary" size="sm">
                  Browse feature films
                </Button>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </main>
  )
}

