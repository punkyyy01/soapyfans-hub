'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { deleteReview, updateReview } from '@/app/(auth)/actions'
import type { ReviewUpdateState } from '@/app/(auth)/actions'

export type ReviewItem = {
  id: string
  rating: number
  content: string | null
  created_at: string
  film: {
    title: string
    tmdb_id: number
    poster_path: string | null
  } | null
}

interface ListProps {
  reviews: ReviewItem[]
  isOwner: boolean
  profileSlug: string
}

export default function ProfileReviewList({ reviews, isOwner, profileSlug }: ListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm italic text-[var(--text-muted)]">
        No reviews yet. The archive is waiting.
      </p>
    )
  }

  return (
    <ul className="space-y-5">
      {reviews.map((review) => (
        <ReviewRow
          key={review.id}
          review={review}
          isOwner={isOwner}
          profileSlug={profileSlug}
        />
      ))}
    </ul>
  )
}

// ─── Single review row ───────────────────────────────────────────────────────

type Mode = 'view' | 'edit' | 'confirmDelete'

function ReviewRow({
  review,
  isOwner,
  profileSlug,
}: {
  review: ReviewItem
  isOwner: boolean
  profileSlug: string
}) {
  const [mode, setMode] = useState<Mode>('view')
  const film = review.film
  const posterUrl = film?.poster_path
    ? `https://image.tmdb.org/t/p/w185${film.poster_path}`
    : null

  if (mode === 'edit') {
    return (
      <li className="rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--bg-elevated)]/60 p-4">
        <ReviewEditForm
          review={review}
          profileSlug={profileSlug}
          onCancel={() => setMode('view')}
        />
      </li>
    )
  }

  return (
    <li className="group flex gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]/50 p-4 transition-colors hover:border-[var(--accent-amber)]/30">
      {/* Poster */}
      <div className="shrink-0">
        {posterUrl && film?.tmdb_id ? (
          <Link href={`/films/${film.tmdb_id}`}>
            <Image
              src={posterUrl}
              alt={film.title}
              width={48}
              height={72}
              className="rounded transition-opacity group-hover:opacity-85"
            />
          </Link>
        ) : (
          <div className="flex h-[72px] w-12 items-center justify-center rounded bg-[var(--bg-elevated)] text-[0.55rem] text-[var(--text-muted)]">
            —
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {film?.tmdb_id ? (
            <Link
              href={`/films/${film.tmdb_id}`}
              className="font-display text-base font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-gold)]"
            >
              {film.title}
            </Link>
          ) : (
            <span className="font-display text-base font-medium text-[var(--text-primary)]">
              {film?.title ?? 'Unknown film'}
            </span>
          )}
          <span className="text-sm" aria-label={`${review.rating} out of 5 stars`}>
            <span className="text-[var(--accent-gold)]">{'★'.repeat(review.rating)}</span>
            <span className="text-[var(--text-muted)]">{'★'.repeat(5 - review.rating)}</span>
          </span>
          <span className="ml-auto text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {review.content && (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
            {review.content}
          </p>
        )}

        {/* Owner actions */}
        {isOwner && mode === 'view' && (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setMode('edit')}
              className="-mx-2 rounded px-2 py-1.5 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-gold)]"
            >
              Edit
            </button>
            <span className="text-[var(--border-strong)]">·</span>
            <button
              onClick={() => setMode('confirmDelete')}
              className="-mx-2 rounded px-2 py-1.5 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors hover:text-red-400"
            >
              Delete
            </button>
          </div>
        )}

        {/* Delete confirmation */}
        {isOwner && mode === 'confirmDelete' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <p className="text-xs text-[var(--text-secondary)]">Delete this review?</p>
            <form action={deleteReview}>
              <input type="hidden" name="review_id" value={review.id} />
              <button
                type="submit"
                className="rounded-full border border-red-900/60 px-3 py-2 text-[0.65rem] uppercase tracking-[0.18em] text-red-400 transition-all hover:bg-red-950/40"
              >
                Yes, delete
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="-mx-2 rounded px-2 py-2 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

// ─── Inline edit form ────────────────────────────────────────────────────────

function ReviewEditForm({
  review,
  profileSlug,
  onCancel,
}: {
  review: ReviewItem
  profileSlug: string
  onCancel: () => void
}) {
  const [rating, setRating] = useState(review.rating)
  const [hovered, setHovered] = useState(0)
  const [state, formAction, isPending] = useActionState<ReviewUpdateState, FormData>(
    updateReview,
    { error: null },
  )

  const active = hovered || rating

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="review_id" value={review.id} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--accent-amber)]">
          Editing review
          {review.film && (
            <span className="ml-2 normal-case text-[var(--text-muted)]">
              — {review.film.title}
            </span>
          )}
        </p>

        {/* Star picker */}
        <div className="flex gap-1 text-2xl leading-none">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} out of 5`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={`transition-all duration-150 ${
                star <= active
                  ? 'text-[var(--accent-gold)] drop-shadow-[0_0_8px_rgba(255,183,0,0.4)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--accent-amber)]'
              }`}
            >
              {star <= active ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="rounded-md border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <textarea
        name="content"
        defaultValue={review.content ?? ''}
        placeholder="Words for the archive… (optional, max 5000 chars)"
        maxLength={5000}
        rows={3}
        className="w-full resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40"
      />

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)]/60 hover:text-[var(--text-primary)] disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || rating === 0}
          className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent-amber)] px-5 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_24px_rgba(255,183,0,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {isPending ? 'Saving…' : 'Save'}
          {!isPending && (
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          )}
        </button>
      </div>
    </form>
  )
}
