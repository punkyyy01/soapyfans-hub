import type { ReactNode } from 'react'

export function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function truncate(s: string | null, len = 90) {
  if (!s) return <span className="text-[var(--text-muted)] italic">—</span>
  return s.length > len ? s.slice(0, len) + '…' : s
}

export function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <p className="text-[0.6rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  )
}

export function TableShell({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-[var(--bg-card)]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[0.58rem] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function ActionBtn({
  action,
  children,
  hidden,
  variant = 'default',
  extraInputs,
}: {
  action: (fd: FormData) => Promise<void>
  children: ReactNode
  hidden?: Record<string, string>
  variant?: 'danger' | 'success' | 'default'
  extraInputs?: ReactNode
}) {
  const color =
    variant === 'danger'
      ? 'text-red-400 hover:text-red-300'
      : variant === 'success'
        ? 'text-emerald-400 hover:text-emerald-300'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'

  return (
    <form action={action} className="inline-flex items-center gap-1">
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {extraInputs}
      <button
        type="submit"
        className={`text-xs font-medium transition-colors duration-100 ${color}`}
      >
        {children}
      </button>
    </form>
  )
}
