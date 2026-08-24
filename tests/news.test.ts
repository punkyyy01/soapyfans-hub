import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { passesKeywordFilter, extractImageFromRssItem, isValidNewsTag } from '../utils/news'

describe('passesKeywordFilter', () => {
  it('passes when the title contains the full "Sophie Thatcher" phrase', () => {
    assert.ok(passesKeywordFilter('Sophie Thatcher joins new A24 thriller', ''))
  })

  it('passes when the phrase is only in the description', () => {
    assert.ok(passesKeywordFilter('New A24 thriller announced', 'Sophie Thatcher will star.'))
  })

  it('is case-insensitive', () => {
    assert.ok(passesKeywordFilter('SOPHIE THATCHER on her new role', ''))
  })

  it('rejects a story that only mentions "Sophie" without "Thatcher"', () => {
    assert.equal(passesKeywordFilter('Sophie Turner spotted in New York', ''), false)
  })

  it('rejects a story that only mentions "Thatcher" without "Sophie" (e.g. Margaret Thatcher)', () => {
    assert.equal(passesKeywordFilter('Margaret Thatcher biopic in development', ''), false)
  })

  it('rejects unrelated entertainment news', () => {
    assert.equal(passesKeywordFilter('New trailer drops for upcoming blockbuster', 'Fans are excited.'), false)
  })
})

describe('isValidNewsTag', () => {
  it('accepts a known tag', () => {
    assert.ok(isValidNewsTag('interview'))
  })

  it('rejects an unknown tag', () => {
    assert.equal(isValidNewsTag('not-a-real-tag'), false)
  })

  it('rejects null', () => {
    assert.equal(isValidNewsTag(null), false)
  })
})

describe('extractImageFromRssItem', () => {
  it('prefers an image enclosure', () => {
    const url = extractImageFromRssItem({
      enclosure: { url: 'https://example.com/enclosure.jpg', type: 'image/jpeg' },
    })
    assert.equal(url, 'https://example.com/enclosure.jpg')
  })

  it('ignores a non-image enclosure and falls through', () => {
    const url = extractImageFromRssItem({
      enclosure: { url: 'https://example.com/audio.mp3', type: 'audio/mpeg' },
      'media:content': { $: { url: 'https://example.com/media.jpg', medium: 'image' } },
    })
    assert.equal(url, 'https://example.com/media.jpg')
  })

  it('reads media:content when there is no enclosure', () => {
    const url = extractImageFromRssItem({
      'media:content': { $: { url: 'https://example.com/media.jpg', medium: 'image' } },
    })
    assert.equal(url, 'https://example.com/media.jpg')
  })

  it('reads the first entry of a media:content array', () => {
    const url = extractImageFromRssItem({
      'media:content': [
        { $: { url: 'https://example.com/first.jpg', medium: 'image' } },
        { $: { url: 'https://example.com/second.jpg', medium: 'image' } },
      ],
    })
    assert.equal(url, 'https://example.com/first.jpg')
  })

  it('falls back to media:thumbnail', () => {
    const url = extractImageFromRssItem({
      'media:thumbnail': { $: { url: 'https://example.com/thumb.jpg' } },
    })
    assert.equal(url, 'https://example.com/thumb.jpg')
  })

  it('falls back to media:group > media:content', () => {
    const url = extractImageFromRssItem({
      'media:group': { 'media:content': { $: { url: 'https://example.com/group.jpg', medium: 'image' } } },
    })
    assert.equal(url, 'https://example.com/group.jpg')
  })

  it('falls back to the first <img> in inline HTML content', () => {
    const url = extractImageFromRssItem({
      'content:encoded': '<p>Story</p><img src="https://example.com/inline.jpg" alt="">',
    })
    assert.equal(url, 'https://example.com/inline.jpg')
  })

  it('ignores a relative or non-http <img> src', () => {
    const url = extractImageFromRssItem({
      content: '<img src="/relative.jpg">',
    })
    assert.equal(url, null)
  })

  it('returns null when there is no image anywhere', () => {
    assert.equal(extractImageFromRssItem({}), null)
  })
})
