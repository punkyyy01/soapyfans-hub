'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, isNavLinkActive } from './navLinks'

interface Props {
  unseenHrefs?: string[]
}

export default function NavbarLinks({ unseenHrefs = [] }: Props) {
  const pathname = usePathname()

  return (
    <div className="hidden items-center gap-7 text-xs uppercase tracking-[0.14em] font-medium sm:flex">
      {NAV_LINKS.map((link) => {
        const isActive = isNavLinkActive(link.href, pathname)
        const hasUnseen = unseenHrefs.includes(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative py-1 transition-colors hover:text-[var(--text-primary)] focus-ring rounded-sm ${
              isActive
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <span>{link.label}</span>
            {hasUnseen && (
              <span
                aria-hidden="true"
                className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]"
              />
            )}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-[var(--accent-amber)]"
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}
