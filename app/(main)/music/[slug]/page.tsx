import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/utils/supabase/server'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { getReleasesWithSlugs } from '@/utils/releases'
import {
  getTotalDuration,
  safeExternalUrl,
  findReleaseBySlug,
  RELEASE_TYPE_LABEL,
  SOPHIE_MUSIC_QUOTES,
} from '@/utils/music'
import { isVisibleReview } from '@/utils/reviews'
import { buildMusicReleaseSchema, buildBreadcrumbSchema, serializeJsonLd } from '@/utils/schema'
import TrackList from '@/components/media/TrackList'
import MusicReviewForm from '@/components/forms/MusicReviewForm'
import ReviewCard from '@/components/social/ReviewCard'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import SafeImage from '@/components/ui/SafeImage'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}

async function findRelease(slug: string) {
  const releases = await getReleasesWithSlugs()
  return findReleaseBySlug(releases, slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const release = await findRelease(slug)
  if (!release) return {}

  const canonical = `/music/${release.slug}`
  const description = release.description
    ? `${release.description.slice(0, 200)}${release.description.length > 200 ? '…' : ''}`
    : `${release.title} — a Sophie Thatcher music release on SoapyFans Hub.`

  return {
    title: release.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'music.album',
      title: `${release.title} · Sophie Thatcher`,
      description,
      url: canonical,
      images: release.cover_art_url ? [{ url: release.cover_art_url, alt: release.title }] : undefined,
      ...(release.release_date ? { releaseDate: release.release_date } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${release.title} · Sophie Thatcher`,
      description,
      images: release.cover_art_url ? [release.cover_art_url] : undefined,
    },
  }
}

function formatReleaseDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

type MusicReviewWithProfile = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
  review_likes: { user_id: string }[]
  review_replies: {
    id: string
    user_id: string
    content: string
    created_at: string
    deleted_at: string | null
    profiles: { username: string | null; display_name: string | null } | null
  }[]
}

export default async function ReleaseDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { error } = await searchParams
  const release = await findRelease(slug)
  if (!release) notFound()

  const supabase = await createClient()
  const [user, { data: reviewRows }, bannedUserIds] = await Promise.all([
    getUser(),
    supabase
      .from('music_reviews')
      .select('id, user_id, rating, content, created_at, deleted_at, profiles(username, display_name), review_likes(user_id), review_replies(id, user_id, content, created_at, deleted_at, profiles(username, display_name))')
      .eq('release_id', release.id)
      .is('deleted_at', null),
    getBannedUserIds(),
  ])

  const reviews = ((reviewRows ?? []) as unknown as MusicReviewWithProfile[])
    .filter((r) => isVisibleReview(r, bannedUserIds))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : undefined

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Music', path: '/music' },
    { name: release.title, path: `/music/${release.slug}` },
  ]

  const releaseSchema = buildMusicReleaseSchema({
    title: release.title,
    release_type: release.release_type,
    release_date: release.release_date,
    cover_art_url: release.cover_art_url,
    description: release.description,
    tracks: release.tracks,
    reviews: reviews.map((r) => ({
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      profiles: r.profiles,
    })),
    path: `/music/${release.slug}`,
  })

  const quoteObj = SOPHIE_MUSIC_QUOTES[release.title]
  const totalDuration = getTotalDuration(release.tracks)
  const typeLabel = RELEASE_TYPE_LABEL[release.release_type] ?? release.release_type
  const spotifyUrl = safeExternalUrl(release.spotify_url, ['open.spotify.com', 'spotify.com'])
  const bandcampUrl = safeExternalUrl(release.bandcamp_url, ['bandcamp.com'])
  const twitterUrl = safeExternalUrl(release.twitter_url, ['x.com', 'twitter.com'])

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-24 sm:pt-28">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(releaseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbItems)) }}
      />

      <PageContainer size="default">
        <div className="mb-10 space-y-4">
          <Breadcrumbs items={breadcrumbItems} />

          <Link
            href="/music"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs py-1"
          >
            <span aria-hidden="true">←</span>
            <span>Back to discography</span>
          </Link>
        </div>

        {error && (
          <p className="mb-10 rounded-xl border border-red-900/40 bg-red-950/40 px-5 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="space-y-14 pb-32">
          {/* ── Release Record ────────────────────────────────── */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 backdrop-blur-xs sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
              {/* Left: Artwork & Release Factsheet */}
              <div className="space-y-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xl">
                  {release.cover_art_url ? (
                    <SafeImage
                      src={release.cover_art_url}
                      alt={release.title}
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

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Artist</span>
                    <span className="font-medium text-[var(--text-primary)]">Sophie Thatcher</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Release Date</span>
                    <span className="text-[var(--text-secondary)]">{formatReleaseDate(release.release_date)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                    <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Tracks</span>
                    <span className="text-[var(--text-secondary)]">
                      {release.tracks.length} {release.tracks.length === 1 ? 'track' : 'tracks'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] uppercase tracking-[0.14em]">Community</span>
                    <span className="font-medium text-[var(--accent-gold)]">
                      {reviews.length} {reviews.length === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                </div>

                {(spotifyUrl || bandcampUrl || twitterUrl) && (
                  <div className="space-y-2 pt-2">
                    <p className="text-eyebrow">Listen &amp; Connect</p>
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

              {/* Right: Title, Overview, Tracklist */}
              <div className="space-y-10">
                <div className="space-y-3">
                  <Badge variant="music" size="md">
                    {typeLabel}
                  </Badge>
                  <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                    {release.title}
                  </h1>
                  {release.description && (
                    <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-xl">
                      {release.description}
                    </p>
                  )}
                </div>

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

                {release.tracks.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-eyebrow">
                      Tracklist · {release.tracks.length} Tracks
                      {totalDuration && ` · ${totalDuration}`}
                    </p>
                    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80">
                      <TrackList tracks={release.tracks} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Community Reviews ──────────────────────────────── */}
          <section className="space-y-6">
            <SectionHeader
              kicker="Fan Floor · Notes &amp; Reviews"
              title="Community Impressions"
              action={
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {reviews.length} {reviews.length === 1 ? 'voice' : 'voices'}
                </span>
              }
            />

            {user ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 backdrop-blur-xs">
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
              <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="font-display text-base font-medium text-[var(--text-primary)]">
                    Have you listened to {release.title}?
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Sign in to rate this release and add your thoughts to the fan archive.
                  </p>
                </div>
                <Button href="/login" variant="secondary" size="sm">
                  Sign in to review
                </Button>
              </div>
            )}

            {reviews.length > 0 ? (
              <ul className="space-y-4">
                {reviews.map((review) => {
                  const likeCount = review.review_likes.filter((l) => !bannedUserIds.has(l.user_id)).length
                  const likedByMe = Boolean(user && review.review_likes.some((l) => l.user_id === user.id))
                  const replies = review.review_replies
                    .filter((r) => r.deleted_at === null && !bannedUserIds.has(r.user_id))
                    .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  return (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      targetType="music_review"
                      currentUserId={user?.id ?? null}
                      isSignedIn={Boolean(user)}
                      redirectTo={`/music/${release.slug}`}
                      likeCount={likeCount}
                      likedByMe={likedByMe}
                      replies={replies}
                    />
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                title="No fan notes yet"
                description="Be the first person to leave a note and star rating for this release."
              />
            )}
          </section>
        </div>
      </PageContainer>
    </main>
  )
}
