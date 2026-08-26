import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { getTmdbImageUrl } from '@/utils/tmdb'
import { getReleasesWithSlugs } from '@/utils/releases'

// Shared by page.tsx and opengraph-image.tsx. Next.js's page-export
// validation rejects any named export from page.tsx other than a fixed
// allowlist (metadata, generateMetadata, generateStaticParams, ...), so
// this lookup logic has to live in its own module rather than being
// exported from the page itself.

export type ReplyRow = {
  id: string
  user_id: string
  content: string
  created_at: string
  deleted_at: string | null
  profiles: { username: string | null; display_name: string | null } | null
}

export type FilmReviewRow = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  films: { title: string; poster_path: string | null; tmdb_id: number } | null
  profiles: { username: string | null; display_name: string | null } | null
  review_likes: { user_id: string }[]
  review_replies: ReplyRow[]
}

export type MusicReviewRow = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  deleted_at: string | null
  release_id: string
  releases: { title: string; cover_art_url: string | null } | null
  profiles: { username: string | null; display_name: string | null } | null
  review_likes: { user_id: string }[]
  review_replies: ReplyRow[]
}

const REVIEW_SELECT =
  'id, user_id, rating, content, created_at, deleted_at, films(title, poster_path, tmdb_id), profiles(username, display_name), review_likes(user_id), review_replies(id, user_id, content, created_at, deleted_at, profiles(username, display_name))'

const MUSIC_REVIEW_SELECT =
  'id, user_id, rating, content, created_at, deleted_at, release_id, releases(title, cover_art_url), profiles(username, display_name), review_likes(user_id), review_replies(id, user_id, content, created_at, deleted_at, profiles(username, display_name))'

// A review permalink id could belong to either the film reviews table or
// the music reviews table -- there's no shared id space, so this tries
// `reviews` first, then falls back to `music_reviews`. React `cache()`
// dedupes this across generateMetadata and the page component within one
// request (opengraph-image.tsx is rendered as a separate request, so it
// gets its own cache instance -- one extra DB round trip, same tradeoff
// every opengraph-image.tsx in this repo makes).
export const findReviewById = cache(async (id: string) => {
  const supabase = await createClient()

  const { data: filmReview } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (filmReview) return { targetType: 'review' as const, review: filmReview as unknown as FilmReviewRow }

  const { data: musicReview } = await supabase
    .from('music_reviews')
    .select(MUSIC_REVIEW_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (musicReview) return { targetType: 'music_review' as const, review: musicReview as unknown as MusicReviewRow }

  return null
})

export type FoundReview = NonNullable<Awaited<ReturnType<typeof findReviewById>>>

export async function resolveEntry(found: FoundReview) {
  if (found.targetType === 'review') {
    const film = found.review.films
    return {
      title: film?.title ?? 'Unknown film',
      posterUrl: film ? getTmdbImageUrl(film.poster_path, 'w500') : null,
      entryHref: film ? `/films/${film.tmdb_id}` : '/films',
    }
  }
  const release = found.review.releases
  const slug = release
    ? (await getReleasesWithSlugs()).find((r) => r.id === found.review.release_id)?.slug ?? null
    : null
  return {
    title: release?.title ?? 'Unknown release',
    posterUrl: release?.cover_art_url ?? null,
    entryHref: slug ? `/music/${slug}` : '/music',
  }
}
