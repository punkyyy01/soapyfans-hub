import { createClient, getUser } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'

export default async function Navbar() {
  const user = await getUser()

  let profileHref: string | null = null
  let avatarUrl: string | null = null
  let avatarLetter = ''
  let displayHandle = ''

  if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    profileHref = `/profile/${profile?.username ?? user.id}`
    avatarUrl = profile?.avatar_url ?? null
    avatarLetter = (profile?.username ?? '')[0]?.toUpperCase() ?? ''
    displayHandle = profile?.username ? `@${profile.username}` : ''
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(8,7,4,0.75)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-baseline gap-2 font-display text-[1.35rem] font-semibold tracking-tight text-[var(--text-primary)]"
          >
            <span className="relative">
              <span className="relative z-10">SoapyFans</span>
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[var(--accent-amber)] transition-transform duration-500 group-hover:scale-x-100" />
            </span>
            <span className="text-[var(--accent-amber)] italic">Hub</span>
          </Link>
          <div className="hidden items-center gap-7 text-[0.78rem] uppercase tracking-[0.22em] text-[var(--text-secondary)] sm:flex">
            <Link
              href="/films"
              className="transition-colors hover:text-[var(--accent-gold)]"
            >
              Filmography
            </Link>
            <span className="h-3 w-px bg-[var(--border-strong)]" />
            <Link
              href="/music"
              className="transition-colors hover:text-[var(--accent-gold)]"
            >
              Music
            </Link>
            <span className="h-3 w-px bg-[var(--border-strong)]" />
            <Link
              href="/about"
              className="transition-colors hover:text-[var(--accent-gold)]"
            >
              About
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && profileHref ? (
            <>
              <Link href={profileHref} className="group flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--accent-amber)]/40 bg-gradient-to-br from-[var(--accent-amber)] to-[#7a4108] text-xs font-semibold text-[var(--bg-base)] shadow-[0_0_18px_rgba(232,137,12,0.25)] transition-shadow group-hover:shadow-[0_0_24px_rgba(232,137,12,0.45)]">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={displayHandle || 'User avatar'} width={36} height={36} className="h-full w-full object-cover" />
                  ) : (
                    avatarLetter
                  )}
                </div>
                {displayHandle && (
                  <span className="hidden text-xs text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-gold)] sm:block">
                    {displayHandle}
                  </span>
                )}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="group relative overflow-hidden rounded-full border border-[var(--accent-amber)]/60 px-5 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--accent-gold)] transition-all hover:border-[var(--accent-amber)] hover:shadow-[0_0_22px_rgba(232,137,12,0.35)]"
            >
              <span className="relative z-10">Sign in</span>
              <span className="absolute inset-0 origin-left scale-x-0 bg-[var(--accent-amber)]/15 transition-transform duration-500 group-hover:scale-x-100" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
