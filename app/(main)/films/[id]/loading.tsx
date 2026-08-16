export default function Loading() {
  return (
    <main className="relative bg-[var(--bg-base)]">
      <div className="h-[420px] w-full animate-pulse bg-[var(--bg-elevated)]/30 sm:h-[480px]" />

      <div className="mx-auto max-w-6xl px-6 pb-32 pt-6 sm:px-10">
        <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
        <div className="mt-4 h-3 w-32 animate-pulse rounded-full bg-[var(--bg-elevated)]/60" />
        <div className="mt-3 h-14 w-2/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
        <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-[var(--bg-elevated)]/50" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-[var(--bg-elevated)]/60" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--bg-elevated)]/60" />
                  <div className="h-3 w-14 animate-pulse rounded-full bg-[var(--bg-elevated)]/40" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-10 lg:pt-12">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-elevated)]/60" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--bg-elevated)]/60" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--bg-elevated)]/60" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--bg-elevated)]/50" />
          </div>
        </div>
      </div>
    </main>
  )
}
