// Simple, computed-on-read badges -- no stored/denormalized counters, no
// migration needed. Mirrors how follower/following counts are already
// computed live on the profile page (count queries at render time) rather
// than maintained as columns, so a badge can never drift from the reviews
// it's actually based on.

export type BadgeId = 'first_review' | 'ten_reviews' | 'founding_fan'

export interface EarnedBadge {
  id: BadgeId
  label: string
  description: string
}

// The archive's public launch window -- profiles created at or before this
// date lived through the site's early days. Matches the precedent set by
// STATIC_CONTENT_LAST_MODIFIED in utils/site.ts: a deliberately hardcoded,
// truthful cutoff, not `new Date()` recomputed on every render.
export const LAUNCH_CUTOFF = new Date('2026-09-01T00:00:00.000Z')

const BADGE_DEFS: Record<BadgeId, Omit<EarnedBadge, 'id'>> = {
  first_review: {
    label: 'First Review',
    description: 'Posted a first fan review to the archive.',
  },
  ten_reviews: {
    label: '10 Reviews',
    description: 'Reached 10 published reviews across film and music.',
  },
  founding_fan: {
    label: 'Founding Fan',
    description: 'Joined SoapyFans Hub during its launch window.',
  },
}

export function computeBadges({
  reviewCount,
  profileCreatedAt,
}: {
  reviewCount: number
  profileCreatedAt: string
}): EarnedBadge[] {
  const earned: BadgeId[] = []

  if (reviewCount >= 1) earned.push('first_review')
  if (reviewCount >= 10) earned.push('ten_reviews')
  if (new Date(profileCreatedAt).getTime() <= LAUNCH_CUTOFF.getTime()) earned.push('founding_fan')

  return earned.map((id) => ({ id, ...BADGE_DEFS[id] }))
}
