import { createClient, getUser } from '@/utils/supabase/server'

export type UnseenContentFlags = {
  hasNewNews: boolean
  hasNewMusic: boolean
}

const NONE: UnseenContentFlags = { hasNewNews: false, hasNewMusic: false }

// Computed fresh on every navbar render, same tradeoff as NotificationBell's
// unread count (see its own comment) -- no realtime infra to cache this
// against, and news_items/releases are both small tables so a "latest row"
// lookup on each is cheap.
export async function getUnseenContentFlags(): Promise<UnseenContentFlags> {
  const user = await getUser()
  if (!user) return NONE

  const supabase = await createClient()

  const [seenRow, latestNews, latestRelease] = await Promise.all([
    supabase.from('content_seen').select('news_seen_at, releases_seen_at').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('news_items')
      .select('published_at')
      .eq('status', 'approved')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('releases').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const newsSeenAt = seenRow.data?.news_seen_at ? new Date(seenRow.data.news_seen_at) : null
  const releasesSeenAt = seenRow.data?.releases_seen_at ? new Date(seenRow.data.releases_seen_at) : null

  const hasNewNews = Boolean(
    latestNews.data && (!newsSeenAt || new Date(latestNews.data.published_at) > newsSeenAt),
  )
  const hasNewMusic = Boolean(
    latestRelease.data && (!releasesSeenAt || new Date(latestRelease.data.created_at) > releasesSeenAt),
  )

  return { hasNewNews, hasNewMusic }
}
