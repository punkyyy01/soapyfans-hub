import Link from 'next/link'
import { getAuthUserWithProfile } from '@/utils/supabase/server'

interface FooterLayoutProps {
  user?: { id: string } | null
  profileHref?: string | null
}

function FooterLayout({ user, profileHref }: FooterLayoutProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 sm:py-16">
        {/* ── Top Grid: Identity, Navigation, Support ────────── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Identity (Pillar 1) */}
          <div className="space-y-4 lg:col-span-6">
            <Link
              href="/"
              className="inline-flex items-baseline gap-1.5 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-90 focus-ring rounded-sm"
            >
              <span>SoapyFans</span>
              <span className="italic text-[var(--accent-amber)] font-normal">Hub</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              An unofficial fan archive celebrating the work and artistry of actress and musician Sophie Thatcher across film, television, and music.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]" />
              Fan Archive · Est. 2026
            </div>
          </div>

          {/* Navigation (Pillar 2) */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-kicker text-[0.68rem]">
              Navigation
            </p>
            <nav
              aria-label="Secondary navigation"
              className="flex flex-col space-y-2 text-xs uppercase tracking-[0.14em]"
            >
              <Link href="/" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                Home
              </Link>
              <Link href="/films" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                Filmography
              </Link>
              <Link href="/music" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                Music
              </Link>
              <Link href="/about" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                About
              </Link>
              {user ? (
                <Link
                  href={profileHref ?? `/profile/${user.id}`}
                  className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5"
                >
                  My Profile
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>

          {/* Support (Pillar 3) */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-kicker text-[0.68rem]">
              Community Support
            </p>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              This independent project is built and maintained for fans. Support server and database costs on Ko-fi.
            </p>
            <a
              href="https://ko-fi.com/punkyyyy"
              target="_blank"
              rel="noreferrer noopener sponsored"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-amber-dim)] focus-ring"
              aria-label="Support this archive on Ko-fi (opens in a new tab)"
            >
              <span>Support on Ko-fi</span>
              <span aria-hidden="true" className="text-[var(--accent-amber)]">↗</span>
            </a>
          </div>
        </div>

        {/* ── Bottom Bar: Attribution & Legal (Pillar 4) ───── */}
        <div className="mt-12 border-t border-[var(--border-subtle)] pt-8 sm:mt-14">
          <div className="flex flex-col gap-5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="font-mono text-[0.7rem] tracking-wider text-[var(--text-secondary)]">
                © {year} SoapyFans Hub
              </span>
              <span className="hidden text-[var(--border-default)] sm:inline" aria-hidden="true">
                ·
              </span>
              <p>
                Uses the TMDB API, but is not endorsed or certified by TMDB.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.7rem] uppercase tracking-[0.14em]">
              <Link href="/privacy" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                Privacy
              </Link>
              <span className="text-[var(--border-default)]" aria-hidden="true">
                ·
              </span>
              <Link href="/terms" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                Terms
              </Link>
              <span className="text-[var(--border-default)]" aria-hidden="true">
                ·
              </span>
              <Link href="/contact" className="transition-colors hover:text-[var(--text-primary)] focus-ring py-0.5">
                Copyright &amp; Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function FooterFallback() {
  return <FooterLayout />
}

export default async function Footer() {
  const { user, profileHref } = await getAuthUserWithProfile()
  return <FooterLayout user={user} profileHref={profileHref} />
}

