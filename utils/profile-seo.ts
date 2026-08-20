/**
 * Pure, deterministic evaluator for whether a public profile is worth an
 * independent search-index entry. No DB/network access -- callers gather
 * the signals (bio/about_me/review contents/favorites count) and pass them
 * in, which keeps this fully unit-testable and reusable from both profile
 * metadata generation and sitemap generation without ever diverging.
 */

export type ProfileSeoQuality = 'indexable' | 'noindex' | 'unavailable'

export interface ProfileSeoInput {
  /** false for a profile row that doesn't exist / failed to load */
  exists: boolean
  isBanned: boolean
  username: string | null
  bio: string | null
  aboutMe: string | null
  favoritesCount: number
  /** raw review body text (film + music reviews); null/empty entries are fine */
  reviewContents: (string | null)[]
}

// A rating-only review ("★★★★★", no words) must not count as written
// contribution. 15 chars rejects one-word reviews ("good", "nice"); the
// alnum/distinct-character checks reject punctuation spam ("!!!!!!!!!!!!!!!")
// and repeated-character noise ("aaaaaaaaaaaaaaa") that would otherwise pass
// the length check alone.
export const MEANINGFUL_REVIEW_MIN_LENGTH = 15
const MEANINGFUL_REVIEW_MIN_ALNUM = 8
const MEANINGFUL_REVIEW_MIN_DISTINCT_CHARS = 4

export function isMeaningfulReviewText(content: string | null): boolean {
  if (!content) return false
  const trimmed = content.trim()
  if (trimmed.length < MEANINGFUL_REVIEW_MIN_LENGTH) return false

  const alnum = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (alnum.length < MEANINGFUL_REVIEW_MIN_ALNUM) return false

  return new Set(alnum).size >= MEANINGFUL_REVIEW_MIN_DISTINCT_CHARS
}

// Bio is capped at 300 chars (see app/(main)/profile/edit/actions.ts); 40 is
// "wrote a real sentence or two", not just a name or a one-liner.
export const BIO_MEANINGFUL_MIN = 40
// About Me is capped at 2,000 chars; 80 is "an actual paragraph".
export const ABOUT_ME_MEANINGFUL_MIN = 80
// 2+ substantive written reviews justify a landing page on their own.
export const MEANINGFUL_REVIEWS_ALONE_THRESHOLD = 2
// Favorites alone are never enough (see policy below); paired with any
// identity text, 4+ curated picks is a deliberate collection, not decoration.
export const FAVORITES_WITH_IDENTITY_MIN = 4

/**
 * Deterministic profile-quality policy (full matrix covered in
 * tests/profile-seo.test.ts). A profile becomes `indexable` when ANY hold:
 *   - About Me is substantive (>= ABOUT_ME_MEANINGFUL_MIN chars)
 *   - Bio is substantive (>= BIO_MEANINGFUL_MIN chars)
 *   - 2+ meaningful written reviews exist
 *   - 1+ meaningful written review AND some identity text (bio or about_me)
 *   - FAVORITES_WITH_IDENTITY_MIN+ favorites AND some identity text
 * A profile with no stored username is never `indexable` -- its canonical
 * URL would be a raw UUID, which is not a URL worth ranking.
 * Banned or nonexistent profiles are always `unavailable`.
 * Everything else is `noindex` (public, but too thin for its own result).
 */
export function evaluateProfileSeo(input: ProfileSeoInput): ProfileSeoQuality {
  if (!input.exists || input.isBanned) return 'unavailable'
  if (!input.username) return 'noindex'

  const bio = (input.bio ?? '').trim()
  const aboutMe = (input.aboutMe ?? '').trim()
  const hasIdentity = bio.length > 0 || aboutMe.length > 0

  if (aboutMe.length >= ABOUT_ME_MEANINGFUL_MIN) return 'indexable'
  if (bio.length >= BIO_MEANINGFUL_MIN) return 'indexable'

  const meaningfulReviewCount = input.reviewContents.filter(isMeaningfulReviewText).length
  if (meaningfulReviewCount >= MEANINGFUL_REVIEWS_ALONE_THRESHOLD) return 'indexable'
  if (meaningfulReviewCount >= 1 && hasIdentity) return 'indexable'
  if (input.favoritesCount >= FAVORITES_WITH_IDENTITY_MIN && hasIdentity) return 'indexable'

  return 'noindex'
}
