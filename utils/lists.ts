export type ListMediaType = 'movie' | 'tv'

export function isListMediaType(value: unknown): value is ListMediaType {
  return value === 'movie' || value === 'tv'
}

export const LIST_NAME_MAX_LENGTH = 100
export const LIST_DESCRIPTION_MAX_LENGTH = 500

/**
 * Same validation the `lists` table's own constraints enforce -- kept as a
 * pure function so the server action and any client-side preview can share
 * one source of truth instead of drifting.
 */
export function validateListName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > LIST_NAME_MAX_LENGTH) {
    return `List name must be between 1 and ${LIST_NAME_MAX_LENGTH} characters.`
  }
  return null
}

export function validateListDescription(description: string): string | null {
  const trimmed = description.trim()
  if (trimmed.length > LIST_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${LIST_DESCRIPTION_MAX_LENGTH} characters or fewer.`
  }
  return null
}
