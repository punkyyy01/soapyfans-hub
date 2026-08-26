'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createList, deleteList } from '@/app/(main)/lists/actions'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

interface ListSummary {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  itemCount: number
}

export default function ListsDashboard({ initialLists }: { initialLists: ListSummary[] }) {
  const [lists, setLists] = useState<ListSummary[]>(initialLists)
  const [showForm, setShowForm] = useState(initialLists.length === 0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await createList(name, description, isPublic)
    setPending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setLists((prev) => [
      { id: res.id!, name: name.trim(), description: description.trim() || null, isPublic, itemCount: 0 },
      ...prev,
    ])
    setName('')
    setDescription('')
    setIsPublic(true)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this list? This cannot be undone.')) return
    setLists((prev) => prev.filter((l) => l.id !== id))
    const res = await deleteList(id)
    if (res.error) setError(res.error)
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
          {lists.length} {lists.length === 1 ? 'list' : 'lists'}
        </p>
        {!showForm && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            + New List
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6"
        >
          <div>
            <label className="block text-eyebrow mb-1.5" htmlFor="list-name">
              List Name
            </label>
            <input
              id="list-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sophie's Best Performances"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
            />
          </div>

          <div>
            <label className="block text-eyebrow mb-1.5" htmlFor="list-description">
              Description <span className="normal-case text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              id="list-description"
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What ties this list together?"
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
            />
          </div>

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
              {lists.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <Button type="submit" variant="primary" size="sm" disabled={isPending || name.trim().length === 0}>
                {isPending ? 'Creating…' : 'Create List'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create your first collection — a ranking, a marathon, anything worth curating."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <li
              key={list.id}
              className="group flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 transition-all hover:border-[var(--border-strong)]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={list.isPublic ? 'film' : 'neutral'} size="sm">
                    {list.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'}
                  </span>
                </div>
                <Link
                  href={`/lists/${list.id}`}
                  className="block font-display text-lg font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
                >
                  {list.name}
                </Link>
                {list.description && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)] text-pretty">
                    {list.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/lists/${list.id}`}
                  className="font-mono text-xs uppercase tracking-wider text-[var(--accent-amber)] transition-colors hover:text-[var(--accent-amber-hover)] focus-ring rounded-xs"
                >
                  Manage →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(list.id)}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-red-400 cursor-pointer focus-ring"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
