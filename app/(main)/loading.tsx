export default function Loading() {
  return (
    <div className="bg-[var(--bg-base)]">
      <div className="relative min-h-[100svh] w-full overflow-hidden sm:min-h-[760px] bg-[var(--bg-elevated)]/20" />

      <section className="mx-auto max-w-7xl px-6 pb-28 sm:px-10">
        <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
          <div className="h-2 w-32 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
          <div className="mt-4 h-14 w-64 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-[var(--bg-elevated)]/60 sm:col-span-2 lg:col-span-2 lg:row-span-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-elevated)]/60" />
          ))}
        </div>
      </section>
    </div>
  )
}
