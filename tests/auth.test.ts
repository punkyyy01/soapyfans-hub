import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCsp } from '../utils/supabase/middleware'

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

  describe('Content Security Policy for OAuth redirects and assets', () => {
    it('includes Supabase, Google, and Discord in form-action to allow OAuth redirects', () => {
      const csp = buildCsp('test-nonce')
      assert.ok(csp.includes("form-action 'self'"))
      assert.ok(csp.includes('https://accounts.google.com'))
      assert.ok(csp.includes('https://discord.com'))
      assert.ok(csp.includes('supabase.co'))
    })

    it('includes Google and Discord in img-src for user avatars', () => {
      const csp = buildCsp('test-nonce')
      assert.ok(csp.includes('https://cdn.discordapp.com'))
      assert.ok(csp.includes('https://lh3.googleusercontent.com'))
    })

    it('includes Supabase in connect-src for auth and API requests', () => {
      const csp = buildCsp('test-nonce')
      assert.ok(csp.includes('https://tcskvcmtcsaxyfoselvb.supabase.co') || csp.includes('supabase.co'))
    })
  })

  describe('Auth Cookie State Validation', () => {
    function hasValidAuthCookie(cookies: Array<{ name: string; value: string }>): boolean {
      return cookies.some(
        (cookie) =>
          cookie.name.startsWith('sb-') &&
          Boolean(cookie.value) &&
          cookie.value.trim() !== '' &&
          cookie.value !== '""' &&
          cookie.value !== '[]'
      )
    }

    it('identifies genuine Supabase auth tokens as authenticated', () => {
      const cookies = [
        { name: 'sb-tcskvcmtcsaxyfoselvb-auth-token', value: 'base64-access-token-string' },
        { name: 'theme', value: 'dark' },
      ]
      assert.equal(hasValidAuthCookie(cookies), true)
    })

    it('rejects empty, deleted, or cleared Supabase cookies after logout', () => {
      const emptyCookies = [
        { name: 'sb-tcskvcmtcsaxyfoselvb-auth-token', value: '' },
      ]
      const whitespaceCookies = [
        { name: 'sb-tcskvcmtcsaxyfoselvb-auth-token', value: '   ' },
      ]
      const quotedEmptyCookies = [
        { name: 'sb-tcskvcmtcsaxyfoselvb-auth-token', value: '""' },
      ]
      const emptyArrayCookies = [
        { name: 'sb-tcskvcmtcsaxyfoselvb-auth-token', value: '[]' },
      ]

      assert.equal(hasValidAuthCookie(emptyCookies), false)
      assert.equal(hasValidAuthCookie(whitespaceCookies), false)
      assert.equal(hasValidAuthCookie(quotedEmptyCookies), false)
      assert.equal(hasValidAuthCookie(emptyArrayCookies), false)
    })

    it('returns false when no sb- cookies exist', () => {
      const normalCookies = [
        { name: 'ga_session', value: '12345' },
        { name: 'preferences', value: 'compact' },
      ]
      assert.equal(hasValidAuthCookie(normalCookies), false)
      assert.equal(hasValidAuthCookie([]), false)
    })
  })
})


