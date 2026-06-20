export default function Loading() {
  return (
    <div className="bg-[var(--bg-base)] pt-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-20 border-b border-[var(--border-subtle)] pb-10">
          <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
          <div className="mt-5 h-14 w-64 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="mt-6 h-4 w-96 max-w-full animate-pulse rounded bg-[var(--bg-elevated)]/60" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-elevated)]/60" />
          ))}
        </div>
      </div>
    </div>
  )
}
