import type { ReactNode } from 'react'

interface MetadataProps {
  label: string | ReactNode
  value: string | ReactNode
  variant?: 'inline' | 'stacked' | 'row'
  className?: string
}

export function MetadataItem({
  label,
  value,
  variant = 'row',
  className = '',
}: MetadataProps) {
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-metadata ${className}`}>
        <span className="text-[var(--text-muted)]">{label}:</span>
        <span className="text-[var(--text-secondary)] font-medium">{value}</span>
      </span>
    )
  }

  if (variant === 'stacked') {
    return (
      <div className={`space-y-1 ${className}`}>
        <p className="text-kicker text-[0.65rem]">{label}</p>
        <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5 text-xs text-metadata ${className}`}
    >
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-secondary)] font-medium">{value}</span>
    </div>
  )
}

export default MetadataItem
