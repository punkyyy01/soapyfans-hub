'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { INPUT_CLS } from './editFormStyles'

export type FavoriteSearchResult = {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_url: string | null
  year: string | null
}

export default function FavoritesSearchModal({
  onAdd,
  onClose,
  disabled,
}: {
  onAdd: (r: FavoriteSearchResult) => void
  onClose: () => void
  disabled: boolean
}) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<FavoriteSearchResult[]>([])
  const [isSearching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/tmdb-search?q=${encodeURIComponent(q.trim())}`)
      const { results: data } = (await res.json()) as { results: FavoriteSearchResult[] }
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-20 sm:pt-28 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <p className="text-eyebrow">
            Add to Sophie Picks
          </p>
          <button
            onClick={onClose}
            className="text-lg text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer focus-ring"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Sophie Thatcher films &amp; shows…"
            className={INPUT_CLS}
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto px-6 py-4">
          {isSearching && (
            <p className="py-6 text-center font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Searching credits…
            </p>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No Sophie Thatcher credits found for &ldquo;{query}&rdquo;.
            </p>
          )}

          {!isSearching && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((r) => {
                const posterUrl = r.poster_url

                return (
                  <li key={`${r.tmdb_id}-${r.media_type}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(r)}
                      className="flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-ring"
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={r.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[0.6rem] text-[var(--text-muted)]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {r.title}
                        </p>
                        <p className="font-mono text-[0.68rem] text-[var(--text-muted)] uppercase tracking-wider">
                          {r.year ?? '—'} · {r.media_type === 'movie' ? 'Film' : 'Television'}
                        </p>
                      </div>
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)]">
                        + Add
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {query.length < 2 && (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              Type at least 2 characters to search filmography.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
