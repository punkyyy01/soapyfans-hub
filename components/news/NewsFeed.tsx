'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NewsCard, { type NewsCardItem } from '@/components/news/NewsCard'
import EmptyState from '@/components/ui/EmptyState'
import { isValidNewsTag } from '@/utils/news'
import { NEWS_TAG_FILTERS, NEWS_TAG_LABEL, dedupNewsForDisplay } from '@/utils/news-display'
import { fetchNewsBatch } from '@/app/(main)/news/actions'

interface Props {
  initialItems: NewsCardItem[]
  initialHasMore: boolean
  activeTag: string | null
  initialQuery: string
}

export default function NewsFeed({
  initialItems,
  initialHasMore,
  activeTag,
  initialQuery,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<NewsCardItem[]>(initialItems)
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore)
  const [searchInput, setSearchInput] = useState<string>(initialQuery)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  // Sync state when server props change (e.g. tag switch or URL search param change)
  useEffect(() => {
    setItems(initialItems)
    setHasMore(initialHasMore)
    setSearchInput(initialQuery)
  }, [initialItems, initialHasMore, initialQuery, activeTag])

  // Handle Search Input submission or Enter key
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    const params = new URLSearchParams()
    if (activeTag) params.set('tag', activeTag)
    if (trimmed) params.set('q', trimmed)

    const newUrl = params.toString() ? `/news?${params.toString()}` : '/news'
    startTransition(() => {
      router.push(newUrl)
    })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    const params = new URLSearchParams()
    if (activeTag) params.set('tag', activeTag)
    const newUrl = params.toString() ? `/news?${params.toString()}` : '/news'
    startTransition(() => {
      router.push(newUrl)
    })
  }

  // Handle Load More
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)

    try {
      const res = await fetchNewsBatch({
        tag: activeTag,
        query: initialQuery,
        offset: items.length,
        limit: 12,
      })

      setItems((prev) => {
        const combined = [...prev, ...res.items]
        return dedupNewsForDisplay(combined)
      })
      setHasMore(res.hasMore)
    } catch (err) {
      console.error('[NewsFeed] Failed to load more stories:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Build tag filter URLs preserving search query
  const getTagUrl = (tag: string | null) => {
    const params = new URLSearchParams()
    if (tag) params.set('tag', tag)
    if (initialQuery) params.set('q', initialQuery)
    const str = params.toString()
    return str ? `/news?${str}` : '/news'
  }

  return (
    <div className="space-y-8">
      {/* ── Search & Tag Filters Bar ────────────────────────── */}
      <div className="space-y-5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <label htmlFor="news-search" className="sr-only">
            Search news stories, topics, or outlets
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-sm text-[var(--text-muted)]" aria-hidden="true">
              ⌕
            </span>
            <input
              id="news-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search stories, topics, or outlets…"
              className="w-full rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pl-9 pr-20 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-ring"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search query"
                  className="rounded-full p-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-ring"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-amber-dim)] hover:text-[var(--accent-amber)] transition-all focus-ring"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={getTagUrl(null)}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-all focus-ring ${
              !activeTag
                ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </Link>
          {NEWS_TAG_FILTERS.map(({ tag, label }) => (
            <Link
              key={tag}
              href={getTagUrl(tag)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-all focus-ring ${
                activeTag === tag
                  ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stories Feed Grid & States ──────────────────────── */}
      <div className="pb-32 space-y-12">
        {isPending ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {/* Load More / End of Results Controls */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4">
              {hasMore ? (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-7 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:bg-[var(--accent-amber-dim)] hover:text-[var(--accent-amber)] disabled:opacity-50 focus-ring"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Loading more stories…</span>
                    </>
                  ) : (
                    <span>Load more stories</span>
                  )}
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <span className="h-1 w-1 rounded-full bg-[var(--accent-amber)]"></span>
                  No more stories
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title={
              initialQuery
                ? `No stories found for "${initialQuery}"`
                : activeTag
                  ? `No ${isValidNewsTag(activeTag) ? NEWS_TAG_LABEL[activeTag] : activeTag} stories yet`
                  : 'No news yet'
            }
            description={
              initialQuery
                ? 'Try searching with different terms, or clear the search query to see all news.'
                : 'The feed refreshes automatically as new verified stories are published.'
            }
            action={
              initialQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent-amber)] hover:underline focus-ring rounded-xs p-1"
                >
                  Clear search filter →
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}
