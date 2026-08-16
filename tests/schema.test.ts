import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  serializeJsonLd,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildMovieSchema,
  buildTvSeriesSchema,
  buildMusicReleaseSchema,
} from '../utils/schema'

describe('Schema.org structured data generators', () => {
  it('serializeJsonLd prevents XSS by escaping < and >', () => {
    const data = { title: '</script><script>alert(1)</script>' }
    const json = serializeJsonLd(data)
    assert.equal(json.includes('<'), false)
    assert.equal(json.includes('>'), false)
    assert.ok(json.includes('\\u003c/script\\u003e'))
  })

  it('buildOrganizationSchema returns valid Organization JSON-LD', () => {
    const org = buildOrganizationSchema()
    assert.equal(org['@context'], 'https://schema.org')
    assert.equal(org['@type'], 'Organization')
    assert.equal(org.name, 'SoapyFans Hub')
  })

  it('buildWebSiteSchema returns valid WebSite JSON-LD', () => {
    const site = buildWebSiteSchema()
    assert.equal(site['@context'], 'https://schema.org')
    assert.equal(site['@type'], 'WebSite')
    assert.equal(site.name, 'SoapyFans Hub')
  })

  it('buildMovieSchema returns valid Movie JSON-LD with actor and details', () => {
    const movie = buildMovieSchema({
      tmdbId: 1087388,
      title: 'Heretic',
      overview: 'Two missionaries...',
      releaseDate: '2024-11-08',
      posterUrl: 'https://image.tmdb.org/t/p/w500/heretic.jpg',
      genres: [{ name: 'Horror' }, { name: 'Thriller' }],
      runtime: 110,
      reviews: [],
    })

    assert.equal(movie['@context'], 'https://schema.org')
    assert.equal(movie['@type'], 'Movie')
    assert.equal(movie.name, 'Heretic')
    assert.equal(movie.datePublished, '2024-11-08')
    assert.equal(movie.duration, 'PT110M')
    assert.deepEqual(movie.genre, ['Horror', 'Thriller'])
  })

  it('buildTvSeriesSchema returns valid TVSeries JSON-LD', () => {
    const tv = buildTvSeriesSchema({
      tmdbId: 111110,
      title: 'Yellowjackets',
      overview: 'Survivors...',
      firstAirDate: '2021-11-14',
      lastAirDate: '2025-01-01',
      posterUrl: 'https://image.tmdb.org/t/p/w500/yj.jpg',
      genres: [{ name: 'Drama' }, { name: 'Mystery' }],
      numberOfSeasons: 3,
      numberOfEpisodes: 29,
    })

    assert.equal(tv['@context'], 'https://schema.org')
    assert.equal(tv['@type'], 'TVSeries')
    assert.equal(tv.name, 'Yellowjackets')
    assert.equal(tv.numberOfSeasons, 3)
    assert.equal(tv.numberOfEpisodes, 29)
  })

  it('buildMusicReleaseSchema returns valid MusicAlbum JSON-LD with tracks', () => {
    const release = buildMusicReleaseSchema({
      title: 'Pivot & Scrape',
      release_type: 'ep',
      release_date: '2024-10-11',
      cover_art_url: 'https://example.com/cover.jpg',
      description: 'Debut EP by Sophie Thatcher.',
      tracks: [
        {
          title: 'Pivot & Scrape',
          track_number: 1,
          duration_ms: 210000,
        },
      ],
      reviews: [],
    })

    assert.equal(release['@context'], 'https://schema.org')
    assert.equal(release['@type'], 'MusicAlbum')
    assert.equal(release.name, 'Pivot & Scrape')
    assert.equal(release.albumReleaseType, 'EPRelease')
    assert.equal(release.numTracks, 1)
    const tracks = release.track as Array<{ duration?: string }> | undefined
    assert.equal(tracks?.[0]?.duration, 'PT3M30S')
  })
})
