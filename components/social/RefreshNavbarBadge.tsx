'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// NotificationsPage marks everything read server-side during its own
// render, but Navbar/NotificationBell live in the root layout -- a
// segment Next.js keeps mounted across client-side navigations instead
// of refetching, so the unread badge keeps showing the pre-visit count
// until a hard reload. router.refresh() re-pulls the whole route tree
// (including the layout) so the badge catches up right away, and stays
// caught up on subsequent navigations too.
export default function RefreshNavbarBadge() {
  const router = useRouter()

  useEffect(() => {
    router.refresh()
  }, [router])

  return null
}
