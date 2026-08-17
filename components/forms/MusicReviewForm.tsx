'use client'

import { useState } from 'react'
import { submitMusicReview } from '@/app/(auth)/actions'
import Button from '@/components/ui/Button'

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-eyebrow">
            {existingReview ? 'Edit Your Note' : 'Add Fan Note'}
          </p>
          <p className="mt-1 font-display text-lg font-medium text-[var(--text-primary)]">
            How does this sound land with you?
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-2xl leading-none">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} out of 5 stars`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={`transition-all duration-150 focus-ring rounded-xs cursor-pointer p-0.5 ${
                star <= active
                  ? 'text-[var(--accent-gold)] scale-110'
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
        placeholder="Share your thoughts for the community archive… (optional, up to 5,000 characters)"
        maxLength={5000}
        rows={4}
        className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]/70 p-4 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-ring"
      />

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={rating === 0}
        >
          {existingReview ? 'Update note' : 'Submit note'}
        </Button>
      </div>
    </form>
  )
}

