import Link from 'next/link'

// Same icon-button shape as components/social/NotificationBell.tsx for the
// mobile/tablet fallback. On md+ screens (once the nav links and search
// both have room) this renders as a real input (submits a plain GET to
// /search, same pattern as that page's own search form) so people can type
// a query straight from the navbar instead of just linking out to an empty
// search page.
export default function SearchButton() {
  return (
    <>
      <form method="GET" action="/search" className="hidden md:block">
        <label htmlFor="navbar-search" className="sr-only">
          Search the archive
        </label>
        <div className="relative flex items-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--text-muted)]"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="navbar-search"
            name="q"
            type="search"
            placeholder="Search…"
            className="w-32 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:w-48 focus-ring lg:w-44 lg:focus:w-60"
          />
        </div>
      </form>

      <Link
        href="/search"
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
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </Link>
    </>
  )
}
