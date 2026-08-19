export default function Loading() {
  return (
    <div className="bg-[var(--bg-base)]">
      <div className="relative min-h-[90vh] w-full overflow-hidden sm:min-h-[720px] bg-[var(--bg-elevated)]/20" />

      <section className="mx-auto max-w-7xl px-6 pb-28 sm:px-10">
        <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
          <div className="h-2 w-32 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
          <div className="mt-4 h-14 w-64 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-[var(--bg-elevated)]/60" />
          ))}
        </div>
      </section>
    </div>
  )
}
