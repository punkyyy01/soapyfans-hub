import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateTrending } from '../utils/trending'

describe('aggregateTrending', () => {
  const filmMeta = new Map([
    ['film-1', { tmdb_id: 111, title: 'Heretic', poster_path: '/heretic.jpg' }],
    ['film-2', { tmdb_id: 222, title: 'Yellowjackets', poster_path: null }],
  ])
  const musicMeta = new Map([
    ['release-1', { title: 'Pivot & Scrape', cover_art_url: 'https://example.com/cover.jpg', slug: 'pivot-scrape' }],
  ])

  it('ranks by review count first', () => {
    const filmRows = [
      { film_id: 'film-1', rating: 5 },
      { film_id: 'film-1', rating: 4 },
      { film_id: 'film-2', rating: 5 },
    ]
    const result = aggregateTrending(filmRows, [], filmMeta, musicMeta)
    assert.equal(result[0].id, 'film-1')
    assert.equal(result[0].reviewCount, 2)
    assert.equal(result[1].id, 'film-2')
    assert.equal(result[1].reviewCount, 1)
  })

  it('breaks a review-count tie by average rating', () => {
    const filmRows = [
      { film_id: 'film-1', rating: 3 },
      { film_id: 'film-2', rating: 5 },
    ]
    const result = aggregateTrending(filmRows, [], filmMeta, musicMeta)
    assert.equal(result[0].id, 'film-2')
    assert.equal(result[0].avgRating, 5)
    assert.equal(result[1].id, 'film-1')
  })

  it('computes the average rating correctly', () => {
    const filmRows = [
      { film_id: 'film-1', rating: 5 },
      { film_id: 'film-1', rating: 3 },
    ]
    const result = aggregateTrending(filmRows, [], filmMeta, musicMeta)
    assert.equal(result[0].avgRating, 4)
  })

  it('merges film and music results, resolving each href/imageUrl from its own metadata', () => {
    const filmRows = [{ film_id: 'film-1', rating: 5 }]
    const musicRows = [{ release_id: 'release-1', rating: 4 }]
    const result = aggregateTrending(filmRows, musicRows, filmMeta, musicMeta)

    const film = result.find((r) => r.mediaType === 'film')!
    assert.equal(film.href, '/films/111')
    assert.equal(film.imageUrl, 'https://image.tmdb.org/t/p/w342/heretic.jpg')

    const music = result.find((r) => r.mediaType === 'music')!
    assert.equal(music.href, '/music/pivot-scrape')
    assert.equal(music.imageUrl, 'https://example.com/cover.jpg')
  })

  it('a film with no poster resolves imageUrl to null instead of a broken URL', () => {
    const result = aggregateTrending([{ film_id: 'film-2', rating: 5 }], [], filmMeta, musicMeta)
    assert.equal(result[0].imageUrl, null)
  })

  it('silently skips a review row whose title metadata is missing (e.g. a deleted film)', () => {
    const result = aggregateTrending([{ film_id: 'unknown-film', rating: 5 }], [], filmMeta, musicMeta)
    assert.equal(result.length, 0)
  })

  it('returns an empty array when there are no reviews at all', () => {
    assert.deepEqual(aggregateTrending([], [], filmMeta, musicMeta), [])
  })
})
