import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { getSiteUrl, absoluteUrl, SITE_NAME, SITE_TAGLINE, SITE_OG_IMAGE, NEWS_OG_IMAGE } from '../utils/site'

describe('Site utilities', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('provides brand constants', () => {
    assert.equal(SITE_NAME, 'SoapyFans Hub')
    assert.ok(SITE_TAGLINE.length > 0)
    assert.equal(SITE_OG_IMAGE, '/og.png')
    assert.equal(NEWS_OG_IMAGE, '/og-news.png')
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
    assert.equal(absoluteUrl('/og.png'), 'https://soapyhub.fans/og.png')
    assert.equal(absoluteUrl('og.png'), 'https://soapyhub.fans/og.png')
    assert.equal(absoluteUrl(NEWS_OG_IMAGE), 'https://soapyhub.fans/og-news.png')
  })

  it('ensures static Open Graph image assets exist in public directory', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    
    for (const imgPath of [SITE_OG_IMAGE, NEWS_OG_IMAGE]) {
      const fullPath = path.join(process.cwd(), 'public', imgPath.replace(/^\//, ''))
      assert.ok(fs.existsSync(fullPath), `Asset ${imgPath} must exist at ${fullPath}`)
      const stat = fs.statSync(fullPath)
      assert.ok(stat.size > 1000, `Asset ${imgPath} must not be empty`)
      
      // Verify PNG magic bytes (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
      const buffer = fs.readFileSync(fullPath)
      assert.equal(buffer[0], 0x89)
      assert.equal(buffer[1], 0x50) // 'P'
      assert.equal(buffer[2], 0x4E) // 'N'
      assert.equal(buffer[3], 0x47) // 'G'
    }
  })
})
