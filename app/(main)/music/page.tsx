import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient, getUser } from '@/utils/supabase/server'
import { getMovieDetails, getTmdbImageUrl } from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildCollectionPageSchema, buildMusicReleaseSchema, serializeJsonLd } from '@/utils/schema'
import TrackList from '@/app/components/TrackList'
import MusicReviewForm from '@/app/components/MusicReviewForm'
import Reveal from '@/app/components/Reveal'
import Link from 'next/link'

const MUSIC_DESCRIPTION =
  "Sophie Thatcher's music — debut EP, singles, soundtracks, and tracklists, with reviews from fans. Fan-made, unofficial, not affiliated with Sophie Thatcher."

export const metadata: Metadata = {
  title: 'Music',
  description: MUSIC_DESCRIPTION,
  alternates: { canonical: '/music' },
  openGraph: {
    title: 'Music · Sophie Thatcher',
    description: MUSIC_DESCRIPTION,
    url: '/music',
    type: 'music.playlist',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'Music · Sophie Thatcher',
      },
    ],
  },
  twitter: {
    title: 'Music · Sophie Thatcher',
    description: MUSIC_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

type TrackRow = {
  id: string
  title: string
  duration_ms: number | null
  track_number: number | null
  youtube_video_id: string | null
}

type ReleaseWithTracks = {
  id: string
  title: string
  release_type: string
  release_date: string | null
  cover_art_url: string | null
  spotify_url: string | null
  bandcamp_url: string | null
  twitter_url: string | null
  description: string | null
  tracks: TrackRow[]
}

type MusicReviewWithProfile = {
  id: string
  user_id: string
  release_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
}

const TYPE_LABEL: Record<string, string> = {
  ep: 'EP',
  single: 'Single',
  soundtrack: 'Soundtrack',
  album: 'Album',
}

const HERETIC_TMDB_ID = 1087388

const SOPHIE_QUOTES: Record<string, { quote: string; attribution: string }> = {
  'Pivot & Scrape': {
    quote: 'The imagery and lyrics were inspired by dreams I kept having about throwing myself into glass. It felt guttural and like a strong juxtaposition with the dreaminess of the sound.',
    attribution: 'Sophie Thatcher, 2024',
  },
  "Knockin' on Heaven's Door": {
    quote: 'The cover feels very melancholic and feminine, more dreamy and atmospheric.',
    attribution: 'Sophie Thatcher',
  },
}

function safeExternalUrl(raw: string | null, allowedHosts: string[]): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!allowedHosts.includes(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

function formatReleaseDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function MusicPage({ searchParams }: Props) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [user, releasesResult, hereticResult] = await Promise.all([
    getUser(),
    supabase
      .from('releases')
      .select(
        'id, title, release_type, release_date, cover_art_url, spotify_url, bandcamp_url, twitter_url, description, tracks(id, title, duration_ms, track_number, youtube_video_id), music_reviews(id, user_id, release_id, rating, content, created_at, deleted_at, profiles(username, display_name))',
      )
      .order('release_date', { ascending: false }),
    getMovieDetails(HERETIC_TMDB_ID).catch(() => null),
  ])

  const heroBackdropUrl = hereticResult?.backdrop_path
    ? getTmdbImageUrl(hereticResult.backdrop_path, 'w1280')
    : null

  if (releasesResult.error) {
    console.error('[music page] releases query error:', releasesResult.error)
  }

  const rawData = releasesResult.data ?? []
  const releaseList: ReleaseWithTracks[] = rawData.map((r) => ({
    id: r.id,
    title: r.title,
    release_type: r.release_type,
    release_date: r.release_date,
    cover_art_url: r.cover_art_url,
    spotify_url: r.spotify_url,
    bandcamp_url: r.bandcamp_url,
    twitter_url: r.twitter_url,
    description: r.description,
    tracks: ((r.tracks ?? []) as TrackRow[]).sort(
      (a, b) => (a.track_number ?? 999) - (b.track_number ?? 999),
    ),
  }))

  const allReviews: MusicReviewWithProfile[] = rawData
    .flatMap((r) => ((r as { music_reviews?: MusicReviewWithProfile[] }).music_reviews ?? []))
    .filter((r) => r.deleted_at === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const releaseSchemas = releaseList.map((release) =>
    buildMusicReleaseSchema({
      ...release,
      reviews: allReviews.filter((r) => r.release_id === release.id),
    }),
  )

  return (
    <main className="bg-[var(--bg-base)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildCollectionPageSchema({
              name: 'Music · Sophie Thatcher',
              description: MUSIC_DESCRIPTION,
              path: '/music',
            }),
          ),
        }}
      />
      {releaseSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <section className="relative h-[60vh] min-h-[380px] overflow-hidden">
        {heroBackdropUrl && (
          <Image
            src={heroBackdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.65)] to-[rgba(8,7,4,0.35)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.4)] to-transparent" />
        {!heroBackdropUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(232,137,12,0.07)] via-transparent to-[var(--bg-base)]" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end pb-16 pt-28">
          <div className="mx-auto max-w-7xl px-6 sm:px-10">
            <Reveal immediate stagger={0.1} y={24}>
              <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
                Sophie Thatcher
              </p>
              <h1 className="mt-4 font-display text-[clamp(3rem,8vw,6rem)] font-semibold leading-[0.92] tracking-tight text-[var(--text-primary)]">
                The Sound of Her
              </h1>
              <p className="mt-6 max-w-xl leading-relaxed text-[var(--text-secondary)] text-pretty">
                Debut EP. A film credit cover. A soundtrack. Music that sits in the same space as her acting — quiet, precise, slightly unsettling.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-6 pb-32 sm:px-10">
        {error && (
          <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {releasesResult.error && (
          <p className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)]/40 px-5 py-4 text-sm text-[var(--text-secondary)]">
            We couldn’t load releases right now.{' '}
            <Link
              href="/"
              className="font-medium uppercase tracking-[0.18em] text-[var(--accent-gold)] underline-offset-4 hover:underline"
            >
              Back to home →
            </Link>
          </p>
        )}

        {releaseList.length === 0 && !releasesResult.error && (
          <p className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/30 px-5 py-4 text-sm text-[var(--text-secondary)]">
            No releases yet — check back soon.
          </p>
        )}

        {releaseList.map((release) => {
          const reviews = allReviews.filter((r) => r.release_id === release.id)
          const userReview = user ? reviews.find((r) => r.user_id === user.id) : undefined
          const typeLabel = TYPE_LABEL[release.release_type] ?? release.release_type
          const spotifyUrl = safeExternalUrl(release.spotify_url, ['open.spotify.com', 'spotify.com'])
          const bandcampUrl = safeExternalUrl(release.bandcamp_url, ['bandcamp.com'])
          const twitterUrl = safeExternalUrl(release.twitter_url, ['x.com', 'twitter.com'])

          return (
            <section key={release.id} className="scroll-mt-24">
              <Reveal stagger={0.08}>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="rounded-full border border-[var(--accent-amber)]/40 px-3 py-0.5 text-[0.6rem] uppercase tracking-[0.28em] text-[var(--accent-amber)]">
                        {typeLabel}
                      </span>
                      <span className="text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        {formatReleaseDate(release.release_date)}
                      </span>
                    </div>
                    <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
                      {release.title}
                    </h2>
                  </div>

                </div>

                {release.description && (
                  <p className="mt-6 max-w-2xl leading-relaxed text-[var(--text-secondary)] text-pretty">
                    {release.description}
                  </p>
                )}

                {(spotifyUrl || bandcampUrl || twitterUrl) && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {spotifyUrl && (
                      <a
                        href={spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-lg border border-[#1DB954]/25 bg-[rgba(29,185,84,0.08)] px-5 py-3 transition-all hover:border-[#1DB954]/60 hover:bg-[rgba(29,185,84,0.15)]"
                      >
                        <div className="text-left">
                          <p className="text-[0.52rem] uppercase tracking-[0.3em] text-[#1DB954]/70">Stream on</p>
                          <p className="text-sm font-semibold text-[#1DB954]">Spotify</p>
                        </div>
                        <span className="ml-1 text-[#1DB954]/60 transition-transform group-hover:translate-x-1">→</span>
                      </a>
                    )}
                    {bandcampUrl && (
                      <a
                        href={bandcampUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-lg border border-[#1DA0C3]/25 bg-[rgba(29,160,195,0.08)] px-5 py-3 transition-all hover:border-[#1DA0C3]/60 hover:bg-[rgba(29,160,195,0.15)]"
                      >
                        <div className="text-left">
                          <p className="text-[0.52rem] uppercase tracking-[0.3em] text-[#1DA0C3]/70">Buy on</p>
                          <p className="text-sm font-semibold text-[#1DA0C3]">Bandcamp</p>
                        </div>
                        <span className="ml-1 text-[#1DA0C3]/60 transition-transform group-hover:translate-x-1">→</span>
                      </a>
                    )}
                    {twitterUrl && (
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)]/60 px-5 py-3 transition-all hover:border-[var(--accent-amber)]/50 hover:bg-[var(--bg-elevated)]"
                      >
                        <div className="text-left">
                          <p className="text-[0.52rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">Follow</p>
                          <p className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--accent-gold)]">@sophiebthatcher</p>
                        </div>
                        <span className="ml-1 text-[var(--text-muted)] transition-transform group-hover:translate-x-1">→</span>
                      </a>
                    )}
                  </div>
                )}

                {SOPHIE_QUOTES[release.title] && (
                  <blockquote className="relative my-8 border-l-2 border-[var(--accent-amber)]/60 pl-6">
                    <p className="font-display text-lg italic leading-relaxed text-[var(--text-secondary)] text-pretty">
                      &ldquo;{SOPHIE_QUOTES[release.title].quote}&rdquo;
                    </p>
                    <cite className="mt-3 block text-[0.62rem] not-italic uppercase tracking-[0.32em] text-[var(--accent-amber)]">
                      — {SOPHIE_QUOTES[release.title].attribution}
                    </cite>
                  </blockquote>
                )}
              </Reveal>

              {release.tracks.length > 0 && (
                <div className="mt-8">
                  <p className="mb-3 text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
                    Tracklist · {release.tracks.length}{' '}
                    {release.tracks.length === 1 ? 'track' : 'tracks'}
                  </p>
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 py-2">
                    <TrackList tracks={release.tracks} />
                  </div>
                </div>
              )}

              <div className="mt-14 space-y-8">
                <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-5">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
                      The Fan Floor
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                      Reviews
                    </h3>
                  </div>
                  <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    {reviews.length.toString().padStart(2, '0')}{' '}
                    {reviews.length === 1 ? 'voice' : 'voices'}
                  </span>
                </div>

                {user ? (
                  <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-6 backdrop-blur">
                    <MusicReviewForm
                      releaseId={release.id}
                      existingReview={
                        userReview
                          ? { id: userReview.id, rating: userReview.rating, content: userReview.content }
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
                    to leave a review.
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
                            <span
                              className="text-[var(--accent-gold)]"
                              aria-label={`${review.rating} of 5 stars`}
                            >
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
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
