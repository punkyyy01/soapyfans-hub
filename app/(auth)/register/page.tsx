import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { register } from '../actions'
import { getFlash } from '@/utils/flash'
import OAuthButtons from '@/components/auth/OAuthButtons'

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

          {/* OAuth Providers: Discord & Google */}
          <OAuthButtons />

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
