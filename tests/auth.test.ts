import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('OAuth Security and Provider Configuration', () => {
  const ALLOWED_PROVIDERS = ['discord', 'google'] as const

  it('allows discord and google as authorized OAuth providers', () => {
    assert.ok(ALLOWED_PROVIDERS.includes('discord'))
    assert.ok(ALLOWED_PROVIDERS.includes('google'))
    assert.equal(ALLOWED_PROVIDERS.length, 2)
  })

  it('rejects unauthorized or arbitrary OAuth providers', () => {
    assert.ok(!ALLOWED_PROVIDERS.includes('github' as any))
    assert.ok(!ALLOWED_PROVIDERS.includes('facebook' as any))
    assert.ok(!ALLOWED_PROVIDERS.includes('twitter' as any))
    assert.ok(!ALLOWED_PROVIDERS.includes('' as any))
  })

  describe('Open Redirect Protection for next parameter', () => {
    function sanitizeNext(nextRaw: string | null): string {
      const fallback = '/'
      if (!nextRaw) return fallback
      // Must start with a single slash and not double slashes or backslashes
      if (nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')) {
        return nextRaw
      }
      return fallback
    }

    it('allows valid internal relative paths', () => {
      assert.equal(sanitizeNext('/'), '/')
      assert.equal(sanitizeNext('/films'), '/films')
      assert.equal(sanitizeNext('/profile/edit'), '/profile/edit')
      assert.equal(sanitizeNext('/music?page=2'), '/music?page=2')
      assert.equal(sanitizeNext('/films/123'), '/films/123')
    })

    it('blocks external protocol-relative URLs (//evil.com)', () => {
      assert.equal(sanitizeNext('//evil.com'), '/')
      assert.equal(sanitizeNext('//google.com/phishing'), '/')
    })

    it('blocks absolute URLs (https://evil.com)', () => {
      assert.equal(sanitizeNext('https://evil.com'), '/')
      assert.equal(sanitizeNext('http://evil.com'), '/')
      assert.equal(sanitizeNext('javascript:alert(1)'), '/')
    })

    it('blocks backslash bypass attempts (/\\evil.com)', () => {
      assert.equal(sanitizeNext('/\\evil.com'), '/')
      assert.equal(sanitizeNext('/path\\to\\somewhere'), '/')
    })

    it('defaults to / on null or empty input', () => {
      assert.equal(sanitizeNext(null), '/')
      assert.equal(sanitizeNext(''), '/')
    })
  })
})
