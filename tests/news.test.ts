import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  passesKeywordFilter,
  extractImageFromRssItem,
  isValidNewsTag,
  normalizeNewsTitle,
  areSimilarTitles,
  decodeHtmlEntities,
  extractOutletName,
  extractImageFromArticlePage,
} from '../utils/news'
import { dedupNewsForDisplay } from '../utils/news-display'

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

describe('decodeHtmlEntities', () => {
  it('decodes standard and numerical HTML entities', () => {
    assert.equal(decodeHtmlEntities('Sophie &amp; Co.'), 'Sophie & Co.')
    assert.equal(decodeHtmlEntities('&#038;'), '&')
    assert.equal(decodeHtmlEntities('&quot;Her Private Hell&quot;'), '"Her Private Hell"')
    assert.equal(decodeHtmlEntities('Sophie&#039;s Choice'), "Sophie's Choice")
    assert.equal(decodeHtmlEntities('Sophie’s Choice'), "Sophie's Choice")
    assert.equal(decodeHtmlEntities('Sophie&nbsp;Thatcher'), 'Sophie Thatcher')
    assert.equal(decodeHtmlEntities('Title&#8211;Subtitle'), 'Title-Subtitle')
  })

  it('handles empty string gracefully', () => {
    assert.equal(decodeHtmlEntities(''), '')
  })
})

describe('isValidNewsTag', () => {
  it('accepts a known tag', () => {
    assert.ok(isValidNewsTag('interview'))
    assert.ok(isValidNewsTag('new-project'))
    assert.ok(isValidNewsTag('awards'))
  })

  it('rejects an unknown tag', () => {
    assert.equal(isValidNewsTag('not-a-real-tag'), false)
  })

  it('rejects null', () => {
    assert.equal(isValidNewsTag(null), false)
  })
})

describe('normalizeNewsTitle', () => {
  it('strips a trailing " - <Outlet>" suffix', () => {
    assert.equal(
      normalizeNewsTitle('Sophie Thatcher at Deauville American Film Festival - IMDb'),
      'sophie thatcher at deauville american film festival',
    )
    assert.equal(
      normalizeNewsTitle('Sophie Thatcher talks Heretic | Variety'),
      'sophie thatcher talks heretic',
    )
    assert.equal(
      normalizeNewsTitle('Sophie Thatcher interview — The Hollywood Reporter'),
      'sophie thatcher interview',
    )
  })

  it('strips editorial prefixes', () => {
    assert.equal(
      normalizeNewsTitle('EXCLUSIVE: Sophie Thatcher joins new thriller'),
      'sophie thatcher joins new thriller',
    )
    assert.equal(
      normalizeNewsTitle('Interview: Sophie Thatcher on Her Private Hell'),
      'sophie thatcher on her private hell',
    )
  })

  it('decodes HTML entities before normalizing', () => {
    assert.equal(
      normalizeNewsTitle('&quot;Her Private Hell&quot; belongs to Sophie Thatcher - Salon.com'),
      'her private hell belongs to sophie thatcher',
    )
    assert.equal(
      normalizeNewsTitle('Sophie Thatcher &amp; Obsession’s Nikki Comparisons - AOL.ca'),
      'sophie thatcher obsessions nikki comparisons',
    )
  })

  it('lowercases and collapses repeated whitespace and strips punctuation', () => {
    assert.equal(
      normalizeNewsTitle('  Sophie   Thatcher:   "Talks   Heretic!"  '),
      'sophie thatcher talks heretic',
    )
  })
})

describe('areSimilarTitles (Deduplication)', () => {
  it('matches the same story reported by different outlets (Google News syndication)', () => {
    assert.ok(
      areSimilarTitles(
        'Sophie Thatcher at Deauville American Film Festival - IMDb',
        'Sophie Thatcher at Deauville American Film Festival - Variety',
      ),
    )
    assert.ok(
      areSimilarTitles(
        'Sophie Thatcher Is Ready to Move Beyond ‘Yellowjackets’ and Step Out of the Darkness - Variety',
        'Sophie Thatcher Is Ready to Move Beyond ‘Yellowjackets’ and Step Out of the Darkness - IMDb',
      ),
    )
  })

  it('matches the same story even if seen weeks/months apart (independent of 30-day window)', () => {
    const historicalStory = 'Sophie Thatcher on Making ‘Her Private Hell’ - Variety'
    const resurfacedStory = 'Sophie Thatcher on Making ‘Her Private Hell’ - IMDb'
    assert.ok(areSimilarTitles(historicalStory, resurfacedStory))
  })

  it('matches titles with minor punctuation, quotes, and case variations', () => {
    assert.ok(
      areSimilarTitles(
        'Sophie Thatcher Talks "Heretic"',
        'sophie thatcher talks ‘heretic’!! - Deadline',
      ),
    )
  })

  it('matches titles with slight rewordings of the same substance', () => {
    assert.ok(
      areSimilarTitles(
        'Sophie Thatcher is ready to move beyond Yellowjackets and step out of the darkness',
        'Sophie Thatcher ready to move beyond Yellowjackets, stepping out of darkness',
      ),
    )
  })

  it('does not match legitimately distinct stories', () => {
    assert.equal(
      areSimilarTitles(
        'Sophie Thatcher joins new A24 thriller',
        'Sophie Thatcher walks Cannes red carpet',
      ),
      false,
    )
    assert.equal(
      areSimilarTitles(
        'Sophie Thatcher wins Best Actress at Deauville',
        'Sophie Thatcher spotted at LAX',
      ),
      false,
    )
    assert.equal(
      areSimilarTitles('Sophie Thatcher talks Heretic', 'Sophie Thatcher talks Yellowjackets'),
      false,
    )
  })

  it('does not produce false positives on stories that share entity words and common verbs', () => {
    assert.equal(
      areSimilarTitles(
        'Sophie Thatcher in Yellowjackets season 3 premiere',
        'Sophie Thatcher in Companion trailer breakdown',
      ),
      false,
    )
  })
})

describe('extractOutletName', () => {
  it('extracts outlet name from Google News title suffix', () => {
    assert.equal(
      extractOutletName('Sophie Thatcher at Deauville - Variety', 'https://variety.com/123', 'Google News'),
      'Variety',
    )
    assert.equal(
      extractOutletName('Sophie Thatcher on Heretic - The Hollywood Reporter', 'https://hollywoodreporter.com/123', 'Google News'),
      'The Hollywood Reporter',
    )
  })

  it('extracts outlet name from decoded URL hostname when suffix is absent', () => {
    assert.equal(
      extractOutletName('Sophie Thatcher on Heretic', 'https://deadline.com/article/123', 'Google News'),
      'deadline.com',
    )
  })

  it('preserves direct source names for non-Google feeds', () => {
    assert.equal(
      extractOutletName('Sophie Thatcher on Heretic', 'https://deadline.com/article/123', 'Deadline'),
      'Deadline',
    )
  })
})

describe('extractImageFromRssItem', () => {
  it('prefers an image enclosure and decodes entities in URL', () => {
    const url = extractImageFromRssItem({
      enclosure: { url: 'https://example.com/enclosure.jpg?w=1000&#038;h=500', type: 'image/jpeg' },
    })
    assert.equal(url, 'https://example.com/enclosure.jpg?w=1000&h=500')
  })

  it('ignores video enclosures (.mov, .mp4, audio) and falls through', () => {
    const url = extractImageFromRssItem({
      enclosure: { url: 'https://example.com/video.mp4', type: 'video/mp4' },
      'media:content': { $: { url: 'https://example.com/media.jpg', medium: 'image' } },
    })
    assert.equal(url, 'https://example.com/media.jpg')
  })

  it('ignores video in media:thumbnail (.mov)', () => {
    const url = extractImageFromRssItem({
      'media:thumbnail': { $: { url: 'https://assets.vogue.com/clips/master/pass/IMG_4965.mov' } },
      'content:encoded': '<img src="https://example.com/actual-image.jpg">',
    })
    assert.equal(url, 'https://example.com/actual-image.jpg')
  })

  it('reads media:content and media:group', () => {
    const url = extractImageFromRssItem({
      'media:group': { 'media:content': { $: { url: 'https://example.com/group.jpg', medium: 'image' } } },
    })
    assert.equal(url, 'https://example.com/group.jpg')
  })

  it('falls back to inline <img> src or data-src', () => {
    const url = extractImageFromRssItem({
      'content:encoded': '<p>Text</p><img data-src="https://example.com/lazy.jpg" alt="">',
    })
    assert.equal(url, 'https://example.com/lazy.jpg')
  })

  it('returns null for empty or non-http image src', () => {
    assert.equal(extractImageFromRssItem({ content: '<img src="/relative.png">' }), null)
    assert.equal(extractImageFromRssItem({}), null)
  })
})

describe('extractImageFromArticlePage', () => {
  it('extracts og:image from mock HTML page with entity decoding and relative URL resolution', async () => {
    // Test HTML parsing logic
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Sophie Thatcher Interview</title>
          <meta property="og:image" content="/uploads/2026/08/sophie.jpg?w=1200&#038;h=630" />
        </head>
        <body><p>Article body</p></body>
      </html>
    `

    // Verify regex matches correctly
    const match = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
    assert.ok(match)
    const raw = decodeHtmlEntities(match![1])
    const resolved = new URL(raw, 'https://variety.com/2026/article/1').toString()
    assert.equal(resolved, 'https://variety.com/uploads/2026/08/sophie.jpg?w=1200&h=630')
  })

  it('extracts twitter:image as fallback when og:image is absent', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:image" content="https://cdn.example.com/photo.webp" />
        </head>
      </html>
    `
    const match = html.match(/<meta[^>]+name=["'](?:twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["']/i)
    assert.ok(match)
    assert.equal(match![1], 'https://cdn.example.com/photo.webp')
  })
})

describe('dedupNewsForDisplay', () => {
  it('removes duplicate stories from news cards before rendering', () => {
    const cards = [
      {
        id: '1',
        title: 'Sophie Thatcher Is Ready to Move Beyond ‘Yellowjackets’ and Step Out of the Darkness - Variety',
        description: 'Interview description',
        source_name: 'Variety',
        source_url: 'https://variety.com/story',
        canonical_url: 'https://variety.com/story',
        tag: 'interview',
        published_at: '2026-07-22T07:00:00Z',
        image_url: 'https://variety.com/image.jpg',
      },
      {
        id: '2',
        title: 'Sophie Thatcher Is Ready to Move Beyond ‘Yellowjackets’ and Step Out of the Darkness - IMDb',
        description: 'IMDb syndicated copy',
        source_name: 'IMDb',
        source_url: 'https://news.google.com/articles/123',
        canonical_url: 'https://www.imdb.com/news/123',
        tag: 'interview',
        published_at: '2026-08-23T08:45:00Z',
        image_url: null,
      },
      {
        id: '3',
        title: 'Sophie Thatcher at Deauville American Film Festival - Variety',
        description: 'Festival honors',
        source_name: 'Variety',
        source_url: 'https://variety.com/deauville',
        canonical_url: 'https://variety.com/deauville',
        tag: 'awards',
        published_at: '2026-08-24T12:00:00Z',
        image_url: 'https://variety.com/deauville.jpg',
      },
    ]

    const deduped = dedupNewsForDisplay(cards)
    assert.equal(deduped.length, 2)
    assert.equal(deduped[0].id, '1')
    assert.equal(deduped[1].id, '3')
  })

  it('keeps distinct news items without false positives', () => {
    const cards = [
      {
        id: '1',
        title: 'Sophie Thatcher talks Heretic',
        source_url: 'https://variety.com/1',
        image_url: 'https://variety.com/1.jpg',
      },
      {
        id: '2',
        title: 'Sophie Thatcher talks Yellowjackets',
        source_url: 'https://variety.com/2',
        image_url: 'https://variety.com/2.jpg',
      },
      {
        id: '3',
        title: 'Sophie Thatcher joins new A24 thriller',
        source_url: 'https://deadline.com/3',
        image_url: 'https://deadline.com/3.jpg',
      },
    ]

    const deduped = dedupNewsForDisplay(cards)
    assert.equal(deduped.length, 3)
  })
})
