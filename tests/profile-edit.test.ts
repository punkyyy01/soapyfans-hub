import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectImageFormat } from '../utils/image-validation'

describe('Image Binary Magic-Bytes Validation', () => {
  it('correctly detects genuine JPEG image (FF D8 FF)', () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    const res = detectImageFormat(jpegBytes)
    assert.deepEqual(res, { mime: 'image/jpeg', ext: 'jpg' })
  })

  it('correctly detects genuine PNG image (89 50 4E 47)', () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    const res = detectImageFormat(pngBytes)
    assert.deepEqual(res, { mime: 'image/png', ext: 'png' })
  })

  it('correctly detects genuine GIF87a image', () => {
    const gif87Bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00])
    const res = detectImageFormat(gif87Bytes)
    assert.deepEqual(res, { mime: 'image/gif', ext: 'gif', isAnimated: true })
  })

  it('correctly detects genuine GIF89a image (animated GIF)', () => {
    const gif89Bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x64, 0x00, 0x64, 0x00, 0xf7, 0x00])
    const res = detectImageFormat(gif89Bytes)
    assert.deepEqual(res, { mime: 'image/gif', ext: 'gif', isAnimated: true })
  })

  it('correctly detects static WebP image (RIFF ... WEBP ... VP8)', () => {
    const staticWebpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20, // VP8 (simple lossy static)
    ])
    const res = detectImageFormat(staticWebpBytes)
    assert.deepEqual(res, { mime: 'image/webp', ext: 'webp' })
  })

  it('correctly detects Animated WebP image (RIFF ... WEBP ... VP8X + Animation flag)', () => {
    const animatedWebpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF (0..3)
      0x60, 0x00, 0x00, 0x00, // file size (4..7)
      0x57, 0x45, 0x42, 0x50, // WEBP (8..11)
      0x56, 0x50, 0x38, 0x58, // VP8X extended header (12..15)
      0x0a, 0x00, 0x00, 0x00, // chunk size: 10 bytes (16..19)
      0x02,                   // flags: bit 1 (0x02) = ANIMATION flag! (20)
      0x00, 0x00, 0x00,       // canvas width-1 (21..23)
      0x00, 0x00, 0x00,       // canvas height-1 (24..26)
      0x41, 0x4e, 0x49, 0x4d, // ANIM chunk (27..30)
    ])
    const res = detectImageFormat(animatedWebpBytes)
    assert.deepEqual(res, { mime: 'image/webp', ext: 'webp', isAnimated: true })
  })

  it('rejects truncated buffer (< 12 bytes)', () => {
    const shortBytes = new Uint8Array([0xff, 0xd8, 0xff])
    assert.equal(detectImageFormat(shortBytes), null)
  })

  it('rejects text or executable files masquerading as images (MIME spoofing)', () => {
    const fakeHtmlBytes = new TextEncoder().encode('<html><body>not an image</body></html>')
    assert.equal(detectImageFormat(fakeHtmlBytes), null)

    const fakeExeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00])
    assert.equal(detectImageFormat(fakeExeBytes), null)
  })

  it('rejects corrupted RIFF headers (missing WEBP marker)', () => {
    const riffAvi = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // AVI (not WEBP)
    ])
    assert.equal(detectImageFormat(riffAvi), null)
  })
})

describe('Accent Color Validation', () => {
  const HEX_RE = /^#[0-9a-fA-F]{6}$/
  const FALLBACK_ACCENT = '#e8890c'

  it('accepts standard 6-digit hex color codes', () => {
    assert.ok(HEX_RE.test('#e8890c'))
    assert.ok(HEX_RE.test('#FFB700'))
    assert.ok(HEX_RE.test('#2a5c3f'))
    assert.ok(HEX_RE.test('#8B263E'))
    assert.ok(HEX_RE.test('#000000'))
    assert.ok(HEX_RE.test('#ffffff'))
  })

  it('rejects 3-digit shorthand hex codes', () => {
    assert.ok(!HEX_RE.test('#fff'))
    assert.ok(!HEX_RE.test('#e88'))
  })

  it('rejects CSS injections and color names', () => {
    assert.ok(!HEX_RE.test('red'))
    assert.ok(!HEX_RE.test('url(javascript:alert(1))'))
    assert.ok(!HEX_RE.test('#e8890c; background: red'))
    assert.ok(!HEX_RE.test('rgb(255,0,0)'))
    assert.ok(!HEX_RE.test(''))
  })

  it('falls back to default brand amber when value is missing or invalid', () => {
    const sanitizeColor = (val: string | null) => (val && HEX_RE.test(val) ? val : FALLBACK_ACCENT)
    assert.equal(sanitizeColor(null), '#e8890c')
    assert.equal(sanitizeColor('invalid'), '#e8890c')
    assert.equal(sanitizeColor('#2a5c3f'), '#2a5c3f')
  })
})

describe('Image Upload Size and Payload Limits', () => {
  const {
    validateImageSize,
    validateCombinedImageSizes,
    MAX_AVATAR_BYTES,
    MAX_BANNER_BYTES,
    MAX_COMBINED_BYTES,
  } = require('../utils/image-validation')

  it('validates avatar size boundary (max 2 MB)', () => {
    assert.deepEqual(validateImageSize(500 * 1024, 'avatar'), { valid: true })
    assert.deepEqual(validateImageSize(MAX_AVATAR_BYTES, 'avatar'), { valid: true })
    assert.deepEqual(validateImageSize(MAX_AVATAR_BYTES + 1, 'avatar'), {
      valid: false,
      error: 'Avatar image is too large. Maximum size is 2 MB.',
    })
  })

  it('validates banner size boundary (max 3 MB)', () => {
    assert.deepEqual(validateImageSize(1.5 * 1024 * 1024, 'banner'), { valid: true })
    assert.deepEqual(validateImageSize(MAX_BANNER_BYTES, 'banner'), { valid: true })
    assert.deepEqual(validateImageSize(MAX_BANNER_BYTES + 1, 'banner'), {
      valid: false,
      error: 'Banner image is too large. Maximum size is 3 MB.',
    })
  })

  it('validates combined avatar + banner size limits (max 5 MB total)', () => {
    // Valid combined payloads
    assert.deepEqual(
      validateCombinedImageSizes(1.5 * 1024 * 1024, 2.5 * 1024 * 1024), // 4.0 MB
      { valid: true },
    )
    assert.deepEqual(
      validateCombinedImageSizes(MAX_AVATAR_BYTES, MAX_BANNER_BYTES), // 5.0 MB
      { valid: true },
    )

    // Invalid combined payloads (> 5.0 MB)
    assert.deepEqual(
      validateCombinedImageSizes(2.5 * 1024 * 1024, 3 * 1024 * 1024), // 5.5 MB
      {
        valid: false,
        error: 'Combined image size exceeds the 5 MB limit. Please select smaller images.',
      },
    )
  })
})

describe('Storage Old-Image Cleanup Path Protection', () => {
  function getSafeCleanupPath(userId: string, oldUrl: string): { bucket: string; path: string } | null {
    for (const b of ['avatars', 'banners'] as const) {
      const marker = `/storage/v1/object/public/${b}/`
      if (oldUrl.includes(marker)) {
        const oldPath = oldUrl.split(marker)[1]
        if (oldPath && !oldPath.includes('default') && oldPath.startsWith(userId)) {
          return { bucket: b, path: oldPath }
        }
        break
      }
    }
    return null
  }

  it('allows deletion of valid user-owned avatar files', () => {
    const userId = 'usr_abc123'
    const url = 'https://tcskvcmtcsaxyfoselvb.supabase.co/storage/v1/object/public/avatars/usr_abc123/1720000000.jpg'
    const res = getSafeCleanupPath(userId, url)
    assert.deepEqual(res, { bucket: 'avatars', path: 'usr_abc123/1720000000.jpg' })
  })

  it('allows deletion of valid user-owned banner files', () => {
    const userId = 'usr_abc123'
    const url = 'https://tcskvcmtcsaxyfoselvb.supabase.co/storage/v1/object/public/banners/usr_abc123/1720000000.png'
    const res = getSafeCleanupPath(userId, url)
    assert.deepEqual(res, { bucket: 'banners', path: 'usr_abc123/1720000000.png' })
  })

  it('blocks deletion of default assets', () => {
    const userId = 'usr_abc123'
    const url = 'https://tcskvcmtcsaxyfoselvb.supabase.co/storage/v1/object/public/avatars/usr_abc123/default-avatar.png'
    const res = getSafeCleanupPath(userId, url)
    assert.equal(res, null)
  })

  it('blocks deletion of other users assets (path traversal / hijacking)', () => {
    const userId = 'usr_abc123'
    const victimUrl = 'https://tcskvcmtcsaxyfoselvb.supabase.co/storage/v1/object/public/avatars/victim_user_999/profile.jpg'
    const res = getSafeCleanupPath(userId, victimUrl)
    assert.equal(res, null)
  })

  it('ignores non-supabase external URLs', () => {
    const userId = 'usr_abc123'
    const externalUrl = 'https://cdn.discordapp.com/avatars/123/456.png'
    const res = getSafeCleanupPath(userId, externalUrl)
    assert.equal(res, null)
  })
})

describe('About Me Extended Bio Validation and Multi-Paragraph Preservation', () => {
  function validateAboutMe(text: string | null | undefined): { valid: boolean; value: string | null; error?: string } {
    if (!text || !text.trim()) {
      return { valid: true, value: null }
    }
    if (text.length > 2000) {
      return { valid: false, value: null, error: 'About Me text must not exceed 2,000 characters.' }
    }
    return { valid: true, value: text.trim().slice(0, 2000) }
  }

  it('accepts null, undefined, or empty string', () => {
    assert.deepEqual(validateAboutMe(null), { valid: true, value: null })
    assert.deepEqual(validateAboutMe(undefined), { valid: true, value: null })
    assert.deepEqual(validateAboutMe(''), { valid: true, value: null })
    assert.deepEqual(validateAboutMe('   '), { valid: true, value: null })
  })

  it('accepts single-line bio text', () => {
    const res = validateAboutMe('I love Sophie Thatcher performances in Yellowjackets and Heretic.')
    assert.equal(res.valid, true)
    assert.equal(res.value, 'I love Sophie Thatcher performances in Yellowjackets and Heretic.')
  })

  it('preserves multi-paragraph text and line breaks without stripping newlines', () => {
    const multiPara = `Hello archive!\n\nSophie Thatcher is an incredible artist.\nHer music as 'Sophie Thatcher' has an analog darkwave texture that I adore.\n\nFavorite credit: Prospect (2018).`
    const res = validateAboutMe(multiPara)
    assert.equal(res.valid, true)
    assert.equal(res.value, multiPara)
    assert.ok(res.value?.includes('\n\n'))
  })

  it('accepts text exactly at the 2000 character limit', () => {
    const exact2000 = 'A'.repeat(2000)
    const res = validateAboutMe(exact2000)
    assert.equal(res.valid, true)
    assert.equal(res.value?.length, 2000)
  })

  it('rejects text exceeding 2000 characters', () => {
    const tooLong = 'A'.repeat(2001)
    const res = validateAboutMe(tooLong)
    assert.equal(res.valid, false)
    assert.equal(res.error, 'About Me text must not exceed 2,000 characters.')
  })
})

describe('Minimal Profile Closure vs Global Footer Visibility Rules', () => {
  function shouldRenderGlobalFooter(pathname: string): boolean {
    const isPublicProfile = pathname.startsWith('/profile/') && pathname !== '/profile/edit'
    return !isPublicProfile
  }

  it('renders global footer on standard archive pages', () => {
    assert.equal(shouldRenderGlobalFooter('/'), true)
    assert.equal(shouldRenderGlobalFooter('/films'), true)
    assert.equal(shouldRenderGlobalFooter('/films/123'), true)
    assert.equal(shouldRenderGlobalFooter('/tv/456'), true)
    assert.equal(shouldRenderGlobalFooter('/music'), true)
    assert.equal(shouldRenderGlobalFooter('/about'), true)
    assert.equal(shouldRenderGlobalFooter('/login'), true)
    assert.equal(shouldRenderGlobalFooter('/register'), true)
  })

  it('renders global footer on profile editor (/profile/edit)', () => {
    assert.equal(shouldRenderGlobalFooter('/profile/edit'), true)
  })

  it('hides global footer on public profile canvases in favor of Minimal Profile Closure', () => {
    assert.equal(shouldRenderGlobalFooter('/profile/punkyyy01'), false)
    assert.equal(shouldRenderGlobalFooter('/profile/natalie'), false)
    assert.equal(shouldRenderGlobalFooter('/profile/123e4567-e89b-12d3-a456-426614174000'), false)
  })
})

describe('Profile Slug and Navigation Invariants', () => {
  function getCommittedProfileSlug(
    saveStateUsername: string | null,
    profileUsername: string | null,
    profileId: string,
  ): string {
    return saveStateUsername || profileUsername || profileId
  }

  it('preserves committed username even when user edits local input with uncommitted text', () => {
    const profile = { id: 'usr_123', username: 'Frambuesa' }
    const uncommittedInput = 'Frambuesa_Typo_NotSaved'
    const saveState = { username: null }

    // The link must use committed slug, NEVER uncommitted local input
    const slug = getCommittedProfileSlug(saveState.username, profile.username, profile.id)
    assert.equal(slug, 'Frambuesa')
    assert.notEqual(slug, uncommittedInput)
  })

  it('updates profile slug to new username after successful server action save', () => {
    const profile = { id: 'usr_123', username: 'Frambuesa' }
    const saveState = { username: 'Frambuesa_New' }

    const slug = getCommittedProfileSlug(saveState.username, profile.username, profile.id)
    assert.equal(slug, 'Frambuesa_New')
  })

  it('falls back to user id for newly registered OAuth users without username', () => {
    const profile = { id: 'usr_abc_oauth_999', username: null }
    const saveState = { username: null }

    const slug = getCommittedProfileSlug(saveState.username, profile.username, profile.id)
    assert.equal(slug, 'usr_abc_oauth_999')
  })
})

describe('PostgREST ILIKE Wildcard Escaping', () => {
  function escapeIlike(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&')
  }

  it('escapes underscore wildcards to prevent pattern collision', () => {
    assert.equal(escapeIlike('sophie_fan'), 'sophie\\_fan')
    assert.equal(escapeIlike('user_name_test'), 'user\\_name\\_test')
  })

  it('escapes percent signs to prevent wildcards', () => {
    assert.equal(escapeIlike('100%fan'), '100\\%fan')
    assert.equal(escapeIlike('%admin%'), '\\%admin\\%')
  })

  it('escapes backslashes', () => {
    assert.equal(escapeIlike('test\\user'), 'test\\\\user')
  })

  it('leaves alphanumeric strings untouched', () => {
    assert.equal(escapeIlike('Frambuesa'), 'Frambuesa')
    assert.equal(escapeIlike('natalie123'), 'natalie123')
  })
})


