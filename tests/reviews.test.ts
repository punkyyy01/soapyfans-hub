import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isVisibleReview, reviewAuthorProfilePath } from '../utils/reviews'

describe('isVisibleReview (public review visibility, film + music share this)', () => {
  const bannedIds = new Set(['banned-user-1'])

  it('a normal, non-deleted, non-banned review is visible', () => {
    assert.ok(
      isVisibleReview({ deleted_at: null, user_id: 'good-user' }, bannedIds),
    )
  })

  it('a soft-deleted review is not visible', () => {
    assert.equal(
      isVisibleReview({ deleted_at: '2026-01-01T00:00:00Z', user_id: 'good-user' }, bannedIds),
      false,
    )
  })

  it('a review from a banned author is not visible, even if not soft-deleted', () => {
    assert.equal(
      isVisibleReview({ deleted_at: null, user_id: 'banned-user-1' }, bannedIds),
      false,
    )
  })

  it('a review that is both deleted and from a banned author is still not visible', () => {
    assert.equal(
      isVisibleReview({ deleted_at: '2026-01-01T00:00:00Z', user_id: 'banned-user-1' }, bannedIds),
      false,
    )
  })

  it('a non-banned user continues to have their reviews visible normally', () => {
    const otherUser = { deleted_at: null, user_id: 'someone-else' }
    assert.ok(isVisibleReview(otherUser, bannedIds))
  })

  it('filtering a mixed review list keeps only eligible reviews, in place', () => {
    const reviews = [
      { id: 'a', deleted_at: null, user_id: 'good-user' },
      { id: 'b', deleted_at: null, user_id: 'banned-user-1' },
      { id: 'c', deleted_at: '2026-01-01T00:00:00Z', user_id: 'good-user' },
    ]
    const visible = reviews.filter((r) => isVisibleReview(r, bannedIds))
    assert.deepEqual(visible.map((r) => r.id), ['a'])
  })
})

describe('reviewAuthorProfilePath', () => {
  it('links to the canonical profile path when a username exists', () => {
    assert.equal(
      reviewAuthorProfilePath({ username: 'testuser' }),
      '/profile/testuser',
    )
  })

  it('returns null when the author has no username (render fallback text, not a broken link)', () => {
    assert.equal(reviewAuthorProfilePath({ username: null }), null)
  })

  it('returns null when there is no profile at all', () => {
    assert.equal(reviewAuthorProfilePath(null), null)
  })

  it('never derives a link from display name or user id', () => {
    // reviewAuthorProfilePath only accepts a `username` field -- passing a
    // shape without one is a type error at compile time, which is the
    // regression guard itself: there is no fallback parameter to misuse.
    const link = reviewAuthorProfilePath({ username: 'realusername' })
    assert.equal(link, '/profile/realusername')
  })
})
