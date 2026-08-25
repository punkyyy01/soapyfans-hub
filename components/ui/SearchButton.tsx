'use client'

import { useEffect, useRef, useState } from 'react'
import CommandPalette from '@/components/search/CommandPalette'

// Icon-button shape matches components/social/NotificationBell.tsx. Opens
// the command palette (click, or the global Cmd/Ctrl+K shortcut) instead
// of navigating to /search directly -- /search itself is still there as
// the "view all results" fallback the palette links out to.
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-ring"
      >
        <span aria-hidden="true" className="text-base">⌕</span>
      </button>
      <CommandPalette open={open} onClose={close} />
    </>
  )
}
