import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import robots from '../app/robots'

describe('robots.ts crawl directives', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('disallows the TMDB search API from crawling', () => {
    const result = robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    assert.ok(disallow.includes('/api/tmdb-search'))
  })

  it('keeps disallowing auth, admin, and profile-editor routes', () => {
    const result = robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    for (const path of ['/login', '/register', '/auth/', '/dashboard-s9k2mx', '/profile/edit']) {
      assert.ok(disallow.includes(path), `expected ${path} to remain disallowed`)
    }
  })

  it('does not disallow public content routes', () => {
    const result = robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    for (const path of ['/films', '/tv', '/music', '/about', '/profile/testuser']) {
      assert.equal(
        disallow.some((d) => d === path),
        false,
        `${path} must not be an exact disallow entry`,
      )
    }
    assert.equal(rule.allow, '/')
  })

  it('declares the sitemap URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://soapyhub.fans'
    const result = robots()
    assert.equal(result.sitemap, 'https://soapyhub.fans/sitemap.xml')
    assert.equal(result.host, 'https://soapyhub.fans')
  })
})
