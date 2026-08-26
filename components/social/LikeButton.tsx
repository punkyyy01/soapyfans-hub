'use client'

import { useOptimistic } from 'react'
import { toggleReviewLike } from '@/app/(main)/social-actions'

interface Props {
  targetType: 'review' | 'music_review'
  targetId: string
  redirectTo: string
  likeCount: number
  likedByMe: boolean
  isSignedIn: boolean
}

// Client component so the heart/count flips instantly on click via
// useOptimistic -- toggleReviewLike still revalidates + redirects back to
// the same page server-side, but the UI no longer waits on that round trip
// (and the follow-up RSC render) to reflect what the user just did.
export default function LikeButton({
  targetType,
  targetId,
  redirectTo,
  likeCount,
  likedByMe,
  isSignedIn,
}: Props) {
  const [optimistic, setOptimistic] = useOptimistic(
    { likeCount, likedByMe },
    (state, nextLiked: boolean) => ({
      likedByMe: nextLiked,
      likeCount: state.likeCount + (nextLiked ? 1 : -1),
    }),
  )

  if (!isSignedIn) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
        <span aria-hidden="true">♡</span> {likeCount}
      </span>
    )
  }

  async function formAction(formData: FormData) {
    setOptimistic(!optimistic.likedByMe)
    await toggleReviewLike(formData)
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <button
        type="submit"
        aria-pressed={optimistic.likedByMe}
        className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 font-mono text-xs transition-colors cursor-pointer focus-ring ${
          optimistic.likedByMe
            ? 'text-[var(--accent-amber)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span aria-hidden="true">{optimistic.likedByMe ? '♥' : '♡'}</span> {optimistic.likeCount}
      </button>
    </form>
  )
}
