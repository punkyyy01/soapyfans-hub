import type { Metadata } from 'next'
import { getMovieDetails, getTmdbImageUrl, getWatchProvidersForCountry } from '@/utils/tmdb'
import WhereToWatch from '@/app/components/WhereToWatch'
import MediaDetailTabs from '@/app/components/MediaDetailTabs'
import { createClient, getUser } from '@/utils/supabase/server'
import { buildMovieSchema, serializeJsonLd } from '@/utils/schema'
import ReviewForm from '@/app/components/ReviewForm'
import Reveal from '@/app/components/Reveal'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
      ? `${film.overview.slice(0, 200)}${film.overview.length > 200 ? '…' : ''} · A Sophie Thatcher credit on SoapyFans Hub — fan-made, unofficial.`
      : `${titleWithYear} — a Sophie Thatcher film credit on SoapyFans Hub. Fan-made, unofficial, not affiliated with Sophie Thatcher.`
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

export default async function FilmDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { error } = await searchParams
  const tmdbId = Number(id)

  if (!Number.isFinite(tmdbId) || tmdbId <= 0) notFound()

  const supabase = await createClient()

  const film = await getMovieDetails(tmdbId).catch(() => null)
  if (!film) notFound()

  const [user, { data: dbFilm }] = await Promise.all([
    getUser(),
    supabase
      .from('films')
      .select('id, reviews(id, user_id, rating, content, created_at, deleted_at, profiles(username, display_name))')
      .eq('tmdb_id', tmdbId)
      .maybeSingle(),
  ])

  const poster = getTmdbImageUrl(film.poster_path, 'w500')
  const backdrop = getTmdbImageUrl(film.backdrop_path, 'w1280')
  const releaseYear = film.release_date ? Number(film.release_date.slice(0, 4)) : null

  const reviews: ReviewWithProfile[] = ((dbFilm?.reviews ?? []) as ReviewWithProfile[])
    .filter((r) => r.deleted_at === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : undefined

  const movieSchema = buildMovieSchema({
    tmdbId,
    title: film.title,
    overview: film.overview,
    releaseDate: film.release_date,
    posterUrl: poster,
    genres: film.genres,
    runtime: film.runtime,
    reviews,
  })

  return (
    <main className="relative bg-[var(--bg-base)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(movieSchema) }}
      />
      <section className="relative h-[420px] sm:h-[480px] w-full overflow-hidden grain">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_22%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.55)] to-[rgba(8,7,4,0.2)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.3)] to-transparent" />
      </section>

      <section className="relative z-10 mx-auto -mt-6 max-w-6xl px-6 pt-4 sm:-mt-8 sm:px-10">
        <Link
          href="/films"
          className="group inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Back to the index
        </Link>
        <Reveal immediate stagger={0.1} y={28}>
          <p className="mt-2 text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
            {releaseYear ?? '—'}
            {film.runtime ? ` · ${film.runtime} min` : ''}
            {film.status ? ` · ${film.status}` : ''}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.8rem)] font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)] text-balance">
            {film.title}
          </h1>
          {film.tagline && (
            <p className="mt-5 max-w-2xl font-display text-lg italic text-[var(--text-secondary)] text-pretty sm:text-xl">
              “{film.tagline}”
            </p>
          )}
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-32 pt-10 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="mt-6 overflow-hidden rounded-md bg-[var(--bg-elevated)] ring-1 ring-[var(--border-strong)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
              {poster ? (
                <Image
                  src={poster}
                  alt={film.title}
                  width={500}
                  height={750}
                  className="w-full"
                />
              ) : (
                <div className="flex h-[420px] items-center justify-center font-display italic text-[var(--text-muted)]">
                  Poster missing.
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4 text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span>TMDB rating</span>
                <span className="text-[var(--accent-gold)]">
                  ★ {film.vote_average.toFixed(1)} / 10
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span>Release date</span>
                <span className="text-[var(--text-secondary)]">
                  {film.release_date || '—'}
                </span>
              </div>
              {film.runtime && (
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <span>Runtime</span>
                  <span className="text-[var(--text-secondary)]">{film.runtime} min</span>
                </div>
              )}
            </div>

            <WhereToWatch providers={getWatchProvidersForCountry(film.watchProvidersByCountry)} />
          </aside>

          <div className="space-y-16 pt-10 lg:pt-12">
            <Reveal immediate stagger={0.1}>
              <p className="font-display text-[1.35rem] font-medium leading-relaxed text-[var(--text-primary)] text-pretty sm:text-2xl">
                {film.overview || 'No synopsis yet.'}
              </p>
            </Reveal>

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

            <section className="space-y-10">
              <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-5">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
                    Fan notes
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Reviews
                  </h2>
                </div>
                <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  {reviews.length.toString().padStart(2, '0')}{' '}
                  {reviews.length === 1 ? 'voice' : 'voices'}
                </span>
              </div>

              {error && (
                <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              {user ? (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-6 backdrop-blur">
                  <ReviewForm
                    tmdbId={tmdbId}
                    title={film.title}
                    releaseYear={releaseYear}
                    posterPath={film.poster_path}
                    overview={film.overview}
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
                <p className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/40 px-5 py-4 text-sm text-[var(--text-secondary)]">
                  <Link
                    href="/login"
                    className="font-medium uppercase tracking-[0.18em] text-[var(--accent-gold)] underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>{' '}
                  to leave a note.
                </p>
              )}

              {reviews.length > 0 ? (
                <ul className="space-y-6">
                  {reviews.map((review) => {
                    const author =
                      review.profiles?.display_name ??
                      review.profiles?.username ??
                      'Anonymous'
                    const isOwn = review.user_id === user?.id
                    return (
                      <li
                        key={review.id}
                        className="group relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]/50 px-6 py-5 transition-colors hover:border-[var(--accent-amber)]/40"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--accent-amber)]/30 bg-[var(--bg-base)] text-xs font-semibold text-[var(--accent-gold)]">
                            {author[0]?.toUpperCase() ?? '?'}
                          </span>
                          <span className="font-display text-base font-medium text-[var(--text-primary)]">
                            {author}
                            {isOwn && (
                              <span className="ml-2 text-[0.6rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                                · you
                              </span>
                            )}
                          </span>
                          <span className="text-[var(--accent-gold)]" aria-label={`${review.rating} of 5 stars`}>
                            {'★'.repeat(review.rating)}
                            <span className="text-[var(--text-muted)]">
                              {'★'.repeat(5 - review.rating)}
                            </span>
                          </span>
                          <span className="ml-auto text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
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
                <p className="text-sm italic text-[var(--text-muted)]">
                  No reviews yet. Be the first one to break the silence.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
