'use client'

import { useState } from 'react'
import { submitMusicReview } from '@/app/(auth)/actions'

interface Props {
  releaseId: string
  existingReview?: {
    id: string
    rating: number
    content: string | null
  }
}

export default function MusicReviewForm({ releaseId, existingReview }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [hovered, setHovered] = useState(0)

  const active = hovered || rating

  return (
    <form action={submitMusicReview} className="space-y-5">
      <input type="hidden" name="release_id" value={releaseId} />
      {existingReview && (
        <input type="hidden" name="review_id" value={existingReview.id} />
      )}
      <input type="hidden" name="rating" value={rating} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--accent-amber)]">
            {existingReview ? 'Your review · editing' : 'Leave a review'}
          </p>
          <p className="mt-1 font-display text-xl font-medium text-[var(--text-primary)]">
            How does it hit?
          </p>
        </div>
        <div className="flex gap-1 text-3xl leading-none">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} out of 5`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={`transition-all duration-200 ${
                star <= active
                  ? 'text-[var(--accent-gold)] drop-shadow-[0_0_10px_rgba(255,183,0,0.45)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--accent-amber)]'
              }`}
            >
              {star <= active ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <textarea
        name="content"
        defaultValue={existingReview?.content ?? ''}
        placeholder="Words for the archive… (optional, max 5000 chars)"
        maxLength={5000}
        rows={4}
        className="w-full resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40"
      />

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={rating === 0}
          className="group inline-flex items-center gap-3 rounded-full bg-[var(--accent-amber)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.22em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_28px_rgba(255,183,0,0.45)] disabled:cursor-not-allowed disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] disabled:shadow-none"
        >
          <span>{existingReview ? 'Update review' : 'Submit review'}</span>
          <span aria-hidden className="transition-transform group-enabled:group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </form>
  )
}
