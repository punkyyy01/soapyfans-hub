import type { ReactNode } from 'react'

interface SectionHeaderProps {
  kicker?: string | ReactNode
  title: string | ReactNode
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  kicker,
  title,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-10 flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="space-y-1.5">
        {kicker && (
          <p className="text-eyebrow">
            {kicker}
          </p>
        )}
        <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h2>
      </div>

      {action && (
        <div className="shrink-0 sm:self-end">
          {action}
        </div>
      )}
    </div>
  )
}

export default SectionHeader
