'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitReply, deleteReply } from '@/app/(main)/social-actions'
import { reviewAuthorProfilePath } from '@/utils/reviews'

export type ReplyItem = {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { username: string | null; display_name: string | null } | null
}

interface Props {
  targetType: 'review' | 'music_review'
  targetId: string
  redirectTo: string
  replies: ReplyItem[]
  currentUserId: string | null
  isSignedIn: boolean
}

export default function ReplyThread({
  targetType,
  targetId,
  redirectTo,
  replies,
  currentUserId,
  isSignedIn,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={expanded ? 'w-full' : ''}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer focus-ring"
      >
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-l border-[var(--border-subtle)] pl-4">
          {replies.map((reply) => {
            const author = reply.profiles?.display_name ?? reply.profiles?.username ?? 'Anonymous Fan'
            const authorHref = reviewAuthorProfilePath(reply.profiles)
            const isOwn = reply.user_id === currentUserId
            return (
              <div key={reply.id} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-medium text-[var(--text-primary)]">
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
                  </span>
                  <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                    {new Date(reply.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </span>
                  {isOwn && (
                    <form action={deleteReply}>
                      <input type="hidden" name="reply_id" value={reply.id} />
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <button
                        type="submit"
                        className="font-mono text-[0.6rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-red-400 cursor-pointer"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                  {reply.content}
                </p>
              </div>
            )
          })}

          {isSignedIn ? (
            <form action={submitReply} className="flex items-start gap-2 pt-1">
              <input type="hidden" name="target_type" value={targetType} />
              <input type="hidden" name="target_id" value={targetId} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <textarea
                name="content"
                required
                maxLength={2000}
                rows={2}
                placeholder="Reply to this review… (@mention to notify someone)"
                className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)]/70 p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-[var(--accent-amber)] px-3.5 py-2 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-inverse)] transition-colors hover:bg-[var(--accent-amber-hover)] cursor-pointer focus-ring"
              >
                Reply
              </button>
            </form>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              <Link href="/login" className="text-[var(--accent-amber)] hover:underline">
                Sign in
              </Link>{' '}
              to reply.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
