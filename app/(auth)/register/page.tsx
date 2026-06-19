import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { loginWithDiscord, register } from '../actions'
import { getFlash } from '@/utils/flash'

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Register on SoapyFans Hub to leave reviews and ratings.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/register' },
}

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  const flash = await getFlash()

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(380px,520px)]">
      <aside className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(232,137,12,0.18)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(42,92,63,0.28)_0%,transparent_55%),linear-gradient(180deg,#16140d_0%,#080704_100%)]" />
        <div className="absolute inset-0 grain" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link
            href="/"
            className="font-display text-xl font-semibold text-[var(--text-primary)]"
          >
            SoapyFans <span className="italic text-[var(--accent-amber)]">Hub</span>
          </Link>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
              Be the first
            </p>
            <h2 className="mt-6 max-w-md font-display text-3xl font-medium leading-[1.15] tracking-tight text-[var(--text-primary)] text-balance">
              An archive is just paper until someone{' '}
              <span className="italic text-[var(--accent-gold)]">reads it back.</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              Sign up to leave reviews, save favorites, and help shape what this fan site
              becomes.
            </p>
          </div>
          <div className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
            An archive · est. 2026
          </div>
        </div>
      </aside>

      <section className="relative flex items-center justify-center px-6 py-20 sm:px-10">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
              New here?
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
              Create account.
            </h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Get your seat at the bonfire.
            </p>
          </div>

          {flash?.type === 'error' && (
            <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {flash.message}
            </p>
          )}

          <form action={loginWithDiscord}>
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)]/60 px-4 py-3 text-sm text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)]/60 hover:bg-[var(--bg-elevated)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Continue with Discord
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-[0.65rem] uppercase tracking-[0.32em]">
              <span className="bg-[var(--bg-base)] px-3 text-[var(--text-muted)]">or</span>
            </div>
          </div>

          <form action={register} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-secondary)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-secondary)]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-amber)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">Minimum 6 characters</p>
            </div>
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-[var(--accent-amber)] px-5 py-3 text-xs font-medium uppercase tracking-[0.28em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_32px_rgba(255,183,0,0.4)]"
            >
              Create account
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-[var(--accent-gold)] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
