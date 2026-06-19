import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { login, loginWithDiscord } from '../actions'
import { getFlash } from '@/utils/flash'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to SoapyFans Hub to leave reviews and ratings.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
}

interface Props {
  searchParams: Promise<{ banned?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  const { banned } = await searchParams
  const flash = await getFlash()

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] space-y-8">

        <div>
          <Link
            href="/"
            className="font-display text-sm font-semibold text-[var(--text-muted)] transition-colors duration-150 ease-out hover:text-[var(--text-secondary)]"
          >
            SoapyFans <span className="italic text-[var(--accent-amber)]">Hub</span>
          </Link>
          <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-none tracking-tight text-[var(--text-primary)]">
            Sign in.
          </h1>
        </div>

        {banned && (
          <p className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            Your account has been suspended. Contact us if you think this is a mistake.
          </p>
        )}
        {flash?.type === 'error' && (
          <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {flash.message}
          </p>
        )}
        {flash?.type === 'message' && (
          <p className="rounded-md border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            {flash.message}
          </p>
        )}

        <form action={loginWithDiscord}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-[var(--border-strong)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] transition-[border-color,background-color] duration-150 ease-out hover:border-[var(--accent-amber)]/50 hover:bg-[var(--bg-elevated)]/40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Continue with Discord
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <form action={login} className="space-y-5">
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
              className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-150 ease-out focus:border-[var(--accent-amber)] focus:outline-none focus:ring-0"
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
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] transition-[border-color,box-shadow] duration-150 ease-out focus:border-[var(--accent-amber)] focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-[var(--accent-amber)] px-5 py-3 text-xs font-medium uppercase tracking-[0.28em] text-[var(--bg-base)] transition-[background-color,box-shadow] duration-150 ease-out hover:bg-[var(--accent-gold)] hover:shadow-[0_0_28px_rgba(255,183,0,0.35)]"
          >
            Sign in
            <span aria-hidden className="transition-transform duration-150 ease-out group-hover:translate-x-1">→</span>
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-[var(--accent-gold)] underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>

      </div>
    </main>
  )
}
