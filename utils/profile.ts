export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/**
 * The one indexable slug for a profile: its username, or its id when no
 * username is set. Every profile link/redirect/canonical must converge here.
 */
export function resolveCanonicalProfileSlug(profile: { id: string; username: string | null }): string {
  return profile.username ?? profile.id
}

export function profilePath(slug: string): string {
  return `/profile/${encodeURIComponent(slug)}`
}

export function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}
