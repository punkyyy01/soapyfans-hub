import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStaticRoutes,
  buildFilmTvRoutes,
  buildProfileSitemapEntries,
  buildReleaseRoutes,
  type ProfileSitemapCandidate,
} from '../app/sitemap'
import { STATIC_CONTENT_LAST_MODIFIED } from '../utils/site'
import type { NormalizedCredit } from '../utils/tmdb'
import type { ReleaseWithSlug } from '../utils/releases'

const SITE_URL = 'https://soapyhub.fans'

function credit(overrides: Partial<NormalizedCredit>): NormalizedCredit {
  return {
    id: 1,
    mediaType: 'movie',
    title: 'X',
    date: '',
    year: null,
    posterPath: null,
    backdropPath: null,
    overview: '',
    voteAverage: 0,
    ...overrides,
  }
}

describe('buildStaticRoutes', () => {
  it('uses the truthful static lastModified constant, never "now"', () => {
    const routes = buildStaticRoutes(SITE_URL)
    for (const route of routes) {
      assert.equal(route.lastModified, STATIC_CONTENT_LAST_MODIFIED)
    }
  })

  it('includes the known static pages', () => {
    const routes = buildStaticRoutes(SITE_URL)
    const urls = routes.map((r) => r.url)
    for (const path of ['/', '/films', '/music', '/about', '/contact', '/privacy', '/terms']) {
      assert.ok(urls.includes(`${SITE_URL}${path}`), `missing ${path}`)
    }
  })
})

describe('buildFilmTvRoutes', () => {
  it('splits movie and tv credits into their own routes with real dates', () => {
    const credits = [
      credit({ id: 1, mediaType: 'movie', date: '2024-11-08' }),
      credit({ id: 2, mediaType: 'tv', date: '2021-11-14' }),
    ]
    const routes = buildFilmTvRoutes(credits, SITE_URL)
    assert.deepEqual(routes.map((r) => r.url).sort(), [`${SITE_URL}/films/1`, `${SITE_URL}/tv/2`].sort())
    const film = routes.find((r) => r.url.includes('/films/'))!
    assert.equal((film.lastModified as Date).toISOString().slice(0, 10), '2024-11-08')
  })

  it('falls back to the static constant when a credit has no date', () => {
    const routes = buildFilmTvRoutes([credit({ id: 3, mediaType: 'movie', date: '' })], SITE_URL)
    assert.equal(routes[0].lastModified, STATIC_CONTENT_LAST_MODIFIED)
  })
})

describe('buildReleaseRoutes', () => {
  function release(overrides: Partial<ReleaseWithSlug>): ReleaseWithSlug {
    return {
      id: 'release-1',
      title: 'Pivot & Scrape',
      slug: 'pivot-scrape',
      release_type: 'ep',
      release_date: '2024-10-11',
      cover_art_url: null,
      spotify_url: null,
      bandcamp_url: null,
      twitter_url: null,
      description: null,
      updated_at: '2026-01-01T00:00:00Z',
      tracks: [],
      ...overrides,
    }
  }

  it('builds a URL from the slug for every release', () => {
    const routes = buildReleaseRoutes([release({})], SITE_URL)
    assert.equal(routes[0].url, `${SITE_URL}/music/pivot-scrape`)
  })

  it('uses the release row updated_at as lastModified, never "now"', () => {
    const routes = buildReleaseRoutes([release({ updated_at: '2025-06-01T00:00:00Z' })], SITE_URL)
    assert.equal((routes[0].lastModified as Date).toISOString(), '2025-06-01T00:00:00.000Z')
    assert.notEqual((routes[0].lastModified as Date).getTime(), Date.now())
  })

  it('includes every release passed in', () => {
    const routes = buildReleaseRoutes(
      [release({ id: 'a', slug: 'a' }), release({ id: 'b', slug: 'b' })],
      SITE_URL,
    )
    assert.deepEqual(routes.map((r) => r.url).sort(), [`${SITE_URL}/music/a`, `${SITE_URL}/music/b`])
  })

  it('returns nothing for an empty release list', () => {
    assert.deepEqual(buildReleaseRoutes([], SITE_URL), [])
  })
})

describe('buildProfileSitemapEntries', () => {
  const strongCandidate: ProfileSitemapCandidate = {
    id: 'user-1',
    username: 'strongfan',
    bio: null,
    about_me: 'a'.repeat(100),
    updated_at: '2026-01-01T00:00:00Z',
    favoritesCount: 0,
    latestFavoriteAt: null,
    reviewContents: [],
  }

  const thinCandidate: ProfileSitemapCandidate = {
    id: 'user-2',
    username: 'thinfan',
    bio: null,
    about_me: null,
    updated_at: '2026-01-01T00:00:00Z',
    favoritesCount: 1,
    latestFavoriteAt: null,
    reviewContents: [],
  }

  it('includes only indexable profiles', () => {
    const entries = buildProfileSitemapEntries([strongCandidate, thinCandidate], new Set(), SITE_URL)
    assert.deepEqual(entries.map((e) => e.url), [`${SITE_URL}/profile/strongfan`])
  })

  it('excludes banned profiles even if their content would otherwise qualify', () => {
    const entries = buildProfileSitemapEntries([strongCandidate], new Set(['user-1']), SITE_URL)
    assert.deepEqual(entries, [])
  })

  it('excludes profiles without a stored username', () => {
    const noUsername = { ...strongCandidate, id: 'user-3', username: null }
    const entries = buildProfileSitemapEntries([noUsername], new Set(), SITE_URL)
    assert.deepEqual(entries, [])
  })

  it('builds the URL from the stored username only, never the profile id (no alias/UUID URLs)', () => {
    const entries = buildProfileSitemapEntries([strongCandidate], new Set(), SITE_URL)
    assert.equal(entries[0].url, `${SITE_URL}/profile/strongfan`)
    assert.ok(!entries[0].url.includes('user-1'))
  })

  it('uses profiles.updated_at as lastModified when no favorite is newer', () => {
    const entries = buildProfileSitemapEntries([strongCandidate], new Set(), SITE_URL)
    assert.equal((entries[0].lastModified as Date).toISOString(), '2026-01-01T00:00:00.000Z')
  })

  it('uses the latest favorite timestamp when newer than updated_at (favorites bypass updated_at)', () => {
    const candidate: ProfileSitemapCandidate = {
      ...strongCandidate,
      updated_at: '2026-01-01T00:00:00Z',
      latestFavoriteAt: '2026-02-01T00:00:00Z',
    }
    const entries = buildProfileSitemapEntries([candidate], new Set(), SITE_URL)
    assert.equal((entries[0].lastModified as Date).toISOString(), '2026-02-01T00:00:00.000Z')
  })

  it('never fabricates lastModified with the current time', () => {
    const entries = buildProfileSitemapEntries([strongCandidate], new Set(), SITE_URL)
    assert.notEqual((entries[0].lastModified as Date).getTime(), Date.now())
  })
})
