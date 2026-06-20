import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
        Lost in the archive
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        404 — Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        This reel doesn&apos;t exist — or it&apos;s been filed under a different name.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-[var(--accent-amber)]/60 px-6 py-2.5 text-xs uppercase tracking-[0.22em] text-[var(--accent-gold)] transition-all hover:border-[var(--accent-amber)] hover:shadow-[0_0_22px_rgba(232,137,12,0.35)]"
      >
        Back to Home
      </Link>
    </div>
  )
}
