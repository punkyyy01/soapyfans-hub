import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { isVisibleReview, reviewAuthorProfilePath } from '@/utils/reviews'
import { getReleasesWithSlugs } from '@/utils/releases'
import { escapeIlike, profilePath, resolveCanonicalProfileSlug } from '@/utils/profile'
import { getPersonCombinedCredits, getTmdbImageUrl, normalizeCredit, type NormalizedCredit } from '@/utils/tmdb'
import PageContainer from '@/components/ui/PageContainer'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

const RESULTS_PER_SECTION = 8

type ProfileResult = { id: string; username: string | null; display_name: string | null; avatar_url: string | null }

type ReviewResult = {
  id: string
  content: string
  href: string
  title: string
  authorName: string
  authorHref: string | null
}

type NewsResult = { id: string; title: string; description: string | null; source_name: string }

async function searchProfiles(supabase: Awaited<ReturnType<typeof createClient>>, pattern: string) {
  const [byUsername, byDisplayName, bannedUserIds] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').ilike('username', pattern).limit(RESULTS_PER_SECTION),
    supabase.from('profiles').select('id, username, display_name, avatar_url').ilike('display_name', pattern).limit(RESULTS_PER_SECTION),
    getBannedUserIds(),
  ])

  const byId = new Map<string, ProfileResult>()
  for (const p of [...(byUsername.data ?? []), ...(byDisplayName.data ?? [])]) {
    if (!bannedUserIds.has(p.id)) byId.set(p.id, p)
  }
  return [...byId.values()].slice(0, RESULTS_PER_SECTION)
}

async function searchTitles(query: string): Promise<NormalizedCredit[]> {
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
    if (matches.length >= RESULTS_PER_SECTION) break
  }
  return matches
}

async function searchReviews(supabase: Awaited<ReturnType<typeof createClient>>, pattern: string): Promise<ReviewResult[]> {
  const [filmRes, musicRes, bannedUserIds, releases] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, content, deleted_at, user_id, films(tmdb_id, title), profiles(username, display_name)')
      .ilike('content', pattern)
      .is('deleted_at', null)
      .limit(RESULTS_PER_SECTION),
    supabase
      .from('music_reviews')
      .select('id, content, deleted_at, user_id, release_id, profiles(username, display_name)')
      .ilike('content', pattern)
      .is('deleted_at', null)
      .limit(RESULTS_PER_SECTION),
    getBannedUserIds(),
    getReleasesWithSlugs(),
  ])

  const releaseById = new Map(releases.map((r) => [r.id, r]))

  const filmResults: ReviewResult[] = (filmRes.data ?? [])
    .filter((r): r is typeof r & { content: string; films: NonNullable<typeof r.films> } =>
      isVisibleReview(r, bannedUserIds) && r.content !== null && r.films !== null,
    )
    .map((r) => ({
      id: r.id,
      content: r.content,
      href: `/films/${r.films.tmdb_id}`,
      title: r.films.title,
      authorName: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous Fan',
      authorHref: reviewAuthorProfilePath(r.profiles),
    }))

  const musicResults: ReviewResult[] = (musicRes.data ?? [])
    .filter((r): r is typeof r & { content: string } => isVisibleReview(r, bannedUserIds) && r.content !== null && releaseById.has(r.release_id))
    .map((r) => {
      const release = releaseById.get(r.release_id)!
      return {
        id: r.id,
        content: r.content,
        href: `/music/${release.slug}`,
        title: release.title,
        authorName: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous Fan',
        authorHref: reviewAuthorProfilePath(r.profiles),
      }
    })

  return [...filmResults, ...musicResults].slice(0, RESULTS_PER_SECTION)
}

async function searchNews(supabase: Awaited<ReturnType<typeof createClient>>, pattern: string): Promise<NewsResult[]> {
  const [byTitle, byDescription] = await Promise.all([
    supabase.from('news_items').select('id, title, description, source_name').eq('status', 'approved').ilike('title', pattern).limit(RESULTS_PER_SECTION),
    supabase.from('news_items').select('id, title, description, source_name').eq('status', 'approved').ilike('description', pattern).limit(RESULTS_PER_SECTION),
  ])
  const byId = new Map<string, NewsResult>()
  for (const n of [...(byTitle.data ?? []), ...(byDescription.data ?? [])]) byId.set(n.id, n)
  return [...byId.values()].slice(0, RESULTS_PER_SECTION)
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (q ?? '').trim().slice(0, 100)

  let profiles: ProfileResult[] = []
  let titles: NormalizedCredit[] = []
  let reviews: ReviewResult[] = []
  let news: NewsResult[] = []

  if (query.length >= 2) {
    const supabase = await createClient()
    const pattern = `%${escapeIlike(query)}%`
    ;[profiles, titles, reviews, news] = await Promise.all([
      searchProfiles(supabase, pattern),
      searchTitles(query),
      searchReviews(supabase, pattern),
      searchNews(supabase, pattern),
    ])
  }

  const hasQuery = query.length >= 2
  const hasResults = profiles.length > 0 || titles.length > 0 || reviews.length > 0 || news.length > 0

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 pt-24 sm:pt-28">
      <PageContainer size="default">
        <div className="mb-14 space-y-6 border-b border-[var(--border-subtle)] pb-10">
          <div className="space-y-2">
            <p className="text-eyebrow">Archive Index</p>
            <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Search
            </h1>
          </div>

          <form method="GET" action="/search" className="max-w-md">
            <label htmlFor="search-q" className="sr-only">
              Search profiles, titles, reviews, and news
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3.5 text-sm text-[var(--text-muted)]" aria-hidden="true">
                ⌕
              </span>
              <input
                id="search-q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search profiles, titles, reviews, news…"
                className="w-full rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pl-9 pr-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-ring"
              />
            </div>
          </form>
        </div>

        {!hasQuery ? (
          <EmptyState
            title="Search the archive"
            description="Look up fan profiles, Sophie Thatcher titles, fan reviews, or news coverage."
          />
        ) : !hasResults ? (
          <EmptyState
            title={`No results for "${query}"`}
            description="Try a different spelling, or search for a title, username, or news topic."
          />
        ) : (
          <div className="space-y-14">
            {profiles.length > 0 && (
              <section>
                <SectionHeader kicker="Fan Archive" title="Profiles" />
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {profiles.map((p) => {
                    const slug = resolveCanonicalProfileSlug(p)
                    const name = p.display_name ?? p.username ?? 'Anonymous'
                    return (
                      <li key={p.id}>
                        <Link
                          href={profilePath(slug)}
                          className="group flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-3 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] focus-ring"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--accent-amber)]/40 bg-[var(--bg-card)] font-mono text-xs font-semibold text-[var(--accent-amber)]">
                            {name[0]?.toUpperCase() ?? '?'}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-display text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-amber)]">
                              {name}
                            </span>
                            {p.username && (
                              <span className="block truncate font-mono text-[0.68rem] text-[var(--text-muted)]">
                                @{p.username}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {titles.length > 0 && (
              <section>
                <SectionHeader kicker="Curated Archive" title="Films &amp; Television" />
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {titles.map((c) => {
                    const isTv = c.mediaType === 'tv'
                    const href = `/${isTv ? 'tv' : 'films'}/${c.id}`
                    const imageSrc = getTmdbImageUrl(c.posterPath, 'w342')
                    return (
                      <li key={`${c.mediaType}-${c.id}`}>
                        <Link href={href} className="group flex flex-col focus-ring rounded-md">
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                            {imageSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imageSrc} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center p-4 text-center font-display text-xs italic text-[var(--text-muted)]">
                                {c.title}
                              </div>
                            )}
                          </div>
                          <h3 className="mt-2.5 line-clamp-2 font-display text-[0.92rem] font-medium leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-amber)]">
                            {c.title}
                          </h3>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {reviews.length > 0 && (
              <section>
                <SectionHeader kicker="Fan Floor" title="Reviews" />
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={r.href}
                        className="group block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-4 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] focus-ring"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-amber)]">
                            {r.title}
                          </h3>
                          <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                            — {r.authorName}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{r.content}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {news.length > 0 && (
              <section>
                <SectionHeader kicker="Coverage" title="News" />
                <ul className="space-y-3">
                  {news.map((n) => (
                    <li key={n.id}>
                      <Link
                        href="/news"
                        className="group block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-4 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] focus-ring"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="line-clamp-1 font-display text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-amber)]">
                            {n.title}
                          </h3>
                          <Badge variant="neutral" size="sm">{n.source_name}</Badge>
                        </div>
                        {n.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{n.description}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </main>
  )
}
