import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/utils/supabase/server'
import { getMovieDetails, getTvDetails, getTmdbImageUrl } from '@/utils/tmdb'
import { sanitizeCSS } from '@/utils/sanitize-css'
import ActivityFeed, { type ActivityItem } from '@/app/components/ActivityFeed'

interface Props {
  params: Promise<{ username: string }>
  searchParams?: Promise<{ error?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} · Profile`,
    description: `Fan profile and reviews on SoapyFans Hub.`,
    robots: { index: false, follow: false },
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

const FALLBACK_ACCENT = '#e8890c'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const { error } = (await searchParams) ?? {}
  const supabase = await createClient()

  const isUuid = UUID_RE.test(username)
  const profileQuery = supabase.from('profiles').select(`
    id, username, display_name, avatar_url, bio, created_at,
    banner_url, accent_color, profile_css, pronouns, location_text, website_url, show_activity,
    profile_favorites(id, tmdb_id, media_type, position)
  `)

  const [{ data: profile }, user] = await Promise.all([
    (isUuid
      ? profileQuery.eq('id', username)
      : profileQuery.ilike('username', username)
    ).maybeSingle(),
    getUser(),
  ])

  if (!profile) notFound()

  const isOwner = user?.id === profile.id
  const profileSlug = profile.username ?? profile.id
  const displayName = profile.display_name ?? profile.username ?? 'Anonymous'
  const avatarInitial = displayName[0]?.toUpperCase() ?? '?'
  const joinYear = new Date(profile.created_at).getFullYear()
  const accentColor = profile.accent_color ?? FALLBACK_ACCENT

  const sortedFavorites = ((profile.profile_favorites ?? []) as FavoriteRow[])
    .slice()
    .sort((a, b) => a.position - b.position)

  // Fetch TMDB for favorites and reviews in parallel
  const [favoriteDetails, filmReviewsResult, musicReviewsResult] = await Promise.all([
    Promise.all(
      sortedFavorites.map(async (fav): Promise<EnrichedFavorite> => {
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
    ),
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
  ])

  // Supabase doesn't infer nested join shapes precisely; RawFilmReview/RawMusicReview match the actual select above.
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
    <>
      {sanitizedCss && (
        <style>{`.profile-canvas { ${sanitizedCss} }`}</style>
      )}

      <div id="profile-canvas" className="profile-canvas">
        {/* 1. BANNER */}
        <div
          className="relative h-[170px] w-full overflow-hidden sm:h-[230px]"
          style={
            !profile.banner_url
              ? {
                  background: `linear-gradient(135deg, ${accentColor}2a 0%, ${accentColor}0f 55%, transparent 100%)`,
                }
              : undefined
          }
        >
          {profile.banner_url && (
            <Image
              src={profile.banner_url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          )}
          {/* fade to bg at bottom so header overlaps cleanly */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-base)]/60" />
        </div>

        <div className="mx-auto max-w-4xl px-6 pb-24 sm:px-10 sm:pb-32">
          {/* 2. PROFILE HEADER */}
          <section className="mb-14">
            {/* Avatar row — pulled up to overlap the banner */}
            <div className="-mt-10 flex flex-wrap items-end gap-4 sm:-mt-12">
              {/* Avatar with accent-color ring */}
              <div
                className="shrink-0 rounded-full"
                style={{
                  padding: '4px',
                  background: accentColor,
                  boxShadow: `0 0 0 4px var(--bg-base)`,
                }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-[var(--bg-base)]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)`,
                    }}
                  >
                    {avatarInitial}
                  </div>
                )}
              </div>

              {/* Edit button pushed to the right, vertically aligned with avatar base */}
              {isOwner && (
                <div className="ml-auto">
                  <Link
                    href="/profile/edit"
                    className="inline-block rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)] sm:py-1.5"
                  >
                    Edit profile
                  </Link>
                </div>
              )}
            </div>

            {/* Name, pronouns, bio, metadata */}
            <div className="mt-5 space-y-3">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {displayName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {profile.username && (
                    <span className="text-sm text-[var(--text-muted)]">@{profile.username}</span>
                  )}
                  {profile.pronouns && (
                    <>
                      <span className="text-[var(--border-strong)]" aria-hidden>·</span>
                      <span className="text-xs italic text-[var(--text-muted)]">
                        {profile.pronouns}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                  {profile.bio}
                </p>
              )}

              {/* Inline metadata */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {profile.location_text && (
                  <span className="text-[0.75rem] text-[var(--text-muted)]">
                    {profile.location_text}
                  </span>
                )}
                {websiteHost && profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[0.75rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-gold)]"
                  >
                    {websiteHost} ↗
                  </a>
                )}
                <span className="text-[0.65rem] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Member since {joinYear}
                </span>
              </div>
            </div>

            <div className="mt-10 border-b border-[var(--border-subtle)]" />
          </section>

          {/* 3. SOPHIE PICKS */}
          {favoriteDetails.length > 0 && (
            <section className="mb-16 space-y-7">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
                  Sophie Picks
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Favorites
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {favoriteDetails.map((fav) => {
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
                      className="group relative block aspect-[2/3] overflow-hidden rounded-lg border border-[var(--border-subtle)] transition-all duration-300 hover:border-[var(--accent-amber)]/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
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
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                          ?
                        </div>
                      )}
                      {/* Hover overlay with title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[0.65rem] font-medium leading-tight text-white line-clamp-2">
                            {fav.title}
                          </p>
                          {fav.media_type === 'tv' && (
                            <span className="text-[0.5rem] uppercase tracking-wider text-white/50">
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

          {/* 4. ACTIVITY */}
          {profile.show_activity && (
            <section className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
                    Archive
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Activity
                  </h2>
                </div>
                <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  {activityItems.length.toString().padStart(2, '0')}{' '}
                  {activityItems.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {error && (
                <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
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
        </div>
      </div>
    </>
  )
}
