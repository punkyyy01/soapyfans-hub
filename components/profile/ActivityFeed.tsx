'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { deleteReview, updateReview } from '@/app/(auth)/actions'
import { getTmdbImageUrl } from '@/utils/tmdb'
import type { ReviewUpdateState } from '@/app/(auth)/actions'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import SafeImage from '@/components/ui/SafeImage'

export type ActivityItem = {
  id: string
  rating: number
  content: string | null
  created_at: string
} & (
  | { kind: 'film'; title: string; tmdb_id: number; poster_path: string | null }
  | { kind: 'music'; title: string; cover_art_url: string | null }
)

interface Props {
  items: ActivityItem[]
  isOwner: boolean
  profileSlug: string
}

export default function ActivityFeed({ items, isOwner, profileSlug }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 p-8 text-center">
        <p className="text-sm italic text-[var(--text-muted)]">
          No public activity recorded yet. The archive is waiting.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <ActivityRow
          key={`${item.kind}-${item.id}`}
          item={item}
          isOwner={isOwner}
          profileSlug={profileSlug}
        />
      ))}
    </ul>
  )
}

function PosterFallback() {
  return (
    <div className="flex h-[78px] w-[52px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-muted)]">
      —
    </div>
  )
}

type Mode = 'view' | 'edit' | 'confirmDelete'

function ActivityRow({
  item,
  isOwner,
  profileSlug,
}: {
  item: ActivityItem
  isOwner: boolean
  profileSlug: string
}) {
  const [mode, setMode] = useState<Mode>('view')

  const imageUrl =
    item.kind === 'film'
      ? getTmdbImageUrl(item.poster_path, 'w185')
      : item.cover_art_url

  const href = item.kind === 'film' && item.tmdb_id > 0 ? `/films/${item.tmdb_id}` : null

  if (mode === 'edit' && item.kind === 'film') {
    return (
      <li className="rounded-2xl border border-[var(--accent-amber)]/40 bg-[var(--bg-elevated)] p-5 shadow-lg">
        <FilmReviewEditForm
          item={item}
          profileSlug={profileSlug}
          onCancel={() => setMode('view')}
        />
      </li>
    )
  }

  return (
    <li className="group flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-4.5 backdrop-blur-xs transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]/50 sm:p-5">
      {/* Poster / Artwork */}
      <div className="shrink-0">
        {imageUrl ? (
          href ? (
            <Link href={href} className="block overflow-hidden rounded-lg focus-ring">
              <SafeImage
                src={imageUrl}
                alt={item.title}
                width={52}
                height={78}
                className="aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                fallback={<PosterFallback />}
              />
            </Link>
          ) : (
            <div className="overflow-hidden rounded-lg">
              <SafeImage
                src={imageUrl}
                alt={item.title}
                width={52}
                height={78}
                className="aspect-[2/3] object-cover"
                fallback={<PosterFallback />}
              />
            </div>
          )
        ) : (
          <PosterFallback />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {href ? (
            <Link
              href={href}
              className="font-display text-base font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
            >
              {item.title}
            </Link>
          ) : (
            <span className="font-display text-base font-medium text-[var(--text-primary)]">
              {item.title}
            </span>
          )}

          {item.kind === 'music' && (
            <Badge variant="music" size="sm">
              Music
            </Badge>
          )}

          {/* Accessible Star Rating */}
          <span className="font-mono text-xs text-[var(--accent-gold)]" aria-label={`${item.rating} out of 5 stars`}>
            {'★'.repeat(item.rating)}
            <span className="text-[var(--text-muted)] opacity-40">{'★'.repeat(5 - item.rating)}</span>
          </span>

          <span className="ml-auto font-mono text-[0.68rem] text-[var(--text-muted)]">
            {new Date(item.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {item.content && (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty line-clamp-3">
            {item.content}
          </p>
        )}

        {/* Owner Controls */}
        {isOwner && item.kind === 'film' && mode === 'view' && (
          <div className="flex items-center gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--accent-amber)] cursor-pointer focus-ring"
            >
              Edit
            </button>
            <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setMode('confirmDelete')}
              className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-red-400 cursor-pointer focus-ring"
            >
              Delete
            </button>
          </div>
        )}

        {isOwner && item.kind === 'film' && mode === 'confirmDelete' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <p className="text-xs text-[var(--text-secondary)]">Delete this archival note?</p>
            <form action={deleteReview}>
              <input type="hidden" name="review_id" value={item.id} />
              <button
                type="submit"
                className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-red-300 transition-colors hover:bg-red-900/60 cursor-pointer focus-ring"
              >
                Yes, delete
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer focus-ring"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function FilmReviewEditForm({
  item,
  profileSlug,
  onCancel,
}: {
  item: ActivityItem & { kind: 'film' }
  profileSlug: string
  onCancel: () => void
}) {
  const [rating, setRating] = useState(item.rating)
  const [hovered, setHovered] = useState(0)
  const [state, formAction, isPending] = useActionState<ReviewUpdateState, FormData>(
    updateReview,
    { error: null },
  )
  const active = hovered || rating

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="review_id" value={item.id} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-amber)]">
          Editing review <span className="text-[var(--text-muted)] font-normal">— {item.title}</span>
        </p>
        <div className="flex gap-1 text-2xl leading-none">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} out of 5 stars`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={`cursor-pointer transition-transform duration-150 hover:scale-110 ${
                star <= active
                  ? 'text-[var(--accent-gold)]'
                  : 'text-[var(--text-muted)] opacity-40 hover:opacity-100'
              }`}
            >
              {star <= active ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-900/40 bg-red-950/40 px-3.5 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}

      <textarea
        name="content"
        defaultValue={item.content ?? ''}
        placeholder="Words for the archive… (optional)"
        maxLength={5000}
        rows={3}
        className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 px-3.5 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
      />

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isPending || rating === 0}
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

