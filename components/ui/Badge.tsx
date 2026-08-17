import type { ReactNode } from 'react'

export type BadgeVariant = 'film' | 'tv' | 'music' | 'award' | 'neutral'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  film: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]/30',
  tv: 'bg-[var(--accent-forest-dim)] text-[var(--text-primary)] ring-1 ring-[var(--accent-forest)]/40',
  music: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] ring-1 ring-[var(--accent-amber)]/30',
  award: 'bg-[var(--accent-gold-dim)] text-[var(--accent-gold)] ring-1 ring-[var(--accent-gold)]/40',
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]',
}

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.6rem] tracking-[0.14em]',
  md: 'px-2.5 py-1 text-[0.68rem] tracking-[0.16em]',
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono uppercase font-medium backdrop-blur-xs select-none ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
