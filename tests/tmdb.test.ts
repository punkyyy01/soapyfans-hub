import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeCredit,
  sortByDateDesc,
  getPortraitUrls,
  getTmdbImageUrl,
  getWatchProvidersForCountry,
  type TmdbMovieCredit,
  type TmdbTvCredit,
  type TmdbPersonImage,
} from '../utils/tmdb'

describe('TMDB utilities', () => {
  describe('normalizeCredit', () => {
    it('correctly normalizes a movie credit', () => {
      const movieCredit: TmdbMovieCredit = {
        id: 1087388,
        media_type: 'movie',
        title: 'Heretic',
        release_date: '2024-11-08',
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
        overview: 'Two young missionaries...',
        vote_average: 7.2,
        character: 'Sister Barnes',
      }

      const normalized = normalizeCredit(movieCredit)
      assert.equal(normalized.id, 1087388)
      assert.equal(normalized.mediaType, 'movie')
      assert.equal(normalized.title, 'Heretic')
      assert.equal(normalized.date, '2024-11-08')
      assert.equal(normalized.year, '2024')
      assert.equal(normalized.posterPath, '/poster.jpg')
      assert.equal(normalized.backdropPath, '/backdrop.jpg')
      assert.equal(normalized.voteAverage, 7.2)
      assert.equal(normalized.character, 'Sister Barnes')
    })

    it('correctly normalizes a TV show credit', () => {
      const tvCredit: TmdbTvCredit = {
        id: 111110,
        media_type: 'tv',
        name: 'Yellowjackets',
        first_air_date: '2021-11-14',
        poster_path: '/yj.jpg',
        backdrop_path: '/yj-back.jpg',
        overview: 'A wildly talented high school girls soccer team...',
        vote_average: 7.9,
        character: 'Teen Natalie',
        episode_count: 29,
      }

      const normalized = normalizeCredit(tvCredit)
      assert.equal(normalized.id, 111110)
      assert.equal(normalized.mediaType, 'tv')
      assert.equal(normalized.title, 'Yellowjackets')
      assert.equal(normalized.date, '2021-11-14')
      assert.equal(normalized.year, '2021')
      assert.equal(normalized.character, 'Teen Natalie')
      assert.equal(normalized.episodeCount, 29)
    })

    it('handles missing release dates gracefully', () => {
      const credit: TmdbMovieCredit = {
        id: 999,
        media_type: 'movie',
        title: 'Upcoming Project',
        release_date: '',
        poster_path: null,
        backdrop_path: null,
        overview: '',
        vote_average: 0,
      }

      const normalized = normalizeCredit(credit)
      assert.equal(normalized.date, '')
      assert.equal(normalized.year, null)
    })
  })

  describe('sortByDateDesc', () => {
    it('sorts credits in descending order by date', () => {
      const a = normalizeCredit({
        id: 1,
        media_type: 'movie',
        title: 'Older',
        release_date: '2021-05-10',
        poster_path: null,
        backdrop_path: null,
        overview: '',
        vote_average: 6,
      })
      const b = normalizeCredit({
        id: 2,
        media_type: 'movie',
        title: 'Newer',
        release_date: '2024-11-08',
        poster_path: null,
        backdrop_path: null,
        overview: '',
        vote_average: 8,
      })

      const list = [a, b].sort(sortByDateDesc)
      assert.equal(list[0].id, 2)
      assert.equal(list[1].id, 1)
    })
  })

  describe('getTmdbImageUrl', () => {
    it('returns null when path is null', () => {
      assert.equal(getTmdbImageUrl(null), null)
    })

    it('constructs correct TMDB CDN URL with custom size', () => {
      assert.equal(
        getTmdbImageUrl('/sample.jpg', 'w780'),
        'https://image.tmdb.org/t/p/w780/sample.jpg'
      )
    })

    it('defaults to w342 size', () => {
      assert.equal(
        getTmdbImageUrl('/sample.jpg'),
        'https://image.tmdb.org/t/p/w342/sample.jpg'
      )
    })
  })

  describe('getPortraitUrls', () => {
    it('filters portrait images by aspect ratio and returns CDN URLs', () => {
      const profiles: TmdbPersonImage[] = [
        {
          aspect_ratio: 0.667,
          file_path: '/portrait1.jpg',
          height: 1500,
          width: 1000,
          iso_639_1: null,
          vote_average: 5.4,
          vote_count: 10,
        },
        {
          aspect_ratio: 1.5, // landscape - should be filtered out
          file_path: '/landscape.jpg',
          height: 1000,
          width: 1500,
          iso_639_1: null,
          vote_average: 6.0,
          vote_count: 15,
        },
      ]

      const urls = getPortraitUrls(profiles, 5, 'w500')
      assert.equal(urls.length, 1)
      assert.equal(urls[0], 'https://image.tmdb.org/t/p/w500/portrait1.jpg')
    })
  })

  describe('getWatchProvidersForCountry', () => {
    it('retrieves country-specific watch providers', () => {
      const providers = {
        US: { link: 'https://tmdb.org/us' },
        CL: { link: 'https://tmdb.org/cl' },
      }
      assert.equal(getWatchProvidersForCountry(providers, 'US')?.link, 'https://tmdb.org/us')
      assert.equal(getWatchProvidersForCountry(providers, 'CL')?.link, 'https://tmdb.org/cl')
      assert.equal(getWatchProvidersForCountry(providers, 'FR'), null)
    })
  })
})
