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
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 14.5 18 8Z" />
        <path d="M13.73 20a2 2 0 0 1-3.46 0" />
      </svg>
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
