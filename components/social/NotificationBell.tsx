import Link from 'next/link'
import { createClient, getUser } from '@/utils/supabase/server'

// Server component: unread count is a cheap indexed query, computed fresh
// on every request since Navbar (its only caller) is itself dynamic. Links
// straight to /notifications -- no live dropdown/polling, there's no
// realtime infra in this codebase to back one yet.
export default async function NotificationBell() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  const unreadCount = count ?? 0

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-ring"
    >
      <span aria-hidden="true" className="text-base">🔔</span>
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-amber)] px-1 font-mono text-[0.6rem] font-semibold text-[var(--text-inverse)]"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
