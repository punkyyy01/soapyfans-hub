import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import { getReleasesWithSlugs } from '@/utils/releases'
import { getTmdbImageUrl } from '@/utils/tmdb'

export type TrendingItem = {
  id: string
  mediaType: 'film' | 'music'
  title: string
  imageUrl: string | null
  href: string
  reviewCount: number
  avgRating: number
}

const TRENDING_WINDOW_DAYS = 7
export const TRENDING_LIMIT = 8

type FilmMeta = { tmdb_id: number; title: string; poster_path: string | null }
type MusicMeta = { title: string; cover_art_url: string | null; slug: string }

/**
 * Groups this-window review rows by title and ranks by review count (tie
 * broken by average rating). Pure -- no DB access -- so it's tested
 * directly in tests/trending.test.ts; getTrendingThisWeek() below just
 * supplies the rows and metadata maps from Supabase.
 */
export function aggregateTrending(
  filmRows: { film_id: string; rating: number }[],
  musicRows: { release_id: string; rating: number }[],
  filmMeta: Map<string, FilmMeta>,
  musicMeta: Map<string, MusicMeta>,
): TrendingItem[] {
  function group<T>(rows: T[], keyOf: (row: T) => string, ratingOf: (row: T) => number) {
    const agg = new Map<string, { count: number; sum: number }>()
    for (const row of rows) {
      const key = keyOf(row)
      const cur = agg.get(key) ?? { count: 0, sum: 0 }
      cur.count += 1
      cur.sum += ratingOf(row)
      agg.set(key, cur)
    }
    return agg
  }

  const filmAgg = group(filmRows, (r) => r.film_id, (r) => r.rating)
  const musicAgg = group(musicRows, (r) => r.release_id, (r) => r.rating)

  const items: TrendingItem[] = []

  for (const [filmId, agg] of filmAgg) {
    const meta = filmMeta.get(filmId)
    if (!meta) continue
    items.push({
      id: filmId,
      mediaType: 'film',
      title: meta.title,
      imageUrl: getTmdbImageUrl(meta.poster_path, 'w342'),
      href: `/films/${meta.tmdb_id}`,
      reviewCount: agg.count,
      avgRating: agg.sum / agg.count,
    })
  }

  for (const [releaseId, agg] of musicAgg) {
    const meta = musicMeta.get(releaseId)
    if (!meta) continue
    items.push({
      id: releaseId,
      mediaType: 'music',
      title: meta.title,
      imageUrl: meta.cover_art_url,
      href: `/music/${meta.slug}`,
      reviewCount: agg.count,
      avgRating: agg.sum / agg.count,
    })
  }

  return items.sort((a, b) => b.reviewCount - a.reviewCount || b.avgRating - a.avgRating)
}

/**
 * Titles with the most reviews (tie: best average rating) in the last 7
 * days. Same for every visitor, so cached across requests -- this is a
 * small fan site, aggregating in JS over a handful of rows rather than
 * writing SQL/RPC aggregation, matching how the rest of this codebase
 * crosses small datasets (profile_favorites enrichment, the admin
 * dashboard's reviewCountMap).
 */
export const getTrendingThisWeek = unstable_cache(
  async (): Promise<TrendingItem[]> => {
    const supabase = createPublicClient()
    const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 86_400_000).toISOString()

    const [filmReviewsRes, musicReviewsRes, releases] = await Promise.all([
      supabase.from('reviews').select('film_id, rating').is('deleted_at', null).gte('created_at', since),
      supabase.from('music_reviews').select('release_id, rating').is('deleted_at', null).gte('created_at', since),
      getReleasesWithSlugs(),
    ])

    const filmRows = filmReviewsRes.data ?? []
    const musicRows = musicReviewsRes.data ?? []
    const filmIds = [...new Set(filmRows.map((r) => r.film_id))]

    const filmsRes =
      filmIds.length > 0
        ? await supabase.from('films').select('id, tmdb_id, title, poster_path').in('id', filmIds)
        : { data: [] as { id: string; tmdb_id: number; title: string; poster_path: string | null }[] }

    const filmMeta = new Map(
      (filmsRes.data ?? []).map((f) => [f.id, { tmdb_id: f.tmdb_id, title: f.title, poster_path: f.poster_path }]),
    )
    const musicMeta = new Map(
      releases.map((r) => [r.id, { title: r.title, cover_art_url: r.cover_art_url, slug: r.slug }]),
    )

    return aggregateTrending(filmRows, musicRows, filmMeta, musicMeta).slice(0, TRENDING_LIMIT)
  },
  ['trending-this-week'],
  { revalidate: 1800 },
)
