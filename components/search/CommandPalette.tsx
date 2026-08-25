'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildPaletteItems, EMPTY_PALETTE_RESULTS, type PaletteItem, type PaletteResults } from '@/utils/searchPalette'

interface Props {
  open: boolean
  onClose: () => void
}

const SECTION_ORDER: PaletteItem['section'][] = ['Profiles', 'Titles', 'Reviews', 'News']

export default function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PaletteResults>(EMPTY_PALETTE_RESULTS)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => buildPaletteItems(results), [results])

  // Reset to a clean slate every time the palette opens, and focus the input.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults(EMPTY_PALETTE_RESULTS)
    setActiveIndex(0)
    inputRef.current?.focus()
  }, [open])

  // Debounced live fetch, cancelling any in-flight request from a faster keystroke.
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(EMPTY_PALETTE_RESULTS)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : EMPTY_PALETTE_RESULTS))
        .then((data: PaletteResults) => {
          setResults(data)
          setActiveIndex(0)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setResults(EMPTY_PALETTE_RESULTS)
        })
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((i) => (items.length === 0 ? 0 : (i - 1 + items.length) % items.length))
        return
      }
      if (event.key === 'Enter') {
        const active = items[activeIndex]
        if (active) {
          event.preventDefault()
          router.push(active.href)
          onClose()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, items, activeIndex, onClose, router])

  if (!open) return null

  const trimmed = query.trim()
  const hasQuery = trimmed.length >= 2

  function select(item: PaletteItem) {
    router.push(item.href)
    onClose()
  }

  let runningIndex = -1

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[var(--bg-overlay)]"
      />

      <div className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-full max-w-xl px-4" role="dialog" aria-modal="true" aria-label="Search the archive">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-glass)] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <span className="text-base text-[var(--text-muted)]" aria-hidden="true">⌕</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search profiles, titles, reviews, news…"
              aria-label="Search profiles, titles, reviews, and news"
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            <kbd className="hidden shrink-0 rounded border border-[var(--border-default)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--text-muted)] sm:block">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!hasQuery ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                Type at least 2 characters to search the archive.
              </p>
            ) : loading && items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">Searching…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                No results for &ldquo;{trimmed}&rdquo;.
              </p>
            ) : (
              SECTION_ORDER.map((section) => {
                const sectionItems = items.filter((i) => i.section === section)
                if (sectionItems.length === 0) return null
                return (
                  <div key={section} className="mb-1 last:mb-0">
                    <p className="px-3 pb-1.5 pt-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {section}
                    </p>
                    {sectionItems.map((item) => {
                      runningIndex += 1
                      const index = runningIndex
                      const active = index === activeIndex
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => select(item)}
                          aria-selected={active}
                          className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
                            active ? 'bg-[var(--accent-amber-dim)]' : 'hover:bg-[var(--bg-surface)]'
                          }`}
                        >
                          <span className={`line-clamp-1 font-display text-sm font-medium ${active ? 'text-[var(--accent-amber)]' : 'text-[var(--text-primary)]'}`}>
                            {item.primary}
                          </span>
                          {item.secondary && (
                            <span className="line-clamp-1 text-xs text-[var(--text-secondary)]">{item.secondary}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(trimmed)}`)
                onClose()
              }}
              className="flex w-full items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3 text-left font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] cursor-pointer"
            >
              <span>View all results for &ldquo;{trimmed}&rdquo;</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
