'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { sanitizeCSS } from '@/utils/sanitize-css'
import Button from '@/components/ui/Button'

export default function CssPreviewPanel({
  displayName,
  username,
  pronouns,
  bio,
  aboutMe,
  avatarUrl,
  bannerUrl,
  accentColor,
  css,
  onClose,
}: {
  displayName: string
  username: string
  pronouns: string
  bio: string
  aboutMe: string
  avatarUrl: string | null
  bannerUrl: string | null
  accentColor: string
  css: string
  onClose: () => void
}) {
  const sanitized = sanitizeCSS(css)
  const initial = displayName[0]?.toUpperCase() ?? '?'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[var(--bg-base)] p-4 sm:p-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 mx-auto mb-6 flex max-w-5xl items-center justify-between rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 px-6 py-3.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-amber)] font-medium">
            Live Canvas Preview
          </span>
          {!sanitized && css.trim() && (
            <span className="font-mono text-xs text-red-400">
              (CSS blocked: contains disallowed rules)
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close Preview ✕
        </Button>
      </div>

      {/* Scoped Custom CSS */}
      {sanitized && <style>{`#profile-canvas-preview { ${sanitized} }`}</style>}

      {/* Preview Canvas using 4-Layer Architecture */}
      <div
        id="profile-canvas-preview"
        className="profile-canvas mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 shadow-2xl"
      >
        {/* Layer 1: Banner & Overlay */}
        <div
          className="relative z-0 h-[180px] w-full overflow-hidden sm:h-[240px]"
          style={
            !bannerUrl
              ? {
                  background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}12 60%, transparent 100%)`,
                }
              : undefined
          }
        >
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt="Banner preview"
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-center"
              unoptimized={bannerUrl.startsWith('blob:')}
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent opacity-80"
          />
        </div>

        {/* Layer 2: Profile Content */}
        <div className="relative z-10 px-6 pb-16 pt-0 sm:px-10 sm:pb-20">
          <div className="relative z-20 -mt-12 flex flex-wrap items-end gap-4 sm:-mt-16">
            {/* Layer 3: Independent Avatar */}
            <div
              className="relative shrink-0 rounded-full isolate"
              style={{
                padding: '4px',
                background: accentColor,
                boxShadow: '0 0 0 4px var(--bg-surface)',
              }}
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--bg-base)] sm:h-28 sm:w-28">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover object-center rounded-full"
                    unoptimized={avatarUrl.startsWith('blob:')}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center rounded-full font-display text-3xl font-medium text-[var(--bg-base)] sm:text-4xl"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)`,
                    }}
                  >
                    {initial}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {displayName || 'Your Display Name'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {username && (
                  <span className="font-mono text-sm text-[var(--text-muted)]">@{username}</span>
                )}
                {pronouns && (
                  <>
                    <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
                    <span className="text-xs italic text-[var(--text-muted)]">{pronouns}</span>
                  </>
                )}
              </div>
            </div>

            {bio && (
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
                {bio}
              </p>
            )}

            {aboutMe && (
              <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 space-y-3">
                <div>
                  <p className="text-eyebrow">About Me</p>
                  <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-[var(--text-primary)]">
                    A little more about me
                  </h2>
                </div>
                <div className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                  {aboutMe}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
