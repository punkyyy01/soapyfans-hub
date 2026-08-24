import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isWatchlistMediaType, watchlistTargetPath } from '../utils/watchlist'

describe('isWatchlistMediaType', () => {
  it('accepts "movie"', () => {
    assert.ok(isWatchlistMediaType('movie'))
  })

  it('accepts "tv"', () => {
    assert.ok(isWatchlistMediaType('tv'))
  })

  it('rejects any other string', () => {
    assert.equal(isWatchlistMediaType('album'), false)
  })

  it('rejects null and undefined', () => {
    assert.equal(isWatchlistMediaType(null), false)
    assert.equal(isWatchlistMediaType(undefined), false)
  })
})

describe('watchlistTargetPath', () => {
  it('links movies to /films/:id', () => {
    assert.equal(watchlistTargetPath('movie', 123), '/films/123')
  })

  it('links tv to /tv/:id', () => {
    assert.equal(watchlistTargetPath('tv', 456), '/tv/456')
  })
})
