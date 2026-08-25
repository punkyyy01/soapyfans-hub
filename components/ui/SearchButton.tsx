'use client'

import { useEffect, useRef, useState } from 'react'
import CommandPalette from '@/components/search/CommandPalette'

// Icon-button shape matches components/social/NotificationBell.tsx. Opens
// the command palette (click, or the global Cmd/Ctrl+K shortcut) instead
// of navigating to /search directly -- /search itself is still there as
// the "view all results" fallback the palette links out to.
//
// On md+ screens the trigger renders as a real search-field-shaped
// control (icon + "Search…" placeholder + shortcut hint) rather than a
// bare icon, so it reads as search rather than disappearing into the
// navbar; mobile keeps the compact icon-only button since there's no
// room for the full pill there.
const searchIconPath = (
  <>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
)

export default function SearchButton() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the archive"
        className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pl-3 pr-2.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] focus-ring md:flex"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 shrink-0"
        >
          {searchIconPath}
        </svg>
        <span>Search…</span>
        <kbd className="ml-3 hidden shrink-0 rounded border border-[var(--border-default)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--text-muted)] lg:block">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the archive"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-ring md:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px]"
        >
          {searchIconPath}
        </svg>
      </button>

      <CommandPalette open={open} onClose={close} />
    </>
  )
}
