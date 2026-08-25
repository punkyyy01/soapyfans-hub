import { createClient } from '@/utils/supabase/server'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { isVisibleReview, reviewAuthorProfilePath } from '@/utils/reviews'
import { getReleasesWithSlugs } from '@/utils/releases'
import { escapeIlike } from '@/utils/profile'
import { getPersonCombinedCredits, normalizeCredit, type NormalizedCredit } from '@/utils/tmdb'

export const DEFAULT_SEARCH_LIMIT = 8

export type ProfileResult = { id: string; username: string | null; display_name: string | null; avatar_url: string | null }

export type ReviewResult = {
  id: string
  content: string
  href: string
  title: string
  authorName: string
  authorHref: string | null
}

export type NewsResult = { id: string; title: string; description: string | null; source_name: string }

export type SearchResults = {
  profiles: ProfileResult[]
  titles: NormalizedCredit[]
  reviews: ReviewResult[]
  news: NewsResult[]
}

type Supabase = Awaited<ReturnType<typeof createClient>>

async function searchProfiles(supabase: Supabase, pattern: string, limit: number): Promise<ProfileResult[]> {
  const [byUsername, byDisplayName, bannedUserIds] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').ilike('username', pattern).limit(limit),
    supabase.from('profiles').select('id, username, display_name, avatar_url').ilike('display_name', pattern).limit(limit),
    getBannedUserIds(),
  ])

  const byId = new Map<string, ProfileResult>()
  for (const p of [...(byUsername.data ?? []), ...(byDisplayName.data ?? [])]) {
    if (!bannedUserIds.has(p.id)) byId.set(p.id, p)
  }
  return [...byId.values()].slice(0, limit)
}

async function searchTitles(query: string, limit: number): Promise<NormalizedCredit[]> {
  const credits = await getPersonCombinedCredits().catch(() => ({ id: 0, cast: [], crew: [] }))
  const q = query.toLowerCase()
  const seen = new Set<string>()
  const matches: NormalizedCredit[] = []
  for (const c of credits.cast) {
    const key = `${c.media_type}:${c.id}`
    if (seen.has(key)) continue
    seen.add(key)
    const normalized = normalizeCredit(c)
    if (!normalized.title.toLowerCase().includes(q)) continue
    matches.push(normalized)
    if (matches.length >= limit) break
  }
  return matches
}

// Matches a review two ways: its own text ("this was so good"), OR the
// title of the thing it's reviewing (searching "yellowjackets" should
// surface fan reviews of Yellowjackets even if the review text never
// repeats the show's name) -- both queried and merged by review id.
type MusicReviewRow = {
  id: string
  content: string | null
  deleted_at: string | null
  user_id: string
  release_id: string
  profiles: { username: string | null; display_name: string | null } | null
}

async function searchReviews(supabase: Supabase, query: string, pattern: string, limit: number): Promise<ReviewResult[]> {
  const releases = await getReleasesWithSlugs()
  const matchingReleaseIds = releases
    .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    .map((r) => r.id)

  const [bannedUserIds, byContentRes, byTitleFilmsRes, musicByContentRes, musicByTitleRes] = await Promise.all([
    getBannedUserIds(),
    supabase
      .from('reviews')
      .select('id, content, deleted_at, user_id, films(tmdb_id, title), profiles(username, display_name)')
      .ilike('content', pattern)
      .is('deleted_at', null)
      .limit(limit),
    supabase
      .from('reviews')
      .select('id, content, deleted_at, user_id, films!inner(tmdb_id, title), profiles(username, display_name)')
      .ilike('films.title', pattern)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('music_reviews')
      .select('id, content, deleted_at, user_id, release_id, profiles(username, display_name)')
      .ilike('content', pattern)
      .is('deleted_at', null)
      .limit(limit),
    matchingReleaseIds.length > 0
      ? supabase
          .from('music_reviews')
          .select('id, content, deleted_at, user_id, release_id, profiles(username, display_name)')
          .in('release_id', matchingReleaseIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit)
      : Promise.resolve({ data: [] as MusicReviewRow[] }),
  ])

  const releaseById = new Map(releases.map((r) => [r.id, r]))

  const filmRows = [...(byContentRes.data ?? []), ...(byTitleFilmsRes.data ?? [])]
  const filmResults = new Map<string, ReviewResult>()
  for (const r of filmRows) {
    if (!isVisibleReview(r, bannedUserIds) || r.content === null || !r.films) continue
    filmResults.set(r.id, {
      id: r.id,
      content: r.content,
      href: `/films/${r.films.tmdb_id}`,
      title: r.films.title,
      authorName: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous Fan',
      authorHref: reviewAuthorProfilePath(r.profiles),
    })
  }

  const musicRows = [...(musicByContentRes.data ?? []), ...(musicByTitleRes.data ?? [])]
  const musicResults = new Map<string, ReviewResult>()
  for (const r of musicRows) {
    if (!isVisibleReview(r, bannedUserIds) || r.content === null) continue
    const release = releaseById.get(r.release_id)
    if (!release) continue
    musicResults.set(r.id, {
      id: r.id,
      content: r.content,
      href: `/music/${release.slug}`,
      title: release.title,
      authorName: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous Fan',
      authorHref: reviewAuthorProfilePath(r.profiles),
    })
  }

  return [...filmResults.values(), ...musicResults.values()].slice(0, limit)
}

async function searchNews(supabase: Supabase, pattern: string, limit: number): Promise<NewsResult[]> {
  const [byTitle, byDescription] = await Promise.all([
    supabase.from('news_items').select('id, title, description, source_name').eq('status', 'approved').ilike('title', pattern).limit(limit),
    supabase.from('news_items').select('id, title, description, source_name').eq('status', 'approved').ilike('description', pattern).limit(limit),
  ])
  const byId = new Map<string, NewsResult>()
  for (const n of [...(byTitle.data ?? []), ...(byDescription.data ?? [])]) byId.set(n.id, n)
  return [...byId.values()].slice(0, limit)
}

/**
 * Runs the same search across all four content types and returns grouped
 * results. Shared by the /search page and the /api/search route (which
 * feeds the navbar's command palette) so the two never drift.
 */
export async function runGlobalSearch(query: string, limit: number = DEFAULT_SEARCH_LIMIT): Promise<SearchResults> {
  if (query.length < 2) {
    return { profiles: [], titles: [], reviews: [], news: [] }
  }

  const supabase = await createClient()
  const pattern = `%${escapeIlike(query)}%`

  const [profiles, titles, reviews, news] = await Promise.all([
    searchProfiles(supabase, pattern, limit),
    searchTitles(query, limit),
    searchReviews(supabase, query, pattern, limit),
    searchNews(supabase, pattern, limit),
  ])

  return { profiles, titles, reviews, news }
}
