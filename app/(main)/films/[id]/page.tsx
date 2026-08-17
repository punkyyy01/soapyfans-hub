import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMovieDetails, getTmdbImageUrl, getWatchProvidersForCountry } from '@/utils/tmdb'
import WhereToWatch from '@/components/media/WhereToWatch'
import MediaDetailTabs from '@/components/media/MediaDetailTabs'
import { createClient, getUser } from '@/utils/supabase/server'
import { buildMovieSchema, serializeJsonLd } from '@/utils/schema'
import ReviewForm from '@/components/forms/ReviewForm'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tmdbId = Number(id)
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return {}

  try {
    const film = await getMovieDetails(tmdbId)
    const year = film.release_date ? film.release_date.slice(0, 4) : null
    const titleWithYear = year ? `${film.title} (${year})` : film.title
    const description = film.overview
      ? `${film.overview.slice(0, 200)}${film.overview.length > 200 ? '…' : ''} · A Sophie Thatcher credit on SoapyFans Hub.`
      : `${titleWithYear} — a Sophie Thatcher film credit on SoapyFans Hub.`
    const ogImage = getTmdbImageUrl(film.backdrop_path, 'w1280') ?? getTmdbImageUrl(film.poster_path, 'w780')
    const canonical = `/films/${tmdbId}`

    return {
      title: titleWithYear,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'video.movie',
        title: `${titleWithYear} · Sophie Thatcher`,
        description,
        url: canonical,
        images: ogImage ? [{ url: ogImage, alt: film.title }] : undefined,
        ...(film.release_date ? { releaseDate: film.release_date } : {}),
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
      title: 'Film',
      robots: { index: false, follow: false },
    }
  }
}

type ReviewWithProfile = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
}

function ReviewsSkeleton() {
  return (
    <section className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-[var(--bg-elevated)]" />
      <div className="h-28 animate-pulse rounded-xl bg-[var(--bg-elevated)]/40" />
    </section>
  )
}

async function FilmReviewsSection({
  tmdbId,
  filmTitle,
  releaseYear,
  posterPath,
  overview,
  error,
}: {
  tmdbId: number
  filmTitle: string
  releaseYear: number | null
  posterPath: string | null
  overview: string | null
  error?: string
}) {
  const supabase = await createClient()
  const [user, { data: dbFilm }] = await Promise.all([
    getUser(),
    supabase
      .from('films')
      .select('id, reviews(id, user_id, rating, content, created_at, deleted_at, profiles(username, display_name))')
      .eq('tmdb_id', tmdbId)
      .maybeSingle(),
  ])

  const reviews: ReviewWithProfile[] = ((dbFilm?.reviews ?? []) as ReviewWithProfile[])
    .filter((r) => r.deleted_at === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : undefined

  return (
    <section className="space-y-8">
      <SectionHeader
        kicker="Community Archive"
        title="Fan Reviews"
        action={
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {reviews.length} {reviews.length === 1 ? 'voice' : 'voices'}
          </span>
        }
      />

      {error && (
        <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Review Form or Auth Gate */}
      {user ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 backdrop-blur-xs">
          <ReviewForm
            tmdbId={tmdbId}
            title={filmTitle}
            releaseYear={releaseYear}
            posterPath={posterPath}
            overview={overview}
            existingReview={
              userReview
                ? {
                    id: userReview.id,
                    rating: userReview.rating,
                    content: userReview.content,
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="font-display text-base font-medium text-[var(--text-primary)]">
              Have you watched this title?
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Sign in to rate this film and add your thoughts to the fan archive.
            </p>
          </div>
          <Button href="/login" variant="secondary" size="sm">
            Sign in to review
          </Button>
        </div>
      )}

      {/* Review List */}
      {reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const author =
              review.profiles?.display_name ??
              review.profiles?.username ??
              'Anonymous Fan'
            const isOwn = review.user_id === user?.id
            return (
              <li
                key={review.id}
                className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent-amber)]/40 bg-[var(--bg-card)] font-mono text-xs font-semibold text-[var(--accent-amber)]">
                    {author[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="font-display text-base font-medium text-[var(--text-primary)]">
                    {author}
                    {isOwn && (
                      <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--accent-amber)]">
                        (You)
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-[var(--accent-gold)]" aria-label={`${review.rating} of 5 stars`}>
                    {'★'.repeat(review.rating)}
                    <span className="text-[var(--text-muted)]">
                      {'★'.repeat(5 - review.rating)}
                    </span>
                  </span>
                  <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">
                    {new Date(review.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {review.content && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                    {review.content}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          title="No fan reviews yet"
          description="Be the first person to leave a note and star rating for this entry in the archive."
        />
      )}
    </section>
  )
}

export default async function FilmDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { error } = await searchParams
  const tmdbId = Number(id)

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound()

  const film = await getMovieDetails(tmdbId).catch(() => null)
  if (!film) notFound()

  const poster = getTmdbImageUrl(film.poster_path, 'w500')
  const backdrop = getTmdbImageUrl(film.backdrop_path, 'w1280')
  const releaseYear = film.release_date ? Number(film.release_date.slice(0, 4)) : null

  // Locate Sophie's character in cast
  const sophieCastMember = film.credits.cast.find(
    (c) =>
      c.name.toLowerCase().includes('sophie thatcher') ||
      c.id === 2099307 ||
      c.name.toLowerCase() === 'sophie thatcher',
  )
  const sophieCharacter = sophieCastMember?.character?.trim() || null

  const movieSchema = buildMovieSchema({
    tmdbId,
    title: film.title,
    overview: film.overview,
    releaseDate: film.release_date,
    posterUrl: poster,
    genres: film.genres,
    runtime: film.runtime,
    reviews: [],
  })

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(movieSchema) }}
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
          <Link
            href="/films"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs py-1"
          >
            <span aria-hidden="true">←</span>
            <span>Back to filmography</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="film" size="md">
              Feature Film
            </Badge>
            {releaseYear && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {releaseYear}
              </span>
            )}
            {film.runtime && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                · {film.runtime} min
              </span>
            )}
            {film.status && (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                · {film.status}
              </span>
            )}
          </div>

          <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[0.98] tracking-tight text-[var(--text-primary)] text-balance">
            {film.title}
          </h1>

          {film.tagline && (
            <p className="max-w-2xl font-display text-lg italic text-[var(--text-secondary)] text-pretty sm:text-xl">
              &ldquo;{film.tagline}&rdquo;
            </p>
          )}
        </div>

        {/* ── Dossier Grid (Sidebar + Main Content) ──────────── */}
        <div className="grid gap-10 pb-32 lg:grid-cols-[280px_1fr] lg:gap-14">
          {/* Left Column: Dossier Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Primary Media (Poster) */}
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg">
              {poster ? (
                <Image
                  src={poster}
                  alt={film.title}
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
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-1.5">
              <p className="text-eyebrow">
                Archive Subject
              </p>
              <p className="font-display text-lg font-medium text-[var(--text-primary)]">
                Sophie Thatcher
              </p>
              {sophieCharacter ? (
                <p className="text-xs italic text-[var(--accent-amber)] font-medium">
                  as {sophieCharacter}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  Cast Credit
                </p>
              )}
            </div>

            {/* Factsheet Metadata Table */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">TMDB Rating</span>
                <span className="font-medium text-[var(--accent-gold)]">
                  ★ {film.vote_average ? film.vote_average.toFixed(1) : '—'} / 10
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Release Date</span>
                <span className="text-[var(--text-secondary)]">
                  {film.release_date || '—'}
                </span>
              </div>
              {film.runtime && (
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Runtime</span>
                  <span className="text-[var(--text-secondary)]">{film.runtime} min</span>
                </div>
              )}
              {film.genres && film.genres.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Genres</span>
                  <span className="text-right text-[var(--text-secondary)]">
                    {film.genres.map((g) => g.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Where to Watch */}
            <WhereToWatch providers={getWatchProvidersForCountry(film.watchProvidersByCountry)} />
          </aside>

          {/* Right Column: Main Content */}
          <div className="space-y-14">
            {/* Synopsis */}
            <div className="space-y-3">
              <p className="text-eyebrow">
                Synopsis
              </p>
              <p className="max-w-2xl font-display text-xl font-normal leading-relaxed text-[var(--text-primary)] text-pretty sm:text-2xl">
                {film.overview || 'No synopsis recorded for this title.'}
              </p>
            </div>

            {/* Media Detail Tabs */}
            <MediaDetailTabs
              tmdbId={tmdbId}
              mediaType="movie"
              cast={film.credits.cast}
              crew={film.credits.crew}
              genres={film.genres}
              productionCompanies={film.production_companies}
              productionCountries={film.production_countries}
              spokenLanguages={film.spoken_languages}
              alternativeTitles={film.alternativeTitles}
            />

            {/* Reviews Section */}
            <Suspense fallback={<ReviewsSkeleton />}>
              <FilmReviewsSection
                tmdbId={tmdbId}
                filmTitle={film.title}
                releaseYear={releaseYear}
                posterPath={film.poster_path}
                overview={film.overview}
                error={error}
              />
            </Suspense>
          </div>
        </div>
      </PageContainer>
    </main>
  )
}

