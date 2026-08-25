import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPaletteItems, EMPTY_PALETTE_RESULTS, type PaletteResults } from '../utils/searchPalette'
import type { NormalizedCredit } from '../utils/tmdb'

function credit(overrides: Partial<NormalizedCredit>): NormalizedCredit {
  return {
    id: 1,
    mediaType: 'movie',
    title: 'Title',
    date: '2026-01-01',
    year: '2026',
    posterPath: null,
    backdropPath: null,
    overview: '',
    voteAverage: 0,
    ...overrides,
  }
}

describe('buildPaletteItems', () => {
  it('returns an empty list for empty results', () => {
    assert.deepEqual(buildPaletteItems(EMPTY_PALETTE_RESULTS), [])
  })

  it('builds a profile item using username for the link and handle', () => {
    const results: PaletteResults = {
      ...EMPTY_PALETTE_RESULTS,
      profiles: [{ id: 'u1', username: 'frambuesa', display_name: 'Frambuesa', avatar_url: null }],
    }
    const [item] = buildPaletteItems(results)
    assert.equal(item.section, 'Profiles')
    assert.equal(item.href, '/profile/frambuesa')
    assert.equal(item.primary, 'Frambuesa')
    assert.equal(item.secondary, '@frambuesa')
  })

  it('falls back to the profile id for the link when there is no username', () => {
    const results: PaletteResults = {
      ...EMPTY_PALETTE_RESULTS,
      profiles: [{ id: 'u1', username: null, display_name: null, avatar_url: null }],
    }
    const [item] = buildPaletteItems(results)
    assert.equal(item.href, '/profile/u1')
    assert.equal(item.primary, 'Anonymous')
    assert.equal(item.secondary, null)
  })

  it('routes a movie title to /films and a tv title to /tv', () => {
    const results: PaletteResults = {
      ...EMPTY_PALETTE_RESULTS,
      titles: [
        credit({ id: 111, mediaType: 'movie', title: 'Heretic', year: '2024' }),
        credit({ id: 222, mediaType: 'tv', title: 'Yellowjackets', year: '2021' }),
      ],
    }
    const [film, tv] = buildPaletteItems(results)
    assert.equal(film.href, '/films/111')
    assert.equal(film.secondary, 'Film · 2024')
    assert.equal(tv.href, '/tv/222')
    assert.equal(tv.secondary, 'TV · 2021')
  })

  it('combines author and content into the review secondary line', () => {
    const results: PaletteResults = {
      ...EMPTY_PALETTE_RESULTS,
      reviews: [{ id: 'r1', content: 'so good', href: '/films/111', title: 'Heretic', authorName: 'Alex', authorHref: null }],
    }
    const [item] = buildPaletteItems(results)
    assert.equal(item.section, 'Reviews')
    assert.equal(item.primary, 'Heretic')
    assert.equal(item.secondary, 'Alex — so good')
  })

  it('news items always link to /news', () => {
    const results: PaletteResults = {
      ...EMPTY_PALETTE_RESULTS,
      news: [{ id: 'n1', title: 'Yellowjackets renewed', description: null, source_name: 'Variety' }],
    }
    const [item] = buildPaletteItems(results)
    assert.equal(item.section, 'News')
    assert.equal(item.href, '/news')
    assert.equal(item.secondary, 'Variety')
  })

  it('preserves section order: Profiles, Titles, Reviews, News', () => {
    const results: PaletteResults = {
      profiles: [{ id: 'u1', username: 'a', display_name: null, avatar_url: null }],
      titles: [credit({ id: 1 })],
      reviews: [{ id: 'r1', content: 'c', href: '/films/1', title: 't', authorName: 'a', authorHref: null }],
      news: [{ id: 'n1', title: 't', description: null, source_name: 's' }],
    }
    const items = buildPaletteItems(results)
    assert.deepEqual(items.map((i) => i.section), ['Profiles', 'Titles', 'Reviews', 'News'])
  })
})
