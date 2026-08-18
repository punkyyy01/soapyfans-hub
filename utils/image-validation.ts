/**
 * Image binary magic-bytes validation and size limits.
 * Unforgeable format detection that inspects file header bytes directly,
 * preventing MIME spoofing and corrupted uploads.
 */

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_BANNER_BYTES = 3 * 1024 * 1024 // 3 MB
export const MAX_COMBINED_BYTES = 5 * 1024 * 1024 // 5 MB

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type SupportedImageFormat = {
  mime: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  ext: 'jpg' | 'png' | 'gif' | 'webp'
  isAnimated?: boolean
}

/**
 * Validates individual image file size based on image type (avatar or banner).
 */
export function validateImageSize(
  size: number,
  type: 'avatar' | 'banner',
): { valid: boolean; error?: string } {
  const maxBytes = type === 'avatar' ? MAX_AVATAR_BYTES : MAX_BANNER_BYTES
  const maxMB = type === 'avatar' ? 2 : 3
  const label = type === 'avatar' ? 'Avatar' : 'Banner'

  if (size > maxBytes) {
    return {
      valid: false,
      error: `${label} image is too large. Maximum size is ${maxMB} MB.`,
    }
  }

  return { valid: true }
}

/**
 * Validates combined file size for simultaneous avatar and banner uploads.
 */
export function validateCombinedImageSizes(
  avatarSize: number,
  bannerSize: number,
): { valid: boolean; error?: string } {
  const total = avatarSize + bannerSize
  if (total > MAX_COMBINED_BYTES) {
    return {
      valid: false,
      error: 'Combined image size exceeds the 5 MB limit. Please select smaller images.',
    }
  }
  return { valid: true }
}

/**
 * Validates the true binary magic bytes of an uploaded image buffer.
 * Supports JPEG, PNG, GIF (GIF87a / GIF89a), and WebP (both static VP8/VP8L and animated VP8X).
 */
export function detectImageFormat(bytes: Uint8Array): SupportedImageFormat | null {
  if (!bytes || bytes.length < 12) return null

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }

  // PNG: 89 50 4E 47
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mime: 'image/png', ext: 'png' }
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { mime: 'image/gif', ext: 'gif', isAnimated: true }
  }

  // WebP: RIFF (0..3) + WEBP (8..11)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    // Check for Extended WebP format (VP8X) with animation flag (bit 1 of flags byte at index 20)
    const isExtended =
      bytes.length >= 21 &&
      bytes[12] === 0x56 && // 'V'
      bytes[13] === 0x50 && // 'P'
      bytes[14] === 0x38 && // '8'
      bytes[15] === 0x58    // 'X'

    const isAnimatedWebp = isExtended && (bytes[20] & 0x02) !== 0

    return {
      mime: 'image/webp',
      ext: 'webp',
      ...(isAnimatedWebp ? { isAnimated: true } : {}),
    }
  }

  return null
}

