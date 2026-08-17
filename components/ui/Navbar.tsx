import { getAuthUserWithProfile } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'

export default async function Navbar() {
  const { user, profile, profileHref } = await getAuthUserWithProfile()

  let avatarUrl: string | null = null
  let avatarLetter = ''
  let displayHandle = ''

  if (user) {
    avatarUrl = profile?.avatar_url ?? null
    avatarLetter = (profile?.username ?? user.email ?? 'U')[0]?.toUpperCase() ?? 'U'
    displayHandle = profile?.username ? `@${profile.username}` : ''
  }

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-glass)] backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-10">
        {/* Left: Brand + Nav Links */}
        <div className="flex items-center gap-10">
          <Link
            href="/"
            aria-label="SoapyFans Hub Home"
            className="group flex items-baseline gap-1.5 font-display text-[1.25rem] font-semibold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-90 focus-ring rounded-sm"
          >
            <span>SoapyFans</span>
            <span className="italic text-[var(--accent-amber)] font-normal">Hub</span>
          </Link>

          <div className="hidden items-center gap-7 text-xs uppercase tracking-[0.16em] font-medium text-[var(--text-secondary)] sm:flex">
            <Link
              href="/films"
              className="transition-colors hover:text-[var(--text-primary)] focus-ring rounded-sm py-1"
            >
              Filmography
            </Link>
            <Link
              href="/music"
              className="transition-colors hover:text-[var(--text-primary)] focus-ring rounded-sm py-1"
            >
              Music
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-[var(--text-primary)] focus-ring rounded-sm py-1"
            >
              About
            </Link>
          </div>
        </div>

        {/* Right: Auth State */}
        <div className="flex items-center gap-4">
          {user && profileHref ? (
            <div className="flex items-center gap-3">
              <Link
                href={profileHref}
                className="group flex items-center gap-2.5 rounded-full p-0.5 transition-colors focus-ring"
                aria-label="View your profile"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--accent-amber)]/40 bg-[var(--bg-card)] text-xs font-semibold text-[var(--accent-amber)] shadow-xs">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayHandle || 'User avatar'}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>
                {displayHandle && (
                  <span className="hidden text-xs font-medium text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)] sm:block">
                    {displayHandle}
                  </span>
                )}
              </Link>

              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--border-default)] px-3.5 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] focus-ring cursor-pointer"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent-amber)] px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] font-medium text-[var(--text-inverse)] shadow-[0_2px_10px_rgba(232,137,12,0.2)] transition-all hover:bg-[var(--accent-amber-hover)] hover:shadow-[0_3px_16px_rgba(232,137,12,0.35)] focus-ring"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

