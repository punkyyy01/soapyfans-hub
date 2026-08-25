import Link from 'next/link'

// Same icon-button shape as components/social/NotificationBell.tsx --
// links straight to the search page rather than a live-typeahead dropdown,
// keeping this simple to match the rest of Navbar's controls.
export default function SearchButton() {
  return (
    <Link
      href="/search"
      aria-label="Search the archive"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] focus-ring"
    >
      <span aria-hidden="true" className="text-base">⌕</span>
    </Link>
  )
}
