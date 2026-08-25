import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/utils/supabase/server'
import { getReleasesWithSlugs } from '@/utils/releases'
import { profilePath, resolveCanonicalProfileSlug } from '@/utils/profile'
import { notificationMessage } from '@/utils/social'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import RefreshNavbarBadge from '@/components/social/RefreshNavbarBadge'

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
}

type NotificationRow = {
  id: string
  type: string
  target_type: string | null
  target_id: string | null
  read_at: string | null
  created_at: string
  actor: { id: string; username: string | null; display_name: string | null } | null
}

export default async function NotificationsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('notifications')
    .select(
      'id, type, target_type, target_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(id, username, display_name)',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = ((rows ?? []) as unknown as NotificationRow[]).map((n) => ({
    ...n,
    wasUnread: n.read_at === null,
  }))

  // Mark everything read now that the page has been viewed -- the badge
  // resets, but wasUnread (captured above, before this update) still lets
  // this render highlight what was new this visit.
  const hasUnread = notifications.some((n) => n.wasUnread)
  if (hasUnread) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
  }

  // Resolve review targets to their real page path. Reviews -> films needs
  // a join; music_reviews -> release slug needs the cached release list
  // (slugs aren't a stored column, computed the same way /music/[slug] does).
  const reviewIds = notifications
    .filter((n) => n.target_type === 'review' && n.target_id)
    .map((n) => n.target_id as string)
  const musicReviewIds = notifications
    .filter((n) => n.target_type === 'music_review' && n.target_id)
    .map((n) => n.target_id as string)

  const [filmLinkRows, musicReviewRows, releases] = await Promise.all([
    reviewIds.length > 0
      ? supabase.from('reviews').select('id, films(tmdb_id)').in('id', reviewIds)
      : Promise.resolve({ data: [] as { id: string; films: { tmdb_id: number } | null }[] }),
    musicReviewIds.length > 0
      ? supabase.from('music_reviews').select('id, release_id').in('id', musicReviewIds)
      : Promise.resolve({ data: [] as { id: string; release_id: string }[] }),
    musicReviewIds.length > 0 ? getReleasesWithSlugs() : Promise.resolve([]),
  ])

  const filmPathByReviewId = new Map<string, string>()
  for (const row of (filmLinkRows.data ?? []) as { id: string; films: { tmdb_id: number } | null }[]) {
    if (row.films) filmPathByReviewId.set(row.id, `/films/${row.films.tmdb_id}`)
  }

  const releaseSlugById = new Map(releases.map((r) => [r.id, r.slug]))
  const musicPathByReviewId = new Map<string, string>()
  for (const row of (musicReviewRows.data ?? []) as { id: string; release_id: string }[]) {
    const slug = releaseSlugById.get(row.release_id)
    if (slug) musicPathByReviewId.set(row.id, `/music/${slug}`)
  }

  function targetHref(n: NotificationRow): string | null {
    if (n.type === 'follow') {
      return n.actor ? profilePath(resolveCanonicalProfileSlug(n.actor)) : null
    }
    if (!n.target_id) return null
    if (n.target_type === 'review') return filmPathByReviewId.get(n.target_id) ?? '/films'
    if (n.target_type === 'music_review') return musicPathByReviewId.get(n.target_id) ?? '/music'
    return null
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 pt-24 sm:pt-28">
      {hasUnread && <RefreshNavbarBadge />}
      <PageContainer size="narrow">
        <PageHeader eyebrow="Archive Activity" title="Notifications" />

        {notifications.length > 0 ? (
          <ul className="space-y-3">
            {notifications.map((n) => {
              const actorName = n.actor?.display_name ?? n.actor?.username ?? 'Someone'
              const href = targetHref(n)
              const content = (
                <div
                  className={`rounded-xl border p-4 transition-colors ${
                    n.wasUnread
                      ? 'border-[var(--accent-amber)]/40 bg-[var(--accent-amber-dim)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/60'
                  }`}
                >
                  <p className="text-sm text-[var(--text-primary)]">{notificationMessage(n.type, actorName)}</p>
                  <p className="mt-1 font-mono text-[0.68rem] text-[var(--text-muted)]">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )
              return (
                <li key={n.id}>
                  {href ? (
                    <Link href={href} className="block focus-ring rounded-xl">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            title="No notifications yet"
            description="Follows, likes, replies, and mentions will show up here."
          />
        )}
      </PageContainer>
    </main>
  )
}
