'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

/**
 * Wraps next/image and swaps to `fallback` on load error (e.g. a stale
 * Spotify cover art URL returning 404) without issuing another request.
 */
export default function SafeImage({
  fallback,
  ...props
}: ImageProps & { fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return <Image {...props} onError={() => setFailed(true)} />
}
