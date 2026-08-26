import type { MetadataRoute } from 'next'
import {
  getPersonCombinedCredits,
  normalizeCredit,
  type NormalizedCredit,
} from '@/utils/tmdb'
import { createPublicClient } from '@/utils/supabase/public'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { evaluateProfileSeo } from '@/utils/profile-seo'
import { profilePath } from '@/utils/profile'
import { getReleasesWithSlugs, type ReleaseWithSlug } from '@/utils/releases'
import { createLastKnownGood } from '@/utils/sitemap-resilience'
import { getSiteUrl, STATIC_CONTENT_LAST_MODIFIED } from '@/utils/site'

export const revalidate = 3600

const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function buildStaticRoutes(siteUrl: string): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/films`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/music`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/news`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: STATIC_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
  ]
}

export function buildFilmTvRoutes(credits: NormalizedCredit[], siteUrl: string): MetadataRoute.Sitemap {
  const filmRoutes: MetadataRoute.Sitemap = credits
    .filter((c) => c.mediaType === 'movie')
    .map((c) => ({
      url: `${siteUrl}/films/${c.id}`,
      lastModified: c.date ? new Date(c.date) : STATIC_CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  const tvRoutes: MetadataRoute.Sitemap = credits
    .filter((c) => c.mediaType === 'tv')
    .map((c) => ({
      url: `${siteUrl}/tv/${c.id}`,
      lastModified: c.date ? new Date(c.date) : STATIC_CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  return [...filmRoutes, ...tvRoutes]
}

export function buildReleaseRoutes(releases: ReleaseWithSlug[], siteUrl: string): MetadataRoute.Sitemap {
  return releases.map((r) => ({
    url: `${siteUrl}/music/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
}

export type NewsSitemapCandidate = {
  id: string
  published_at: string
}

export function buildNewsRoutes(items: NewsSitemapCandidate[], siteUrl: string): MetadataRoute.Sitemap {
  return items.map((item) => ({
    url: `${siteUrl}/news/${item.id}`,
    lastModified: new Date(item.published_at),
    changeFrequency: 'never',
    priority: 0.5,
  }))
}

export type ProfileSitemapCandidate = {
  id: string
  username: string | null
  bio: string | null
  about_me: string | null
  updated_at: string
  favoritesCount: number
  latestFavoriteAt: string | null
  reviewContents: (string | null)[]
}

/**
 * Only `indexable` profiles (per the shared evaluateProfileSeo policy) get
 * a sitemap entry -- noindex/unavailable/no-username profiles are excluded
 * here, not just annotated. `profiles.updated_at` doesn't change when a
 * favorite is added/removed/reordered (see app/(main)/profile/edit/actions.ts:
 * only saveProfile bumps it), so the latest favorite timestamp is used
 * instead whenever it's more recent -- the smallest safe fix for that gap
 * rather than trusting a stale updated_at.
 */
export function buildProfileSitemapEntries(
  candidates: ProfileSitemapCandidate[],
  bannedIds: Set<string>,
  siteUrl: string,
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const candidate of candidates) {
    const quality = evaluateProfileSeo({
      exists: true,
      isBanned: bannedIds.has(candidate.id),
      username: candidate.username,
      bio: candidate.bio,
      aboutMe: candidate.about_me,
      favoritesCount: candidate.favoritesCount,
      reviewContents: candidate.reviewContents,
    })

    if (quality !== 'indexable') continue

    const lastModified =
      candidate.latestFavoriteAt && candidate.latestFavoriteAt > candidate.updated_at
        ? new Date(candidate.latestFavoriteAt)
        : new Date(candidate.updated_at)

    entries.push({
      url: `${siteUrl}${profilePath(candidate.username as string)}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  return entries
}

async function fetchCredits(): Promise<NormalizedCredit[]> {
  const combined = await getPersonCombinedCredits()
  const seen = new Set<string>()
  const credits: NormalizedCredit[] = []
  for (const c of combined.cast) {
    const key = `${c.media_type}:${c.id}`
    if (seen.has(key)) continue
    seen.add(key)
    credits.push(normalizeCredit(c))
  }
  return credits
}

const NEWS_SITEMAP_LIMIT = 1000

async function fetchNewsCandidates(): Promise<NewsSitemapCandidate[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('news_items')
    .select('id, published_at')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(NEWS_SITEMAP_LIMIT)
  return (data ?? []) as NewsSitemapCandidate[]
}

async function fetchProfileCandidates(): Promise<ProfileSitemapCandidate[]> {
  const supabase = createPublicClient()
  const [{ data: profiles }, { data: favorites }, { data: filmReviews }, { data: musicReviews }] =
    await Promise.all([
      supabase.from('profiles').select('id, username, bio, about_me, updated_at'),
      supabase.from('profile_favorites').select('user_id, created_at'),
      supabase.from('reviews').select('user_id, content').is('deleted_at', null),
      supabase.from('music_reviews').select('user_id, content').is('deleted_at', null),
    ])

  const favoritesByUser = new Map<string, { count: number; latest: string | null }>()
  for (const fav of favorites ?? []) {
    const entry = favoritesByUser.get(fav.user_id) ?? { count: 0, latest: null }
    entry.count += 1
    if (fav.created_at && (!entry.latest || fav.created_at > entry.latest)) entry.latest = fav.created_at
    favoritesByUser.set(fav.user_id, entry)
  }

  const reviewsByUser = new Map<string, (string | null)[]>()
  for (const review of [...(filmReviews ?? []), ...(musicReviews ?? [])]) {
    const list = reviewsByUser.get(review.user_id) ?? []
    list.push(review.content)
    reviewsByUser.set(review.user_id, list)
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    bio: p.bio,
    about_me: p.about_me,
    updated_at: p.updated_at,
    favoritesCount: favoritesByUser.get(p.id)?.count ?? 0,
    latestFavoriteAt: favoritesByUser.get(p.id)?.latest ?? null,
    reviewContents: reviewsByUser.get(p.id) ?? [],
  }))
}

async function fetchProfileEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  // Fetched together so a banned-list failure can never leave a banned
  // profile in the sitemap just because the candidates query happened to
  // succeed -- either both succeed and get filtered correctly, or the
  // whole thing throws and falls back to the last known-safe snapshot.
  const [candidates, bannedIds] = await Promise.all([fetchProfileCandidates(), getBannedUserIds()])
  return buildProfileSitemapEntries(candidates, bannedIds, siteUrl)
}

const resolveCredits = createLastKnownGood<NormalizedCredit[]>(SNAPSHOT_MAX_AGE_MS)
const resolveReleases = createLastKnownGood<ReleaseWithSlug[]>(SNAPSHOT_MAX_AGE_MS)
const resolveNewsCandidates = createLastKnownGood<NewsSitemapCandidate[]>(SNAPSHOT_MAX_AGE_MS)
const resolveProfileEntries = createLastKnownGood<MetadataRoute.Sitemap>(SNAPSHOT_MAX_AGE_MS)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const credits = await resolveCredits(fetchCredits, [])
  const releases = await resolveReleases(getReleasesWithSlugs, [])
  const newsCandidates = await resolveNewsCandidates(fetchNewsCandidates, [])
  const profileEntries = await resolveProfileEntries(() => fetchProfileEntries(siteUrl), [])

  return [
    ...buildStaticRoutes(siteUrl),
    ...buildFilmTvRoutes(credits, siteUrl),
    ...buildReleaseRoutes(releases, siteUrl),
    ...buildNewsRoutes(newsCandidates, siteUrl),
    ...profileEntries,
  ]
}
