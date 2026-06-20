export default function Loading() {
  return (
    <div className="bg-[var(--bg-base)] pt-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
          <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
          <div className="mt-4 h-12 w-48 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-[var(--bg-elevated)]/60" />
          ))}
        </div>
      </div>
    </div>
  )
}
