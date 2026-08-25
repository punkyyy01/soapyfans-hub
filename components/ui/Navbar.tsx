import { getAuthUserWithProfile } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import NotificationBell from '@/components/social/NotificationBell'
import NavbarLinks from './NavbarLinks'
import MobileNav from './MobileNav'

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
        {/* Left: Brand Identity + Navigation Links */}
        <div className="flex items-center gap-3 sm:gap-10">
          <Link
            href="/"
            aria-label="SoapyFans Hub Home"
            className="group flex items-baseline gap-1.5 font-display text-[1.25rem] font-semibold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-90 focus-ring rounded-sm"
          >
            <span>SoapyFans</span>
            <span className="italic text-[var(--accent-amber)] font-normal">Hub</span>
          </Link>

          <MobileNav />
          <NavbarLinks />
        </div>

        {/* Right: Auth State */}
        <div className="flex items-center gap-3">
          {user && profileHref ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href={profileHref}
                className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-[var(--bg-surface)] focus-ring"
                aria-label="View your profile"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)]">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayHandle || 'User avatar'}
                      width={28}
                      height={28}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>
                {displayHandle && (
                  <span className="hidden font-mono text-xs text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)] sm:block">
                    {displayHandle}
                  </span>
                )}
              </Link>

              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--border-default)] px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] focus-ring cursor-pointer"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border-strong)] px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:bg-[var(--accent-amber-dim)] focus-ring"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

