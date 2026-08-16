'use client'

import { useState } from 'react'

interface OAuthButtonsProps {
  redirectTo?: string
}

export default function OAuthButtons({ redirectTo }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'discord' | 'google' | null>(null)

  function handleClick(provider: 'discord' | 'google') {
    setLoadingProvider(provider)
    // Auto-reset loading state after 4.5 seconds to allow retry if window is closed
    setTimeout(() => {
      setLoadingProvider(null)
    }, 4500)
  }

  const querySuffix = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''

  return (
    <div className="space-y-3">
      {/* Discord OAuth — Opens in a new tab */}
      <form
        action={`/auth/login/discord${querySuffix}`}
        method="POST"
        target="_blank"
        onSubmit={() => handleClick('discord')}
      >
        <button
          type="submit"
          disabled={loadingProvider === 'discord'}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--border-strong)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] transition-[border-color,background-color] duration-150 ease-out hover:border-[var(--accent-amber)]/50 hover:bg-[var(--bg-elevated)]/40 disabled:cursor-wait disabled:opacity-60"
        >
          {loadingProvider === 'discord' ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-amber)] border-t-transparent" />
              <span>Connecting to Discord…</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              <span>Continue with Discord</span>
            </>
          )}
        </button>
      </form>

      {/* Google OAuth — Opens in a new tab */}
      <form
        action={`/auth/login/google${querySuffix}`}
        method="POST"
        target="_blank"
        onSubmit={() => handleClick('google')}
      >
        <button
          type="submit"
          disabled={loadingProvider === 'google'}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--border-strong)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] transition-[border-color,background-color] duration-150 ease-out hover:border-[var(--accent-amber)]/50 hover:bg-[var(--bg-elevated)]/40 disabled:cursor-wait disabled:opacity-60"
        >
          {loadingProvider === 'google' ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-amber)] border-t-transparent" />
              <span>Connecting to Google…</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
