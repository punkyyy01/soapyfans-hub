'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function FooterClientWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  // Public profile routes (e.g. /profile/username or /profile/[uuid]) render Minimal Profile Closure
  const isPublicProfile = Boolean(pathname?.startsWith('/profile/') && pathname !== '/profile/edit')

  if (isPublicProfile) {
    return null
  }

  return <>{children}</>
}
