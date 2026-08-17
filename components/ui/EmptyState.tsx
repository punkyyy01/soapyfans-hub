import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center sm:py-16 ${className}`}
    >
      {icon && (
        <div className="mb-4 text-3xl text-[var(--accent-amber)]/60">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState
