import Link from 'next/link'
import { getAuthUserWithProfile } from '@/utils/supabase/server'

export function FooterFallback() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 sm:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md space-y-3">
            <Link
              href="/"
              className="group inline-flex items-baseline gap-2 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            >
              <span>SoapyFans</span>
              <span className="italic text-[var(--accent-amber)]">Hub</span>
            </Link>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              An unofficial fan archive celebrating the work and artistry of Sophie Thatcher across film, television, and music.
            </p>
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Fan-made archive · Unofficial
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 lg:flex-col lg:items-end">
            <nav
              aria-label="Secondary navigation"
              className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
            >
              <Link href="/" className="transition-colors hover:text-[var(--accent-gold)]">
                Home
              </Link>
              <Link href="/films" className="transition-colors hover:text-[var(--accent-gold)]">
                Filmography
              </Link>
              <Link href="/music" className="transition-colors hover:text-[var(--accent-gold)]">
                Music
              </Link>
              <Link href="/about" className="transition-colors hover:text-[var(--accent-gold)]">
                About
              </Link>
            </nav>

            <a
              href="https://ko-fi.com/punkyyyy"
              target="_blank"
              rel="noreferrer noopener sponsored"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
              aria-label="Support this archive on Ko-fi"
            >
              Support this archive · Ko-fi
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border-subtle)] pt-8 sm:mt-14" />

        <div className="flex flex-col gap-5 text-xs leading-relaxed text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-[0.7rem] uppercase tracking-[0.26em]">
              © {year} SoapyFans Hub
            </p>
            <span className="hidden text-[var(--border-strong)] sm:inline" aria-hidden="true">
              ·
            </span>
            <p>
              Uses the TMDB API, but is not endorsed or certified by TMDB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] uppercase tracking-[0.24em]">
            <Link href="/privacy" className="transition-colors hover:text-[var(--accent-gold)]">
              Privacy Policy
            </Link>
            <span className="text-[var(--border-strong)]" aria-hidden="true">
              ·
            </span>
            <Link href="/terms" className="transition-colors hover:text-[var(--accent-gold)]">
              Terms of Service
            </Link>
            <span className="text-[var(--border-strong)]" aria-hidden="true">
              ·
            </span>
            <Link href="/contact" className="transition-colors hover:text-[var(--accent-gold)]">
              Copyright &amp; Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default async function Footer() {
  const { user, profileHref } = await getAuthUserWithProfile()
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 sm:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md space-y-3">
            <Link
              href="/"
              className="group inline-flex items-baseline gap-2 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            >
              <span>SoapyFans</span>
              <span className="italic text-[var(--accent-amber)]">Hub</span>
            </Link>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              An unofficial fan archive celebrating the work and artistry of Sophie Thatcher across film, television, and music.
            </p>
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Fan-made archive · Unofficial
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 lg:flex-col lg:items-end">
            <nav
              aria-label="Secondary navigation"
              className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
            >
              <Link href="/" className="transition-colors hover:text-[var(--accent-gold)]">
                Home
              </Link>
              <Link href="/films" className="transition-colors hover:text-[var(--accent-gold)]">
                Filmography
              </Link>
              <Link href="/music" className="transition-colors hover:text-[var(--accent-gold)]">
                Music
              </Link>
              <Link href="/about" className="transition-colors hover:text-[var(--accent-gold)]">
                About
              </Link>
              {user ? (
                <Link
                  href={profileHref ?? `/profile/${user.id}`}
                  className="transition-colors hover:text-[var(--accent-gold)]"
                >
                  Profile
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="transition-colors hover:text-[var(--accent-gold)]"
                >
                  Sign in
                </Link>
              )}
            </nav>

            <a
              href="https://ko-fi.com/punkyyyy"
              target="_blank"
              rel="noreferrer noopener sponsored"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
              aria-label="Support this archive on Ko-fi"
            >
              Support this archive · Ko-fi
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border-subtle)] pt-8 sm:mt-14" />

        <div className="flex flex-col gap-5 text-xs leading-relaxed text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-[0.7rem] uppercase tracking-[0.26em]">
              © {year} SoapyFans Hub
            </p>
            <span className="hidden text-[var(--border-strong)] sm:inline" aria-hidden="true">
              ·
            </span>
            <p>
              Uses the TMDB API, but is not endorsed or certified by TMDB.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] uppercase tracking-[0.24em]">
            <Link href="/privacy" className="transition-colors hover:text-[var(--accent-gold)]">
              Privacy Policy
            </Link>
            <span className="text-[var(--border-strong)]" aria-hidden="true">
              ·
            </span>
            <Link href="/terms" className="transition-colors hover:text-[var(--accent-gold)]">
              Terms of Service
            </Link>
            <span className="text-[var(--border-strong)]" aria-hidden="true">
              ·
            </span>
            <Link href="/contact" className="transition-colors hover:text-[var(--accent-gold)]">
              Copyright &amp; Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
