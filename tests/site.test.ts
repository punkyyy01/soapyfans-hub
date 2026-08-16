import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { getSiteUrl, absoluteUrl, SITE_NAME, SITE_TAGLINE } from '../utils/site'

describe('Site utilities', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('provides brand constants', () => {
    assert.equal(SITE_NAME, 'SoapyFans Hub')
    assert.ok(SITE_TAGLINE.length > 0)
  })

  it('resolves site URL using NEXT_PUBLIC_SITE_URL without trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom-hub.fans/'
    delete process.env.VERCEL_URL
    assert.equal(getSiteUrl(), 'https://custom-hub.fans')
  })

  it('resolves site URL using Vercel URL when NEXT_PUBLIC_SITE_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.VERCEL_URL = 'soapyfans-hub.vercel.app'
    assert.equal(getSiteUrl(), 'https://soapyfans-hub.vercel.app')
  })

  it('resolves localhost in development fallback', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_URL
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    assert.equal(getSiteUrl(), 'http://localhost:3000')
  })

  it('builds absolute URLs correctly', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://soapyhub.fans'
    assert.equal(absoluteUrl('/og.svg'), 'https://soapyhub.fans/og.svg')
    assert.equal(absoluteUrl('og.svg'), 'https://soapyhub.fans/og.svg')
  })
})
