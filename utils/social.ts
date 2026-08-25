// Client-side mirror of the @mention regex used by submit_review_reply()
// in supabase/migrations/20260825164840_add_social_features.sql -- keep
// these in sync (tests/social.test.ts checks both against the same cases).
const MENTION_RE = /@([a-zA-Z0-9_]{3,30})/g

/**
 * Extracts candidate @mention usernames from reply content. "Candidate"
 * because, same as the DB side, this doesn't check whether the username
 * actually exists -- that resolution (case-insensitive, matching
 * profiles_username_lower_key) only happens server-side.
 */
export function extractMentions(content: string): string[] {
  return [...content.matchAll(MENTION_RE)].map((m) => m[1])
}

export type NotificationType = 'follow' | 'like' | 'reply' | 'mention'

/** Human-readable message for a notification row, keyed by its type. */
export function notificationMessage(type: string, actorName: string): string {
  switch (type) {
    case 'follow':
      return `${actorName} started following you`
    case 'like':
      return `${actorName} liked your review`
    case 'reply':
      return `${actorName} replied to your review`
    case 'mention':
      return `${actorName} mentioned you in a reply`
    default:
      return `${actorName} interacted with your activity`
  }
}
