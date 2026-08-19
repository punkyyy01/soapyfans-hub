export default function Loading() {
  return (
    <div className="bg-[var(--bg-base)] pt-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
          <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
          <div className="mt-4 h-12 w-48 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <div className="aspect-square w-full animate-pulse rounded-xl bg-[var(--bg-elevated)]/60" />
            <div className="animate-pulse rounded-xl bg-[var(--bg-elevated)]/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
