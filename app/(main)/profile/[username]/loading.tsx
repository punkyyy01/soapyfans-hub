export default function Loading() {
  return (
    <div className="bg-[var(--bg-base)]">
      <div className="h-[170px] w-full animate-pulse bg-[var(--bg-elevated)]/30 sm:h-[230px]" />

      <div className="mx-auto max-w-4xl px-6 pb-24 sm:px-10 sm:pb-32">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <div className="h-24 w-24 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--bg-elevated)]/60" />
          <div className="h-3 w-64 animate-pulse rounded-full bg-[var(--bg-elevated)]/40" />
        </div>

        <div className="mt-10 border-b border-[var(--border-subtle)]" />

        <div className="mt-14 space-y-7">
          <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--bg-elevated)]/60" />
          <div className="h-7 w-36 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-elevated)]/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
