'use client'

import { useState } from 'react'

interface Props {
  /** Absolute URL, or a site-relative path (resolved against window.location.origin at click time). */
  url: string
  title?: string
  text?: string
  className?: string
}

// Web Share API on mobile/supporting browsers, clipboard copy everywhere
// else -- same "no dedicated state until interacted with" idiom as
// ReportButton, but simpler since there's no follow-up form.
export default function ShareButton({ url, title, text, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    // Accepts a relative path so client-bundled callers (e.g. a card
    // rendered inside a 'use client' list) never need server-only origin
    // resolution (utils/site.ts's absoluteUrl reads Vercel env vars that
    // aren't NEXT_PUBLIC_-prefixed, so they're unavailable in the browser
    // bundle) -- the browser always knows its own origin at click time.
    const resolvedUrl = new URL(url, window.location.origin).toString()

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ url: resolvedUrl, title, text })
        return
      } catch {
        // User cancelled the native share sheet, or it isn't wired up to
        // actually work here -- fall through to the clipboard copy below.
      }
    }
    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied/unavailable -- nothing more we can do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 font-mono text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer focus-ring ${className}`}
      aria-label="Share"
    >
      <span aria-hidden="true">{copied ? '✓' : '⤴'}</span>
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
