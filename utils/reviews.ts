import { profilePath } from './profile'

/**
 * A review counts as publicly visible when it isn't soft-deleted and its
 * author isn't banned. Shared by film/music review rendering AND the
 * structured-data builders, so the visible list and the JSON-LD `review`
 * array can never diverge.
 */
export function isVisibleReview<T extends { deleted_at: string | null; user_id: string }>(
  review: T,
  bannedUserIds: Set<string>,
): boolean {
  return review.deleted_at === null && !bannedUserIds.has(review.user_id)
}

/**
 * Only link to a profile when a real stored username exists. Never derive a
 * link from display name or user id.
 */
export function reviewAuthorProfilePath(profile: { username: string | null } | null): string | null {
  if (!profile?.username) return null
  return profilePath(profile.username)
}
