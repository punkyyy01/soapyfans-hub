'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  updateListMeta,
  deleteList,
  addListItem,
  removeListItem,
  reorderListItems,
} from '@/app/(main)/lists/actions'
import { getTmdbImageUrl } from '@/utils/tmdb'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ShareButton from '@/components/social/ShareButton'
import EmptyState from '@/components/ui/EmptyState'

type SearchResult = {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_url: string | null
  year: string | null
}

interface ListMeta {
  id: string
  name: string
  description: string | null
  isPublic: boolean
}

interface ListItemView {
  id: string
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string | null
  posterPath: string | null
}

interface Props {
  list: ListMeta
  ownerName: string
  ownerHref: string | null
  items: ListItemView[]
  isOwner: boolean
  shareUrl: string
}

export default function ListDetailManager({ list, ownerName, ownerHref, items: initialItems, isOwner, shareUrl }: Props) {
  const router = useRouter()

  const [name, setName] = useState(list.name)
  const [description, setDescription] = useState(list.description ?? '')
  const [isPublic, setIsPublic] = useState(list.isPublic)
  const [editingMeta, setEditingMeta] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)

  const [items, setItems] = useState<ListItemView[]>(initialItems)
  const [showSearch, setShowSearch] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)

  async function handleSaveMeta() {
    setSavingMeta(true)
    setError(null)
    const res = await updateListMeta(list.id, { name, description, isPublic })
    setSavingMeta(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setEditingMeta(false)
    router.refresh()
  }

  async function handleDeleteList() {
    if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return
    const res = await deleteList(list.id)
    if (res.error) {
      setError(res.error)
      return
    }
    router.push('/lists')
  }

  function onDragStart(index: number) {
    setDragIndex(index)
  }

  function onDragEnd() {
    setDragIndex(null)
    setDragOver(null)
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const next = [...items]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setItems(next)
    setDragIndex(null)
    setDragOver(null)
    reorderListItems(list.id, next.map((i) => i.id))
  }

  async function handleRemoveItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    const res = await removeListItem(list.id, itemId)
    if (res.error) setError(res.error)
  }

  async function handleAddItem(result: SearchResult) {
    const already = items.some((i) => i.tmdbId === result.tmdb_id && i.mediaType === result.media_type)
    if (already) {
      setError('This title is already in the list.')
      return
    }

    const optimistic: ListItemView = {
      id: `tmp-${Date.now()}`,
      tmdbId: result.tmdb_id,
      mediaType: result.media_type,
      title: result.title,
      posterPath: result.poster_url,
    }
    setItems((prev) => [...prev, optimistic])
    setShowSearch(false)

    const res = await addListItem(list.id, result.tmdb_id, result.media_type)
    if (res.error) {
      setItems((prev) => prev.filter((i) => i.id !== optimistic.id))
      setError(res.error)
    } else if (res.id) {
      setItems((prev) => prev.map((i) => (i.id === optimistic.id ? { ...i, id: res.id! } : i)))
    }
  }

  return (
    <div className="space-y-8">
      {showSearch && (
        <TmdbSearchModal onAdd={handleAddItem} onClose={() => setShowSearch(false)} />
      )}

      {error && (
        <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Header */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
        {editingMeta ? (
          <div className="space-y-4">
            <input
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-4 py-2.5 font-display text-2xl font-medium text-[var(--text-primary)] focus-ring"
            />
            <textarea
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What ties this list together?"
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
            />
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 font-mono text-xs text-[var(--text-secondary)]">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-ring ${
                    isPublic
                      ? 'border-[var(--accent-amber)] bg-[var(--accent-amber)]'
                      : 'border-[var(--border-strong)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md transition-transform ${
                      isPublic ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                {isPublic ? 'Public — visible on your profile' : 'Private — visible only to you'}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setName(list.name)
                    setDescription(list.description ?? '')
                    setIsPublic(list.isPublic)
                    setEditingMeta(false)
                  }}
                  className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="button" variant="primary" size="sm" onClick={handleSaveMeta} disabled={savingMeta}>
                  {savingMeta ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={list.isPublic ? 'film' : 'neutral'} size="sm">
                    {isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {items.length} {items.length === 1 ? 'title' : 'titles'}
                  </span>
                </div>
                <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[0.98] tracking-tight text-[var(--text-primary)] text-balance">
                  {name}
                </h1>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  A list by{' '}
                  {ownerHref ? (
                    <Link href={ownerHref} className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs">
                      {ownerName}
                    </Link>
                  ) : (
                    ownerName
                  )}
                </p>
                {description && (
                  <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ShareButton url={shareUrl} title={name} text={description || undefined} />
                {isOwner && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingMeta(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowSearch(true)}>
                  + Add Title
                </Button>
                <button
                  type="button"
                  onClick={handleDeleteList}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-red-400 cursor-pointer focus-ring"
                >
                  Delete list
                </button>
              </div>
            )}
          </>
        )}
      </header>

      {/* Items grid */}
      {items.length === 0 ? (
        <EmptyState
          title="No titles yet"
          description={
            isOwner
              ? 'Add films or TV credits to start building this list.'
              : 'This list is still empty.'
          }
          action={
            isOwner ? (
              <Button type="button" variant="primary" size="sm" onClick={() => setShowSearch(true)}>
                Browse &amp; Add Titles
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-5 sm:gap-4">
          {items.map((item, index) => {
            const posterUrl = getTmdbImageUrl(item.posterPath, 'w342')
            const href = item.mediaType === 'movie' ? `/films/${item.tmdbId}` : `/tv/${item.tmdbId}`
            const isDragging = dragIndex === index
            const isOver = dragOver === index && dragIndex !== index

            const card = (
              <>
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={item.title ?? ''}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, 20vw"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
                    {item.title ?? '?'}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="font-display text-xs font-medium leading-tight text-white line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemoveItem(item.id)
                    }}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/85 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-900 focus-ring cursor-pointer"
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                )}
              </>
            )

            return isOwner ? (
              <div
                key={item.id}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(index)
                }}
                onDrop={() => onDrop(index)}
                className={`group relative aspect-[2/3] cursor-grab overflow-hidden rounded-xl border transition-all active:cursor-grabbing ${
                  isDragging
                    ? 'scale-95 opacity-50 border-[var(--accent-amber)]'
                    : isOver
                      ? 'scale-[1.03] border-[var(--accent-amber)] shadow-lg'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                <Link href={href} className="absolute inset-0" aria-label={item.title ?? 'Title'} />
                {card}
              </div>
            ) : (
              <Link
                key={item.id}
                href={href}
                className="group relative block aspect-[2/3] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300 hover:border-[var(--accent-amber)]/60 hover:shadow-lg focus-ring"
              >
                {card}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Add-title search modal ──────────────────────────────────────────────
// Trimmed duplicate of the search modal in ProfileEditForm.tsx (same
// /api/tmdb-search endpoint) -- that one is a local unexported component
// scoped to the favorites curation section, so it isn't reusable here.

function TmdbSearchModal({
  onAdd,
  onClose,
}: {
  onAdd: (r: SearchResult) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
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
      const { results: data } = (await res.json()) as { results: SearchResult[] }
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

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
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <p className="text-eyebrow">Add to list</p>
          <button
            onClick={onClose}
            className="text-lg text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer focus-ring"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Sophie Thatcher films &amp; shows…"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
          />
        </div>

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
                      onClick={() => onAdd(r)}
                      className="flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[var(--bg-surface)] cursor-pointer focus-ring"
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]">
                        {posterUrl ? (
                          <Image src={posterUrl} alt={r.title} fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[0.6rem] text-[var(--text-muted)]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{r.title}</p>
                        <p className="font-mono text-[0.68rem] text-[var(--text-muted)] uppercase tracking-wider">
                          {r.year ?? '—'} · {r.media_type === 'movie' ? 'Film' : 'Television'}
                        </p>
                      </div>
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)]">+ Add</span>
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
