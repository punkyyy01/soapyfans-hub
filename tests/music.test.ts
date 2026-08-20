import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, assignReleaseSlugs, findReleaseBySlug, safeExternalUrl } from '../utils/music'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    assert.equal(slugify('Pivot & Scrape'), 'pivot-scrape')
  })

  it('strips apostrophes and collapses punctuation runs', () => {
    assert.equal(slugify("Knockin' on Heaven's Door"), 'knockin-on-heaven-s-door')
  })

  it('trims leading/trailing hyphens', () => {
    assert.equal(slugify('  !Hello!  '), 'hello')
  })
})

describe('assignReleaseSlugs', () => {
  it('assigns the plain slug to each release when titles are unique', () => {
    const result = assignReleaseSlugs([{ title: 'Pivot & Scrape' }, { title: 'Break My Heart' }])
    assert.deepEqual(result.map((r) => r.slug), ['pivot-scrape', 'break-my-heart'])
  })

  it('disambiguates a slug collision deterministically by fetch order', () => {
    const result = assignReleaseSlugs([{ title: 'Encore!' }, { title: 'Encore?' }])
    assert.deepEqual(result.map((r) => r.slug), ['encore', 'encore-2'])
  })

  it('preserves the original fields alongside the new slug', () => {
    const result = assignReleaseSlugs([{ title: 'X', id: 'abc' }])
    assert.equal(result[0].id, 'abc')
    assert.equal(result[0].slug, 'x')
  })
})

describe('findReleaseBySlug', () => {
  const releases = [
    { slug: 'pivot-scrape', title: 'Pivot & Scrape' },
    { slug: 'encore', title: 'Encore!' },
  ]

  it('finds the matching release by slug', () => {
    assert.equal(findReleaseBySlug(releases, 'encore')?.title, 'Encore!')
  })

  it('returns null for a nonexistent slug', () => {
    assert.equal(findReleaseBySlug(releases, 'does-not-exist'), null)
  })
})

describe('safeExternalUrl', () => {
  it('allows an https URL on an allowed host', () => {
    assert.equal(
      safeExternalUrl('https://open.spotify.com/album/x', ['open.spotify.com']),
      'https://open.spotify.com/album/x',
    )
  })

  it('rejects a host not on the allowlist', () => {
    assert.equal(safeExternalUrl('https://evil.example.com', ['open.spotify.com']), null)
  })

  it('rejects a non-http(s) protocol', () => {
    assert.equal(safeExternalUrl('javascript:alert(1)', ['open.spotify.com']), null)
  })

  it('returns null for null input', () => {
    assert.equal(safeExternalUrl(null, ['open.spotify.com']), null)
  })
})
