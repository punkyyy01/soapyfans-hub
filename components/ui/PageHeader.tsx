import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string | ReactNode
  title: string | ReactNode
  description?: string | ReactNode
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-14 border-b border-[var(--border-subtle)] pb-8 sm:mb-16 sm:pb-10 ${className}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow && (
            <p className="text-eyebrow">
              {eyebrow}
            </p>
          )}

          <h1 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-medium leading-[0.98] tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>

          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-4 lg:self-end">
            {actions}
          </div>
        )}
      </div>

      {meta && (
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--border-subtle)] pt-5 text-metadata">
          {meta}
        </div>
      )}
    </header>
  )
}

export default PageHeader
