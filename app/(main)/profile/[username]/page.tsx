import type { Metadata } from 'next'
import { cache } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { createClient, getUser } from '@/utils/supabase/server'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { getMovieDetails, getTvDetails, getTmdbImageUrl, getPersonCombinedCredits, normalizeCredit } from '@/utils/tmdb'
import { sanitizeCSS } from '@/utils/sanitize-css'
import { isUuid, resolveCanonicalProfileSlug, profilePath, escapeIlike } from '@/utils/profile'
import { evaluateProfileSeo } from '@/utils/profile-seo'
import { buildBreadcrumbSchema, buildProfilePageSchema, serializeJsonLd } from '@/utils/schema'
import ActivityFeed, { type ActivityItem } from '@/components/profile/ActivityFeed'
import SectionHeader from '@/components/ui/SectionHeader'
import Button from '@/components/ui/Button'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Props {
  params: Promise<{ username: string }>
  searchParams?: Promise<{ error?: string }>
}

const PROFILE_SELECT = `
    id, username, display_name, avatar_url, bio, about_me, created_at,
    banner_url, accent_color, profile_css, pronouns, location_text, website_url, show_activity,
    profile_favorites(id, tmdb_id, media_type, position)
  `

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  about_me: string | null
  created_at: string
  banner_url: string | null
  accent_color: string | null
  profile_css: string | null
  pronouns: string | null
  location_text: string | null
  website_url: string | null
  show_activity: boolean
  profile_favorites: FavoriteRow[] | null
}

/**
 * Single lookup shared by generateMetadata and the page component (React
 * `cache()` dedupes identical calls within one request, so this only runs
 * once even though both callers need it). Also resolves ban status here so
 * both callers converge on one answer instead of two separate checks.
 */
const getProfileBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const profileQuery = supabase.from('profiles').select(PROFILE_SELECT)

  const { data: profile, error } = await (isUuid(slug)
    ? profileQuery.eq('id', slug)
    : profileQuery.ilike('username', escapeIlike(slug))
  ).maybeSingle()

  if (!profile) return { profile: null as ProfileRow | null, error, isBanned: false }

  const bannedIds = await getBannedUserIds()
  return { profile: profile as ProfileRow, error, isBanned: bannedIds.has(profile.id) }
})

/**
 * Review body text for this profile's SEO-quality evaluation, independent
 * of `show_activity` -- a review already appears publicly on its film/music
 * page (with a link back to this profile) even when the profile's own
 * activity feed is hidden, so it must still count as a public content
 * signal here.
 */
const getProfileReviewContents = cache(async (profileId: string): Promise<(string | null)[]> => {
  const supabase = await createClient()
  const [{ data: filmReviews }, { data: musicReviews }] = await Promise.all([
    supabase.from('reviews').select('content').eq('user_id', profileId).is('deleted_at', null),
    supabase.from('music_reviews').select('content').eq('user_id', profileId).is('deleted_at', null),
  ])
  return [...(filmReviews ?? []), ...(musicReviews ?? [])].map((r) => r.content)
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const { profile, isBanned } = await getProfileBySlug(username)

  if (!profile || isBanned) return {}

  const canonicalSlug = resolveCanonicalProfileSlug(profile)
  const displayName = profile.display_name ?? profile.username ?? 'Anonymous'
  const canonical = profilePath(canonicalSlug)

  const reviewContents = await getProfileReviewContents(profile.id)
  const quality = evaluateProfileSeo({
    exists: true,
    isBanned: false,
    username: profile.username,
    bio: profile.bio,
    aboutMe: profile.about_me,
    favoritesCount: (profile.profile_favorites ?? []).length,
    reviewContents,
  })

  const title = profile.username ? `${displayName} (@${profile.username})` : displayName
  const aboutMe = profile.about_me?.trim()
  const bio = profile.bio?.trim()
  const description = aboutMe
    ? `${aboutMe.slice(0, 155)}${aboutMe.length > 155 ? '…' : ''}`
    : bio
      ? `${bio.slice(0, 155)}${bio.length > 155 ? '…' : ''}`
      : `${displayName}'s fan profile, favorites, and reviews on SoapyFans Hub.`

  return {
    title,
    description,
    alternates: { canonical },
    ...(quality === 'noindex' ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

type RawFilmReview = {
  id: string
  rating: number
  content: string | null
  created_at: string
  films: { title: string; poster_path: string | null; tmdb_id: number } | null
}

type RawMusicReview = {
  id: string
  rating: number
  content: string | null
  created_at: string
  releases: { title: string; cover_art_url: string | null } | null
}

type FavoriteRow = {
  id: string
  tmdb_id: number
  media_type: string
  position: number
}

type EnrichedFavorite = FavoriteRow & {
  posterPath: string | null
  title: string | null
}

type WatchlistRow = {
  id: string
  tmdb_id: number
  media_type: string
}

type EnrichedWatchlistItem = WatchlistRow & {
  posterPath: string | null
  title: string | null
}

const FALLBACK_ACCENT = '#e8890c'

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const { error } = (await searchParams) ?? {}
  const supabase = await createClient()

  const [{ profile, error: profileError, isBanned }, user] = await Promise.all([
    getProfileBySlug(username),
    getUser(),
  ])

  if (profileError) {
    console.error('[ProfilePage] Database query error for profile:', { username, profileError })
    throw new Error('Failed to load profile. Please try again.')
  }

  // A banned user contributes no normal public content: same 404 as a
  // profile that never existed, no ban status leaked to the response.
  if (!profile || isBanned) notFound()

  const canonicalSlug = resolveCanonicalProfileSlug(profile)
  if (canonicalSlug !== username) {
    permanentRedirect(profilePath(canonicalSlug))
  }

  const isOwner = user?.id === profile.id
  const profileSlug = canonicalSlug
  const displayName = profile.display_name ?? profile.username ?? 'Anonymous'
  const avatarInitial = displayName[0]?.toUpperCase() ?? '?'
  const joinYear = new Date(profile.created_at).getFullYear()
  const accentColor = profile.accent_color ?? FALLBACK_ACCENT

  const sortedFavorites = ((profile.profile_favorites ?? []) as FavoriteRow[])
    .slice()
    .sort((a, b) => a.position - b.position)

  const reviewContents = await getProfileReviewContents(profile.id)
  const seoQuality = evaluateProfileSeo({
    exists: true,
    isBanned: false,
    username: profile.username,
    bio: profile.bio,
    aboutMe: profile.about_me,
    favoritesCount: sortedFavorites.length,
    reviewContents,
  })
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: displayName, path: profilePath(profileSlug) },
  ]

  // Fast path: resolve favorite titles and posters from cached combined credits
  const creditsPromise = sortedFavorites.length > 0
    ? getPersonCombinedCredits().catch(() => ({ id: 0, cast: [], crew: [] }))
    : Promise.resolve({ id: 0, cast: [], crew: [] })

  const [combinedCredits, filmReviewsResult, musicReviewsResult, watchlistResult] = await Promise.all([
    creditsPromise,
    profile.show_activity
      ? supabase
          .from('reviews')
          .select('id, rating, content, created_at, films(title, poster_path, tmdb_id)')
          .eq('user_id', profile.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    profile.show_activity
      ? supabase
          .from('music_reviews')
          .select('id, rating, content, created_at, releases(title, cover_art_url)')
          .eq('user_id', profile.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    // Same show_activity gate as Recent Activity below -- a watchlist is
    // just as much "what I'm doing" as a review is.
    profile.show_activity
      ? supabase
          .from('watchlist')
          .select('id, tmdb_id, media_type')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(24)
      : Promise.resolve({ data: [] }),
  ])

  const creditMap = new Map<string, { title: string; posterPath: string | null }>()
  for (const c of combinedCredits.cast) {
    const norm = normalizeCredit(c)
    creditMap.set(`${norm.mediaType}:${norm.id}`, {
      title: norm.title,
      posterPath: norm.posterPath,
    })
  }

  const favoriteDetails: EnrichedFavorite[] = await Promise.all(
    sortedFavorites.map(async (fav): Promise<EnrichedFavorite> => {
      const fromCache = creditMap.get(`${fav.media_type}:${fav.tmdb_id}`)
      if (fromCache) {
        return { ...fav, posterPath: fromCache.posterPath, title: fromCache.title }
      }
      try {
        if (fav.media_type === 'movie') {
          const d = await getMovieDetails(fav.tmdb_id)
          return { ...fav, posterPath: d.poster_path, title: d.title }
        }
        const d = await getTvDetails(fav.tmdb_id)
        return { ...fav, posterPath: d.poster_path, title: d.name }
      } catch {
        return { ...fav, posterPath: null, title: null }
      }
    })
  )

  const watchlistRows = (watchlistResult.data ?? []) as WatchlistRow[]
  const watchlistDetails: EnrichedWatchlistItem[] = await Promise.all(
    watchlistRows.map(async (item): Promise<EnrichedWatchlistItem> => {
      const fromCache = creditMap.get(`${item.media_type}:${item.tmdb_id}`)
      if (fromCache) {
        return { ...item, posterPath: fromCache.posterPath, title: fromCache.title }
      }
      try {
        if (item.media_type === 'movie') {
          const d = await getMovieDetails(item.tmdb_id)
          return { ...item, posterPath: d.poster_path, title: d.title }
        }
        const d = await getTvDetails(item.tmdb_id)
        return { ...item, posterPath: d.poster_path, title: d.name }
      } catch {
        return { ...item, posterPath: null, title: null }
      }
    })
  )

  const filmReviews = (filmReviewsResult.data ?? []) as unknown as RawFilmReview[]
  const musicReviews = (musicReviewsResult.data ?? []) as unknown as RawMusicReview[]

  const activityItems: ActivityItem[] = [
    ...filmReviews.map((r): ActivityItem => ({
      kind: 'film',
      id: r.id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      title: r.films?.title ?? 'Unknown film',
      tmdb_id: r.films?.tmdb_id ?? 0,
      poster_path: r.films?.poster_path ?? null,
    })),
    ...musicReviews.map((r): ActivityItem => ({
      kind: 'music',
      id: r.id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      title: r.releases?.title ?? 'Unknown release',
      cover_art_url: r.releases?.cover_art_url ?? null,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  const sanitizedCss = profile.profile_css ? sanitizeCSS(profile.profile_css) : ''

  let websiteHost: string | null = null
  if (profile.website_url) {
    try {
      websiteHost = new URL(profile.website_url).hostname.replace(/^www\./, '')
    } catch {
      websiteHost = profile.website_url
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-24">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbItems)) }}
      />
      {seoQuality === 'indexable' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              buildProfilePageSchema({
                displayName,
                username: profile.username,
                path: profilePath(profileSlug),
              }),
            ),
          }}
        />
      )}

      {/* ── Scoped Custom CSS (Strictly Isolated to Canvas) ──── */}
      {sanitizedCss && (
        <style>{`#profile-canvas { ${sanitizedCss} }`}</style>
      )}

      <div className="mx-auto mb-4 max-w-5xl">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* ── USER PROFILE CANVAS ─────────────────────────────── */}
      <div
        id="profile-canvas"
        className="profile-canvas mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 shadow-2xl"
      >
        {/* 1. BANNER & GRADIENT OVERLAY */}
        <div
          className="relative z-0 h-[180px] w-full overflow-hidden sm:h-[240px]"
          style={
            !profile.banner_url
              ? {
                  background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}12 60%, transparent 100%)`,
                }
              : undefined
          }
        >
          {profile.banner_url && (
            <Image
              src={profile.banner_url}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-center"
              priority
            />
          )}
          {/* Subtle bottom vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent opacity-90"
          />
        </div>

        {/* 2. PROFILE CONTENT */}
        <div className="relative z-10 px-6 pb-16 pt-0 sm:px-10 sm:pb-20">
          {/* PROFILE IDENTITY HEADER */}
          <header className="mb-14 border-b border-[var(--border-subtle)] pb-10">
            {/* Avatar & Action Row */}
            <div className="relative z-20 -mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
              {/* 4-Layer Isolated Avatar Architecture */}
              <div
                className="relative shrink-0 rounded-full isolate"
                style={{
                  padding: '4px',
                  background: accentColor,
                  boxShadow: `0 0 0 4px var(--bg-surface)`,
                }}
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--bg-base)] sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={displayName}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover object-center rounded-full"
                      priority
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center rounded-full font-display text-3xl font-medium text-[var(--bg-base)] sm:text-4xl"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)`,
                      }}
                    >
                      {avatarInitial}
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Action Button */}
              {isOwner && (
                <div className="pb-1">
                  <Button href="/profile/edit" variant="secondary" size="sm">
                    Edit Profile Atelier ↗
                  </Button>
                </div>
              )}
            </div>

            {/* Name, Handle, Pronouns, Bio & Metadata */}
            <div className="mt-5 space-y-4">
              <div>
                <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  {displayName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {profile.username && (
                    <span className="font-mono text-sm text-[var(--text-muted)]">
                      @{profile.username}
                    </span>
                  )}
                  {profile.pronouns && (
                    <>
                      <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
                      <span className="text-xs italic text-[var(--text-muted)]">
                        {profile.pronouns}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
                  {profile.bio}
                </p>
              )}

              {/* Documentary Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 font-mono text-xs text-[var(--text-muted)]">
                {profile.location_text && (
                  <span>
                    📍 {profile.location_text}
                  </span>
                )}
                {websiteHost && profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
                  >
                    <span>🔗 {websiteHost}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                <span>
                  Member since {joinYear}
                </span>
              </div>
            </div>
          </header>

          {/* 3. SOPHIE PICKS (FAVORITES) */}
          {favoriteDetails.length > 0 && (
            <section id="favorites" className="mb-16 space-y-6">
              <SectionHeader
                kicker="Sophie Picks"
                title="Curated Favorites"
                action={
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {favoriteDetails.length} {favoriteDetails.length === 1 ? 'Title' : 'Titles'}
                  </span>
                }
              />

              <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-6 sm:gap-4">
                {favoriteDetails.map((fav, i) => {
                  const posterUrl = fav.posterPath
                    ? getTmdbImageUrl(fav.posterPath, 'w342')
                    : null
                  const href =
                    fav.media_type === 'movie'
                      ? `/films/${fav.tmdb_id}`
                      : `/tv/${fav.tmdb_id}`

                  return (
                    <Link
                      key={fav.id}
                      href={href}
                      className="group relative block aspect-[2/3] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300 hover:border-[var(--accent-amber)]/60 hover:shadow-lg focus-ring"
                    >
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={fav.title ?? ''}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, 15vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
                          ?
                        </div>
                      )}

                      {/* Rank indicator badge */}
                      <div className="absolute left-2 top-2 rounded-full border border-black/30 bg-black/75 px-2 py-0.5 font-mono text-[0.62rem] text-white/90 backdrop-blur-xs">
                        #{i + 1}
                      </div>

                      {/* Hover overlay with title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="font-display text-xs font-medium leading-tight text-white line-clamp-2">
                            {fav.title}
                          </p>
                          {fav.media_type === 'tv' && (
                            <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/70">
                              Series
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* 3b. WATCHLIST (Want to watch, gated by show_activity like Activity below) */}
          {profile.show_activity && watchlistDetails.length > 0 && (
            <section id="watchlist" className="mb-16 space-y-6">
              <SectionHeader
                kicker="Want to Watch"
                title="Watchlist"
                action={
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {watchlistDetails.length} {watchlistDetails.length === 1 ? 'Title' : 'Titles'}
                  </span>
                }
              />

              <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-6 sm:gap-4">
                {watchlistDetails.map((item) => {
                  const posterUrl = item.posterPath
                    ? getTmdbImageUrl(item.posterPath, 'w342')
                    : null
                  const href =
                    item.media_type === 'movie'
                      ? `/films/${item.tmdb_id}`
                      : `/tv/${item.tmdb_id}`

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="group relative block aspect-[2/3] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300 hover:border-[var(--accent-amber)]/60 hover:shadow-lg focus-ring"
                    >
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={item.title ?? ''}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, 15vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
                          ?
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="font-display text-xs font-medium leading-tight text-white line-clamp-2">
                            {item.title}
                          </p>
                          {item.media_type === 'tv' && (
                            <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/70">
                              Series
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* 4. ABOUT ME (Optional extended personal narrative) */}
          {profile.about_me && (
            <section id="about-me" className="mb-16 space-y-4">
              <SectionHeader
                kicker="About Me"
                title="A little more about me"
              />
              <div className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
                {profile.about_me}
              </div>
            </section>
          )}

          {/* 5. ACTIVITY (Conditional on show_activity) */}
          {profile.show_activity && (
            <section id="activity" className="mb-14 space-y-6">
              <SectionHeader
                kicker="Archive Feed"
                title="Recent Activity"
                action={
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {activityItems.length.toString().padStart(2, '0')}{' '}
                    {activityItems.length === 1 ? 'entry' : 'entries'}
                  </span>
                }
              />

              {error && (
                <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-xs text-red-300">
                  {error}
                </p>
              )}

              <ActivityFeed
                items={activityItems}
                isOwner={isOwner}
                profileSlug={profileSlug}
              />
            </section>
          )}

          {/* 6. MINIMAL PROFILE CLOSURE */}
          <footer className="mt-16 border-t border-[var(--border-subtle)] pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between font-mono text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-secondary)]">SoapyFans Hub</span>
                <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
                <span>Fan Archive Profile</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  href="/films"
                  className="transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
                >
                  Explore Archive →
                </Link>
                <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-[var(--text-primary)] focus-ring rounded-xs"
                >
                  Privacy
                </Link>
                <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-[var(--text-primary)] focus-ring rounded-xs"
                >
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}

