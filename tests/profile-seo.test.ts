import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateProfileSeo,
  isMeaningfulReviewText,
  MEANINGFUL_REVIEW_MIN_LENGTH,
  BIO_MEANINGFUL_MIN,
  ABOUT_ME_MEANINGFUL_MIN,
  FAVORITES_WITH_IDENTITY_MIN,
} from '../utils/profile-seo'

const base = {
  exists: true,
  isBanned: false,
  username: 'testuser',
  bio: null as string | null,
  aboutMe: null as string | null,
  favoritesCount: 0,
  reviewContents: [] as (string | null)[],
}

describe('isMeaningfulReviewText', () => {
  it('rejects null/empty content', () => {
    assert.equal(isMeaningfulReviewText(null), false)
    assert.equal(isMeaningfulReviewText(''), false)
    assert.equal(isMeaningfulReviewText('   '), false)
  })

  it('rejects short one-word reviews', () => {
    assert.equal(isMeaningfulReviewText('a'), false)
    assert.equal(isMeaningfulReviewText('good'), false)
    assert.equal(isMeaningfulReviewText('nice'), false)
  })

  it('rejects repeated punctuation even if long enough', () => {
    assert.equal(isMeaningfulReviewText('!'.repeat(MEANINGFUL_REVIEW_MIN_LENGTH)), false)
  })

  it('rejects repeated-character noise even if long enough', () => {
    assert.equal(isMeaningfulReviewText('a'.repeat(MEANINGFUL_REVIEW_MIN_LENGTH)), false)
  })

  it('accepts a real written review', () => {
    assert.ok(isMeaningfulReviewText('A genuinely unsettling watch that stuck with me for days.'))
  })
})

describe('evaluateProfileSeo', () => {
  it('empty profile is noindex', () => {
    assert.equal(evaluateProfileSeo(base), 'noindex')
  })

  it('username + avatar only (no text signals) is noindex', () => {
    assert.equal(evaluateProfileSeo({ ...base }), 'noindex')
  })

  it('bio below the meaningful threshold is noindex', () => {
    const bio = 'a'.repeat(BIO_MEANINGFUL_MIN - 1)
    assert.equal(evaluateProfileSeo({ ...base, bio }), 'noindex')
  })

  it('substantive About Me is indexable', () => {
    const aboutMe = 'a'.repeat(ABOUT_ME_MEANINGFUL_MIN)
    assert.equal(evaluateProfileSeo({ ...base, aboutMe }), 'indexable')
  })

  it('substantive bio alone is indexable', () => {
    const bio = 'a'.repeat(BIO_MEANINGFUL_MIN)
    assert.equal(evaluateProfileSeo({ ...base, bio }), 'indexable')
  })

  it('2+ meaningful reviews are indexable with no identity text at all', () => {
    const reviewContents = [
      'A genuinely unsettling watch that stuck with me for days.',
      'Beautifully shot, and the score does a lot of quiet work.',
    ]
    assert.equal(evaluateProfileSeo({ ...base, reviewContents }), 'indexable')
  })

  it('a single meaningful review alone does not qualify', () => {
    const reviewContents = ['A genuinely unsettling watch that stuck with me for days.']
    assert.equal(evaluateProfileSeo({ ...base, reviewContents }), 'noindex')
  })

  it('a single meaningful review plus identity text is indexable', () => {
    const reviewContents = ['A genuinely unsettling watch that stuck with me for days.']
    assert.equal(evaluateProfileSeo({ ...base, bio: 'Horror fan.', reviewContents }), 'indexable')
  })

  it('rating-only history (no written content) never qualifies on its own', () => {
    const reviewContents = [null, null, null]
    assert.equal(evaluateProfileSeo({ ...base, reviewContents }), 'noindex')
  })

  it('favorites alone, however many, never qualify', () => {
    assert.equal(evaluateProfileSeo({ ...base, favoritesCount: 6 }), 'noindex')
  })

  it('favorites + identity text over the threshold is indexable', () => {
    assert.equal(
      evaluateProfileSeo({ ...base, bio: 'Horror fan.', favoritesCount: FAVORITES_WITH_IDENTITY_MIN }),
      'indexable',
    )
  })

  it('favorites + identity text under the threshold is not enough', () => {
    assert.equal(
      evaluateProfileSeo({ ...base, bio: 'Horror fan.', favoritesCount: FAVORITES_WITH_IDENTITY_MIN - 1 }),
      'noindex',
    )
  })

  it('a strong profile (substantive about_me + reviews + favorites) is indexable', () => {
    assert.equal(
      evaluateProfileSeo({
        ...base,
        aboutMe: 'a'.repeat(ABOUT_ME_MEANINGFUL_MIN),
        favoritesCount: 6,
        reviewContents: ['A genuinely unsettling watch that stuck with me for days.'],
      }),
      'indexable',
    )
  })

  it('a banned profile is unavailable regardless of content', () => {
    assert.equal(
      evaluateProfileSeo({ ...base, isBanned: true, aboutMe: 'a'.repeat(ABOUT_ME_MEANINGFUL_MIN) }),
      'unavailable',
    )
  })

  it('a nonexistent profile is unavailable', () => {
    assert.equal(evaluateProfileSeo({ ...base, exists: false }), 'unavailable')
  })

  it('a profile with no stored username is never indexable, even with strong content', () => {
    assert.equal(
      evaluateProfileSeo({ ...base, username: null, aboutMe: 'a'.repeat(ABOUT_ME_MEANINGFUL_MIN) }),
      'noindex',
    )
  })
})
