import Link from 'next/link'
import type { BreadcrumbEntry } from '@/utils/schema'

interface BreadcrumbsProps {
  items: BreadcrumbEntry[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-x-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--border-subtle)]">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="text-[var(--text-secondary)]">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
                >
                  {item.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
