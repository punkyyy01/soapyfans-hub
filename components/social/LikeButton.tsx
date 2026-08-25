import { toggleReviewLike } from '@/app/(main)/social-actions'

interface Props {
  targetType: 'review' | 'music_review'
  targetId: string
  redirectTo: string
  likeCount: number
  likedByMe: boolean
  isSignedIn: boolean
}

// A server component (no client JS): whether the review is already liked is
// known at render time from the page's own data fetch, same pattern as
// WatchlistButton -- one form posting to the toggle action, no client state.
export default function LikeButton({
  targetType,
  targetId,
  redirectTo,
  likeCount,
  likedByMe,
  isSignedIn,
}: Props) {
  if (!isSignedIn) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
        <span aria-hidden="true">♡</span> {likeCount}
      </span>
    )
  }

  return (
    <form action={toggleReviewLike}>
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <button
        type="submit"
        aria-pressed={likedByMe}
        className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-1 font-mono text-xs transition-colors cursor-pointer focus-ring ${
          likedByMe
            ? 'text-[var(--accent-amber)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span aria-hidden="true">{likedByMe ? '♥' : '♡'}</span> {likeCount}
      </button>
    </form>
  )
}
