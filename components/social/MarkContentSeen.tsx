'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markContentSeen } from '@/app/(main)/content-actions'

// Fire-and-forget: records that this user has viewed /news or /music, then
// refreshes the route tree so Navbar's unseen-content dot (read fresh on
// every request, same as NotificationBell) clears without a hard reload.
// Renders null and only refreshes when the write actually happened --
// signed-out visitors are the majority of traffic on these pages and
// shouldn't pay for an extra RSC round trip on every view.
export default function MarkContentSeen({ kind }: { kind: 'news' | 'releases' }) {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    markContentSeen(kind).then((didWrite) => {
      if (didWrite && !cancelled) router.refresh()
    })
    return () => {
      cancelled = true
    }
  }, [kind, router])

  return null
}
