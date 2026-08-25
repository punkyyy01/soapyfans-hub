import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import { getReleasesWithSlugs } from '@/utils/releases'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { isVisibleReview } from '@/utils/reviews'
import { getTmdbImageUrl } from '@/utils/tmdb'

export type PulseFeedItem = {
  id: string
  kind: 'review' | 'music_review' | 'news'
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string
  authorId: string | null
  authorName: string | null
  rating: number | null
  timestamp: string
}

// Pool fetched per source before ranking/slicing for display -- large
// enough that a followed author's review from a day ago still beats an
// unfollowed one from an hour ago after rankActivity() re-sorts it.
const FEED_POOL_SIZE = 40

type FilmReviewRow = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
  films: { tmdb_id: number; title: string; poster_path: string | null } | null
}

type MusicReviewRow = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
  release_id: string
}

type NewsRow = {
  id: string
  title: string
  description: string | null
  source_name: string
  image_url: string | null
  published_at: string
}

/**
 * Recent reviews (film + music) and approved news, normalized into one
 * shape and already sorted by recency. Identical for every visitor, so
 * it's cached across requests -- personalization (boosting followed
 * authors) happens afterwards, per request, via rankActivity() below.
 */
export const getRecentActivityRaw = unstable_cache(
  async (): Promise<PulseFeedItem[]> => {
    const supabase = createPublicClient()
    const [bannedUserIds, filmReviewsRes, musicReviewsRes, newsRes, releases] = await Promise.all([
      getBannedUserIds(),
      supabase
        .from('reviews')
        .select('id, user_id, rating, content, created_at, deleted_at, profiles(username, display_name), films(tmdb_id, title, poster_path)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(FEED_POOL_SIZE),
      supabase
        .from('music_reviews')
        .select('id, user_id, rating, content, created_at, deleted_at, profiles(username, display_name), release_id')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(FEED_POOL_SIZE),
      supabase
        .from('news_items')
        .select('id, title, description, source_name, image_url, published_at')
        .eq('status', 'approved')
        .order('published_at', { ascending: false })
        .limit(FEED_POOL_SIZE),
      getReleasesWithSlugs(),
    ])

    const releaseById = new Map(releases.map((r) => [r.id, r]))

    const filmItems: PulseFeedItem[] = ((filmReviewsRes.data ?? []) as unknown as FilmReviewRow[])
      .filter((r) => isVisibleReview(r, bannedUserIds) && r.films)
      .map((r) => ({
        id: r.id,
        kind: 'review',
        title: r.films!.title,
        subtitle: r.content,
        imageUrl: getTmdbImageUrl(r.films!.poster_path, 'w185'),
        href: `/films/${r.films!.tmdb_id}`,
        authorId: r.user_id,
        authorName: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous Fan',
        rating: r.rating,
        timestamp: r.created_at,
      }))

    const musicItems: PulseFeedItem[] = ((musicReviewsRes.data ?? []) as unknown as MusicReviewRow[])
      .filter((r) => isVisibleReview(r, bannedUserIds) && releaseById.has(r.release_id))
      .map((r) => {
        const release = releaseById.get(r.release_id)!
        return {
          id: r.id,
          kind: 'music_review' as const,
          title: release.title,
          subtitle: r.content,
          imageUrl: release.cover_art_url,
          href: `/music/${release.slug}`,
          authorId: r.user_id,
          authorName: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous Fan',
          rating: r.rating,
          timestamp: r.created_at,
        }
      })

    const newsItems: PulseFeedItem[] = ((newsRes.data ?? []) as NewsRow[]).map((n) => ({
      id: n.id,
      kind: 'news',
      title: n.title,
      subtitle: n.description ?? n.source_name,
      imageUrl: n.image_url ? `/api/news-image/${n.id}` : null,
      href: '/news',
      authorId: null,
      authorName: null,
      rating: null,
      timestamp: n.published_at,
    }))

    return [...filmItems, ...musicItems, ...newsItems].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    )
  },
  ['recent-activity', 'home-preview'],
  { revalidate: 60 },
)

/**
 * Boosts items authored by someone the viewer follows to the top, keeping
 * everything else (including all news, which has no author) in recency
 * order. Pure so it's testable without a DB -- see tests/activity.test.ts.
 */
export function rankActivity(items: PulseFeedItem[], followedIds: Set<string>): PulseFeedItem[] {
  return [...items].sort((a, b) => {
    const aBoost = a.authorId !== null && followedIds.has(a.authorId) ? 1 : 0
    const bBoost = b.authorId !== null && followedIds.has(b.authorId) ? 1 : 0
    if (aBoost !== bBoost) return bBoost - aBoost
    return b.timestamp.localeCompare(a.timestamp)
  })
}
