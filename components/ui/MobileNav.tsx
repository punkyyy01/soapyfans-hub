'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, isNavLinkActive } from './navLinks'

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const firstLink = panelRef.current?.querySelector('a')
    ;(firstLink as HTMLElement | null)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="-ml-1.5 flex h-10 w-10 items-center justify-center rounded-full focus-ring"
      >
        <span className="relative block h-3.5 w-4">
          <span
            className={`absolute inset-x-0 top-0 h-[1.5px] bg-[var(--text-primary)] transition-transform duration-200 ${
              open ? 'translate-y-[6.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-[var(--text-primary)] transition-opacity duration-200 ${
              open ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-[var(--text-primary)] transition-transform duration-200 ${
              open ? '-translate-y-[6.5px] -rotate-45' : ''
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 top-16 bottom-0 z-40 bg-[var(--bg-overlay)]"
          />
          <div
            id="mobile-nav-panel"
            ref={panelRef}
            className="fixed inset-x-0 top-16 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-glass)] px-6 py-2 backdrop-blur-md"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col">
              {NAV_LINKS.map((link) => {
                const isActive = isNavLinkActive(link.href, pathname)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center py-3.5 text-sm uppercase tracking-[0.14em] font-medium focus-ring rounded-sm ${
                      isActive ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
