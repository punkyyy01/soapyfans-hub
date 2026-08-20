import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  serializeJsonLd,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildMovieSchema,
  buildTvSeriesSchema,
  buildMusicReleaseSchema,
  buildSophieThatcherPersonSchema,
  buildBreadcrumbSchema,
  buildProfilePageSchema,
  SOPHIE_PERSON_ID,
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

  it('buildMovieSchema omits review and aggregateRating when there are no eligible reviews', () => {
    const movie = buildMovieSchema({
      tmdbId: 1087388,
      title: 'Heretic',
      overview: null,
      releaseDate: null,
      posterUrl: null,
      genres: [],
      runtime: null,
      reviews: [],
    })

    assert.equal('review' in movie, false)
    assert.equal('aggregateRating' in movie, false)
  })

  it('buildMovieSchema includes review + aggregateRating that match the visible review list', () => {
    const movie = buildMovieSchema({
      tmdbId: 1087388,
      title: 'Heretic',
      overview: null,
      releaseDate: null,
      posterUrl: null,
      genres: [],
      runtime: null,
      reviews: [
        {
          rating: 5,
          content: 'A genuinely unsettling watch.',
          created_at: '2024-11-10T12:00:00Z',
          profiles: { username: 'filmfan', display_name: 'Film Fan' },
        },
        {
          rating: 3,
          content: null,
          created_at: '2024-11-12T12:00:00Z',
          profiles: { username: null, display_name: null },
        },
      ],
    })

    assert.ok(movie.aggregateRating)
    const aggregateRating = movie.aggregateRating as {
      ratingValue: number
      ratingCount: number
      bestRating: number
      worstRating: number
    }
    assert.equal(aggregateRating.ratingCount, 2)
    assert.equal(aggregateRating.ratingValue, 4)
    assert.equal(aggregateRating.bestRating, 5)
    assert.equal(aggregateRating.worstRating, 1)

    const reviews = movie.review as Array<{
      author: { name: string }
      reviewRating: { ratingValue: number }
      datePublished: string
      reviewBody?: string
    }>
    assert.equal(reviews.length, 2)
    assert.equal(reviews[0].author.name, 'Film Fan')
    assert.equal(reviews[0].reviewRating.ratingValue, 5)
    assert.equal(reviews[0].datePublished, '2024-11-10')
    assert.equal(reviews[0].reviewBody, 'A genuinely unsettling watch.')
    // Rating-only review (no content): still a real visible review, but must
    // not fabricate a reviewBody key.
    assert.equal(reviews[1].author.name, 'Anonymous')
    assert.equal('reviewBody' in reviews[1], false)
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

  it('buildMusicReleaseSchema returns valid MusicAlbum JSON-LD with tracks, anchored at the real release URL', () => {
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
      path: '/music/pivot-scrape',
    })

    assert.equal(release['@context'], 'https://schema.org')
    assert.equal(release['@type'], 'MusicAlbum')
    assert.equal(release.name, 'Pivot & Scrape')
    assert.equal(release.albumReleaseType, 'EPRelease')
    assert.equal(release.numTracks, 1)
    assert.ok((release.url as string).endsWith('/music/pivot-scrape'))
    assert.ok((release['@id'] as string).startsWith(release.url as string))
    const tracks = release.track as Array<{ duration?: string }> | undefined
    assert.equal(tracks?.[0]?.duration, 'PT3M30S')
  })

  it('buildMusicReleaseSchema includes aggregateRating derived from the passed-in reviews only', () => {
    const release = buildMusicReleaseSchema({
      title: 'Pivot & Scrape',
      release_type: 'ep',
      release_date: '2024-10-11',
      cover_art_url: null,
      description: null,
      tracks: [],
      reviews: [
        {
          rating: 4,
          content: 'Textured and quiet.',
          created_at: '2024-10-12T00:00:00Z',
          profiles: { username: 'musicfan', display_name: null },
        },
      ],
      path: '/music/pivot-scrape',
    })

    const aggregateRating = release.aggregateRating as { ratingValue: number; ratingCount: number }
    assert.equal(aggregateRating.ratingCount, 1)
    assert.equal(aggregateRating.ratingValue, 4)
  })
})

describe('Sophie Thatcher stable Person entity', () => {
  it('has a stable @id anchored at /about, name, and url', () => {
    const person = buildSophieThatcherPersonSchema()
    assert.equal(person['@context'], 'https://schema.org')
    assert.equal(person['@type'], 'Person')
    assert.equal(person['@id'], SOPHIE_PERSON_ID)
    assert.ok((person['@id'] as string).includes('/about#sophie-thatcher'))
    assert.equal(person.name, 'Sophie Thatcher')
    assert.ok((person.url as string).endsWith('/about'))
  })

  it('produces the exact same @id on every call (single stable identity)', () => {
    const a = buildSophieThatcherPersonSchema()
    const b = buildSophieThatcherPersonSchema()
    assert.equal(a['@id'], b['@id'])
  })

  it('Movie, TVSeries, and MusicAlbum schemas all reference the same Person @id, not an inline stub', () => {
    const movie = buildMovieSchema({
      tmdbId: 1,
      title: 'X',
      overview: null,
      releaseDate: null,
      posterUrl: null,
      genres: [],
      runtime: null,
      reviews: [],
    })
    const tv = buildTvSeriesSchema({
      tmdbId: 2,
      title: 'Y',
      overview: null,
      firstAirDate: null,
      lastAirDate: null,
      posterUrl: null,
      genres: [],
      numberOfSeasons: null,
      numberOfEpisodes: null,
    })
    const music = buildMusicReleaseSchema({
      title: 'Z',
      release_type: 'single',
      release_date: null,
      cover_art_url: null,
      description: null,
      tracks: [],
      reviews: [],
      path: '/music/z',
    })

    assert.deepEqual(movie.actor, { '@id': SOPHIE_PERSON_ID })
    assert.deepEqual(tv.actor, { '@id': SOPHIE_PERSON_ID })
    assert.deepEqual(music.byArtist, { '@id': SOPHIE_PERSON_ID })
  })
})

describe('buildBreadcrumbSchema', () => {
  it('emits positions starting at 1 with absolute canonical URLs', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Filmography', path: '/films' },
      { name: 'Heretic', path: '/films/1087388' },
    ])
    assert.equal(schema['@type'], 'BreadcrumbList')
    const items = schema.itemListElement as Array<{ position: number; name: string; item: string }>
    assert.equal(items.length, 3)
    assert.deepEqual(items.map((i) => i.position), [1, 2, 3])
    assert.deepEqual(items.map((i) => i.name), ['Home', 'Filmography', 'Heretic'])
    assert.ok(items[2].item.endsWith('/films/1087388'))
    assert.ok(items.every((i) => i.item.startsWith('http')))
  })
})

describe('buildProfilePageSchema', () => {
  it('includes name, url, and a Person mainEntity with the identifier when username exists', () => {
    const schema = buildProfilePageSchema({
      displayName: 'Jamie Fan',
      username: 'jamiefan',
      path: '/profile/jamiefan',
    })
    assert.equal(schema['@type'], 'ProfilePage')
    assert.ok((schema.url as string).endsWith('/profile/jamiefan'))
    const mainEntity = schema.mainEntity as { name: string; identifier?: string }
    assert.equal(mainEntity.name, 'Jamie Fan')
    assert.equal(mainEntity.identifier, 'jamiefan')
  })

  it('omits identifier when there is no username', () => {
    const schema = buildProfilePageSchema({
      displayName: 'Anonymous',
      username: null,
      path: '/profile/some-uuid',
    })
    const mainEntity = schema.mainEntity as { identifier?: string }
    assert.equal('identifier' in mainEntity, false)
  })
})
