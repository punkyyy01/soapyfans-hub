import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { login } from '../actions'
import { getFlash } from '@/utils/flash'
import OAuthButtons from '@/components/auth/OAuthButtons'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to SoapyFans Hub to leave reviews and ratings.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/login' },
}

interface Props {
  searchParams: Promise<{ banned?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')

  const { banned, error } = await searchParams
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
        {error && (
          <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {decodeURIComponent(error)}
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

        {/* OAuth Providers: Discord (New Tab) & Google (New Tab) */}
        <OAuthButtons />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
            or
          </span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        {/* Email & Password Form */}
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
            <span
              aria-hidden
              className="transition-transform duration-150 ease-out group-hover:translate-x-1"
            >
              →
            </span>
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
