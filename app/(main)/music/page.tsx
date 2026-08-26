import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildCollectionPageSchema, serializeJsonLd } from '@/utils/schema'
import { isVisibleReview } from '@/utils/reviews'
import TrackList from '@/components/media/TrackList'
import {
  getTotalDuration,
  safeExternalUrl,
  RELEASE_TYPE_LABEL as TYPE_LABEL,
  SOPHIE_MUSIC_QUOTES as SOPHIE_QUOTES,
} from '@/utils/music'
import { getReleasesWithSlugs, type ReleaseWithSlug } from '@/utils/releases'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import SafeImage from '@/components/ui/SafeImage'

const MUSIC_DESCRIPTION =
  "Sophie Thatcher's music archive — debut EP 'Pivot & Scrape', cinematic singles, soundtrack appearances, and tracklists with community notes."

export const revalidate = 3600

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
    card: 'summary_large_image',
    title: 'Music · Sophie Thatcher',
    description: MUSIC_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

// Only what's needed to compute a per-release review count on the index --
// full review bodies (content/rating/author) render on /music/[slug] only.
type MusicReviewSummary = {
  id: string
  user_id: string
  release_id: string
  deleted_at: string | null
}

function formatReleaseDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function MusicPage({ searchParams }: Props) {
  const { error } = await searchParams
  const supabase = await createClient()

  const [releasesOrNull, reviewsResult, bannedUserIds] = await Promise.all([
    getReleasesWithSlugs().catch(() => null),
    supabase.from('music_reviews').select('id, user_id, release_id, deleted_at').is('deleted_at', null),
    getBannedUserIds(),
  ])

  if (reviewsResult.error) {
    console.error('[music page] reviews query error:', reviewsResult.error)
  }

  const releasesError = releasesOrNull === null
  const releaseList: ReleaseWithSlug[] = releasesOrNull ?? []

  const allReviews: MusicReviewSummary[] = (
    (reviewsResult.data ?? []) as unknown as MusicReviewSummary[]
  ).filter((r) => isVisibleReview(r, bannedUserIds))

  // Determine the primary/featured release
  const featuredRelease =
    releaseList.find(
      (r) => r.release_type === 'ep' || r.release_type === 'album' || r.title.includes('Pivot'),
    ) ?? releaseList[0]

  const otherReleases = releaseList.filter((r) => r.id !== featuredRelease?.id)

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-24 sm:pt-28">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
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

      <PageContainer size="default">
        {/* ── 01 — Music Page Header ──────────────────────────── */}
        <PageHeader
          eyebrow="Archive Index · Discography"
          title="Music"
          description="Debut EP, cinematic singles, and soundtrack contributions — Sophie Thatcher's sonic archive sits in the same emotional register as her acting: quiet, textured, and slightly unsettling."
          meta={
            <>
              <span>
                <strong className="font-medium text-[var(--text-primary)]">
                  {releaseList.length.toString().padStart(2, '0')}
                </strong>{' '}
                Releases Recorded
              </span>
              <span>
                Primary Format · <strong className="font-medium text-[var(--text-primary)]">Debut EP</strong>
              </span>
              <span>
                Artist · <strong className="font-medium text-[var(--accent-amber)]">Sophie Thatcher</strong>
              </span>
              <span className="hidden sm:inline">
                Labels · <span className="text-[var(--text-secondary)]">Self-released / A24 Music</span>
              </span>
            </>
          }
        />

        {error && (
          <p className="mb-10 rounded-xl border border-red-900/40 bg-red-950/40 px-5 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {releasesError && (
          <div className="mb-12">
            <EmptyState
              title="Music archive unavailable"
              description="Could not load releases from the database at this moment."
              action={
                <Button href="/" variant="secondary" size="sm">
                  Return to Home
                </Button>
              }
            />
          </div>
        )}

        {releaseList.length === 0 && !releasesError && (
          <div className="mb-12">
            <EmptyState
              title="No music releases recorded yet"
              description="Music titles will appear here once cataloged in the archive."
            />
          </div>
        )}

        <div className="space-y-28 pb-32">
          {/* ── 02 — Featured Release: Primary Work ───────────── */}
          {featuredRelease && (
            <section id="featured-release" className="scroll-mt-28 space-y-8">
              <SectionHeader
                kicker="Primary Archival Work"
                title="Featured Release"
                action={
                  <Badge variant="music" size="md">
                    {TYPE_LABEL[featuredRelease.release_type] ?? featuredRelease.release_type}
                  </Badge>
                }
              />

              {(() => {
                const reviews = allReviews.filter((r) => r.release_id === featuredRelease.id)
                const quoteObj = SOPHIE_QUOTES[featuredRelease.title]
                const totalDuration = getTotalDuration(featuredRelease.tracks)
                const spotifyUrl = safeExternalUrl(featuredRelease.spotify_url, [
                  'open.spotify.com',
                  'spotify.com',
                ])
                const bandcampUrl = safeExternalUrl(featuredRelease.bandcamp_url, ['bandcamp.com'])
                const twitterUrl = safeExternalUrl(featuredRelease.twitter_url, [
                  'x.com',
                  'twitter.com',
                ])

                return (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 backdrop-blur-xs sm:p-10">
                    <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
                      {/* Left: Artwork & Release Factsheet */}
                      <div className="space-y-6">
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xl">
                          {featuredRelease.cover_art_url ? (
                            <SafeImage
                              src={featuredRelease.cover_art_url}
                              alt={featuredRelease.title}
                              fill
                              priority
                              sizes="(max-width: 1024px) 100vw, 340px"
                              className="object-cover"
                              fallback={
                                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center font-display italic text-[var(--text-muted)]">
                                  <span className="text-3xl mb-2 text-[var(--accent-amber)]/40">♫</span>
                                  <span>Artwork not available</span>
                                </div>
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center font-display italic text-[var(--text-muted)]">
                              <span className="text-3xl mb-2 text-[var(--accent-amber)]/40">♫</span>
                              <span>Artwork not available</span>
                            </div>
                          )}
                        </div>

                        {/* Metadata Box */}
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-2.5 font-mono text-xs">
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                            <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Artist</span>
                            <span className="font-medium text-[var(--text-primary)]">Sophie Thatcher</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                            <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Release Date</span>
                            <span className="text-[var(--text-secondary)]">
                              {formatReleaseDate(featuredRelease.release_date)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                            <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Tracks</span>
                            <span className="text-[var(--text-secondary)]">
                              {featuredRelease.tracks.length} {featuredRelease.tracks.length === 1 ? 'track' : 'tracks'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Community</span>
                            <span className="font-medium text-[var(--accent-gold)]">
                              {reviews.length} {reviews.length === 1 ? 'note' : 'notes'}
                            </span>
                          </div>
                        </div>

                        {/* External Streaming Access */}
                        {(spotifyUrl || bandcampUrl || twitterUrl) && (
                          <div className="space-y-2 pt-2">
                            <p className="text-eyebrow">
                              Listen &amp; Connect
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {spotifyUrl && (
                                <a
                                  href={spotifyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-ring"
                                >
                                  <span className="text-[#1DB954]" aria-hidden="true">●</span>
                                  <span>Spotify</span>
                                  <span className="text-[var(--text-muted)]" aria-hidden="true">↗</span>
                                </a>
                              )}
                              {bandcampUrl && (
                                <a
                                  href={bandcampUrl}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-ring"
                                >
                                  <span className="text-[#1DA0C3]" aria-hidden="true">●</span>
                                  <span>Bandcamp</span>
                                  <span className="text-[var(--text-muted)]" aria-hidden="true">↗</span>
                                </a>
                              )}
                              {twitterUrl && (
                                <a
                                  href={twitterUrl}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-ring"
                                >
                                  <span>@sophiebthatcher</span>
                                  <span className="text-[var(--text-muted)]" aria-hidden="true">↗</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Title, Overview, Tracklist & Reviews */}
                      <div className="space-y-10">
                        <div className="space-y-3">
                          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                            <Link
                              href={`/music/${featuredRelease.slug}`}
                              className="transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
                            >
                              {featuredRelease.title}
                            </Link>
                          </h2>
                          {featuredRelease.description && (
                            <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-xl">
                              {featuredRelease.description}
                            </p>
                          )}
                        </div>

                        {/* Editorial Quote Annotation */}
                        {quoteObj && (
                          <blockquote className="rounded-xl border-l-2 border-[var(--accent-amber)] bg-[var(--bg-surface)]/80 p-5 pl-6">
                            <p className="font-display text-base italic leading-relaxed text-[var(--text-secondary)] text-pretty">
                              &ldquo;{quoteObj.quote}&rdquo;
                            </p>
                            <cite className="mt-3 block font-mono text-[0.68rem] not-italic uppercase tracking-[0.16em] text-[var(--accent-amber)]">
                              — {quoteObj.attribution}
                            </cite>
                          </blockquote>
                        )}

                        {/* Tracklist */}
                        {featuredRelease.tracks.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-eyebrow">
                              Tracklist · {featuredRelease.tracks.length} Tracks
                              {totalDuration && ` · ${totalDuration}`}
                            </p>
                            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80">
                              <TrackList tracks={featuredRelease.tracks} />
                            </div>
                          </div>
                        )}

                        {/* Reviews Summary — full reviews + review form live on the release page */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6">
                          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            {reviews.length} community {reviews.length === 1 ? 'note' : 'notes'}
                          </p>
                          <Button href={`/music/${featuredRelease.slug}`} variant="secondary" size="sm">
                            Read reviews &amp; rate this release →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </section>
          )}

          {/* ── 03 — Other Releases / Singles & Soundtracks ──── */}
          {otherReleases.length > 0 && (
            <section id="other-releases" className="scroll-mt-28 space-y-10">
              <SectionHeader
                kicker="Singles · Soundtracks · Appearances"
                title="Other Releases"
                action={
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {otherReleases.length} {otherReleases.length === 1 ? 'entry' : 'entries'}
                  </span>
                }
              />

              <div className="space-y-12">
                {otherReleases.map((release) => {
                  const reviews = allReviews.filter((r) => r.release_id === release.id)
                  const typeLabel = TYPE_LABEL[release.release_type] ?? release.release_type
                  const quoteObj = SOPHIE_QUOTES[release.title]
                  const spotifyUrl = safeExternalUrl(release.spotify_url, [
                    'open.spotify.com',
                    'spotify.com',
                  ])
                  const bandcampUrl = safeExternalUrl(release.bandcamp_url, ['bandcamp.com'])
                  const twitterUrl = safeExternalUrl(release.twitter_url, ['x.com', 'twitter.com'])

                  return (
                    <article
                      key={release.id}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 backdrop-blur-xs sm:p-8 space-y-8"
                    >
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="music" size="sm">
                              {typeLabel}
                            </Badge>
                            <span className="font-mono text-xs text-[var(--text-muted)]">
                              {formatReleaseDate(release.release_date)}
                            </span>
                          </div>
                          <h3 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
                            <Link
                              href={`/music/${release.slug}`}
                              className="transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
                            >
                              {release.title}
                            </Link>
                          </h3>
                        </div>

                        {/* Streaming Buttons */}
                        {(spotifyUrl || bandcampUrl || twitterUrl) && (
                          <div className="flex flex-wrap gap-2 sm:self-start">
                            {spotifyUrl && (
                              <a
                                href={spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
                              >
                                <span className="text-[#1DB954]" aria-hidden="true">●</span>
                                <span>Spotify ↗</span>
                              </a>
                            )}
                            {bandcampUrl && (
                              <a
                                href={bandcampUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
                              >
                                <span className="text-[#1DA0C3]" aria-hidden="true">●</span>
                                <span>Bandcamp ↗</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {release.description && (
                        <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                          {release.description}
                        </p>
                      )}

                      {quoteObj && (
                        <blockquote className="rounded-xl border-l-2 border-[var(--accent-amber)] bg-[var(--bg-surface)]/80 p-4 pl-5">
                          <p className="font-display text-sm italic leading-relaxed text-[var(--text-secondary)]">
                            &ldquo;{quoteObj.quote}&rdquo;
                          </p>
                          <cite className="mt-2 block font-mono text-[0.65rem] not-italic uppercase tracking-[0.16em] text-[var(--accent-amber)]">
                            — {quoteObj.attribution}
                          </cite>
                        </blockquote>
                      )}

                      {/* Tracklist if available */}
                      {release.tracks.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80">
                          <TrackList tracks={release.tracks} />
                        </div>
                      )}

                      {/* Reviews Summary — full reviews + review form live on the release page */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6">
                        <p className="text-eyebrow">
                          Fan Notes ({reviews.length})
                        </p>
                        <Link
                          href={`/music/${release.slug}`}
                          className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--accent-amber)] hover:underline focus-ring rounded-xs"
                        >
                          View release &amp; reviews →
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </PageContainer>
    </main>
  )
}

