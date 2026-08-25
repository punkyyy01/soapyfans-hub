import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rankActivity, type PulseFeedItem } from '../utils/activity'

function item(overrides: Partial<PulseFeedItem>): PulseFeedItem {
  return {
    id: 'id',
    kind: 'review',
    title: 'title',
    subtitle: null,
    imageUrl: null,
    href: '/',
    authorId: null,
    authorName: null,
    rating: null,
    timestamp: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('rankActivity', () => {
  it('keeps plain recency order when nobody is followed', () => {
    const items = [
      item({ id: 'a', timestamp: '2026-01-01T00:00:00Z' }),
      item({ id: 'b', timestamp: '2026-01-03T00:00:00Z' }),
      item({ id: 'c', timestamp: '2026-01-02T00:00:00Z' }),
    ]
    const ranked = rankActivity(items, new Set())
    assert.deepEqual(ranked.map((i) => i.id), ['b', 'c', 'a'])
  })

  it('boosts a followed author above more recent unfollowed items', () => {
    const items = [
      item({ id: 'recent-stranger', authorId: 'stranger', timestamp: '2026-01-05T00:00:00Z' }),
      item({ id: 'older-followed', authorId: 'friend', timestamp: '2026-01-01T00:00:00Z' }),
    ]
    const ranked = rankActivity(items, new Set(['friend']))
    assert.deepEqual(ranked.map((i) => i.id), ['older-followed', 'recent-stranger'])
  })

  it('orders multiple followed authors by recency among themselves', () => {
    const items = [
      item({ id: 'friend-old', authorId: 'friend', timestamp: '2026-01-01T00:00:00Z' }),
      item({ id: 'friend-new', authorId: 'friend', timestamp: '2026-01-03T00:00:00Z' }),
      item({ id: 'stranger', authorId: 'stranger', timestamp: '2026-01-04T00:00:00Z' }),
    ]
    const ranked = rankActivity(items, new Set(['friend']))
    assert.deepEqual(ranked.map((i) => i.id), ['friend-new', 'friend-old', 'stranger'])
  })

  it('news items (no author) are never boosted, ordered purely by recency', () => {
    const items = [
      item({ id: 'news-old', kind: 'news', authorId: null, timestamp: '2026-01-01T00:00:00Z' }),
      item({ id: 'followed', authorId: 'friend', timestamp: '2026-01-02T00:00:00Z' }),
      item({ id: 'news-new', kind: 'news', authorId: null, timestamp: '2026-01-03T00:00:00Z' }),
    ]
    const ranked = rankActivity(items, new Set(['friend']))
    assert.deepEqual(ranked.map((i) => i.id), ['followed', 'news-new', 'news-old'])
  })

  it('does not mutate the input array', () => {
    const items = [item({ id: 'a', timestamp: '2026-01-01T00:00:00Z' }), item({ id: 'b', timestamp: '2026-01-02T00:00:00Z' })]
    const original = [...items]
    rankActivity(items, new Set())
    assert.deepEqual(items, original)
  })
})
