import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/ui/StarRating'
import { reviewAuthorProfilePath } from '@/utils/reviews'
import LikeButton from './LikeButton'
import ReplyThread, { type ReplyItem } from './ReplyThread'
import ReportButton from './ReportButton'
import ShareButton from './ShareButton'

export type ReviewCardData = {
  id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
}

interface Props {
  review: ReviewCardData
  targetType: 'review' | 'music_review'
  currentUserId: string | null
  isSignedIn: boolean
  redirectTo: string
  likeCount: number
  likedByMe: boolean
  replies: ReplyItem[]
  /** Suppress the permalink/share row when already rendered on /reviews/[id] itself. */
  showPermalink?: boolean
}

// Shared between /films/[id] and /music/[slug] -- the review card markup
// used to be duplicated near-verbatim in both pages. Everything below the
// divider (like/reply/report) is what those two pages didn't have before.
export default function ReviewCard({
  review,
  targetType,
  currentUserId,
  isSignedIn,
  redirectTo,
  likeCount,
  likedByMe,
  replies,
  showPermalink = true,
}: Props) {
  const author = review.profiles?.display_name ?? review.profiles?.username ?? 'Anonymous Fan'
  const isOwn = review.user_id === currentUserId
  const authorHref = reviewAuthorProfilePath(review.profiles)

  return (
    <li className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--accent-amber)]/40 bg-[var(--bg-card)] font-mono text-xs font-semibold text-[var(--accent-amber)]">
          {review.profiles?.avatar_url ? (
            <Image
              src={review.profiles.avatar_url}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            author[0]?.toUpperCase() ?? '?'
          )}
        </span>
        <span className="font-display text-base font-medium text-[var(--text-primary)]">
          {authorHref ? (
            <Link
              href={authorHref}
              className="transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
            >
              {author}
            </Link>
          ) : (
            author
          )}
          {isOwn && (
            <span className="ml-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--accent-amber)]">
              (You)
            </span>
          )}
        </span>
        <StarRating value={review.rating} />
        <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">
          {new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          })}
        </span>
      </div>

      {review.content && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
          {review.content}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--border-subtle)] pt-3">
        <LikeButton
          targetType={targetType}
          targetId={review.id}
          redirectTo={redirectTo}
          likeCount={likeCount}
          likedByMe={likedByMe}
          isSignedIn={isSignedIn}
        />
        <ReplyThread
          targetType={targetType}
          targetId={review.id}
          redirectTo={redirectTo}
          replies={replies}
          currentUserId={currentUserId}
          isSignedIn={isSignedIn}
        />
        {showPermalink && (
          <>
            <Link
              href={`/reviews/${review.id}`}
              className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-ring rounded-xs"
            >
              Permalink
            </Link>
            <ShareButton url={`/reviews/${review.id}`} text={review.content ?? undefined} />
          </>
        )}
        {!isOwn && isSignedIn && (
          <div className="ml-auto">
            <ReportButton targetType={targetType} targetId={review.id} redirectTo={redirectTo} />
          </div>
        )}
      </div>
    </li>
  )
}
