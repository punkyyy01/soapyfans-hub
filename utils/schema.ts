import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from './site'

export function serializeJsonLd(schema: unknown): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

const FAN_PUBLISHER_ID = absoluteUrl('/#organization')

// The one stable Sophie Thatcher Person entity for the whole site. Every
// Movie/TVSeries/MusicAlbum schema references this @id instead of embedding
// its own inline Person stub, so there is exactly one Sophie identity in
// the site's structured-data graph. Anchored at /about, where the full
// Person schema (name/url/sameAs) actually renders.
export const SOPHIE_PERSON_ID = absoluteUrl('/about#sophie-thatcher')

const FAN_PUBLISHER = {
  '@type': 'Organization',
  '@id': FAN_PUBLISHER_ID,
  name: SITE_NAME,
  url: absoluteUrl('/'),
  description:
    'SoapyFans Hub — Unofficial fan archive dedicated to Sophie Thatcher, featuring her filmography, music, and community fan reviews.',
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    ...FAN_PUBLISHER,
  }
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': FAN_PUBLISHER_ID },
  }
}

export function buildWebPageSchema({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  const url = absoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    name,
    description,
    url,
    inLanguage: 'en',
    isPartOf: { '@id': absoluteUrl('/#website') },
    publisher: { '@id': FAN_PUBLISHER_ID },
  }
}

export function buildCollectionPageSchema({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  const url = absoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name,
    description,
    url,
    inLanguage: 'en',
    isPartOf: { '@id': absoluteUrl('/#website') },
    publisher: { '@id': FAN_PUBLISHER_ID },
  }
}

export function buildSophieThatcherPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': SOPHIE_PERSON_ID,
    name: 'Sophie Thatcher',
    url: absoluteUrl('/about'),
    jobTitle: ['Actor', 'Musician'],
    description:
      'American actor and musician, known for Yellowjackets, Heretic, and Companion, and for her debut EP Pivot & Scrape.',
    sameAs: [
      'https://www.themoviedb.org/person/1981044',
      'https://instagram.com/soapy.t',
      'https://youtube.com/@SophieThatcher',
    ],
  }
}

export interface BreadcrumbEntry {
  name: string
  path: string
}

export function buildBreadcrumbSchema(items: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function buildProfilePageSchema({
  displayName,
  username,
  path,
}: {
  displayName: string
  username: string | null
  path: string
}) {
  const url = absoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profilepage`,
    url,
    name: `${displayName} · Profile`,
    isPartOf: { '@id': absoluteUrl('/#website') },
    mainEntity: {
      '@type': 'Person',
      name: displayName,
      ...(username ? { identifier: username } : {}),
    },
  }
}

export function buildMovieSchema({
  tmdbId,
  title,
  overview,
  releaseDate,
  posterUrl,
  genres,
  runtime,
  reviews,
}: {
  tmdbId: number
  title: string
  overview: string | null
  releaseDate: string | null
  posterUrl: string | null
  genres: Array<{ name: string }>
  runtime: number | null
  reviews: Array<{
    rating: number
    content: string | null
    created_at: string
    profiles: { username: string | null; display_name: string | null } | null
  }>
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    '@id': absoluteUrl(`/films/${tmdbId}#movie`),
    name: title,
    url: absoluteUrl(`/films/${tmdbId}`),
    actor: { '@id': SOPHIE_PERSON_ID },
    inLanguage: 'en',
    publisher: { '@id': FAN_PUBLISHER_ID },
  }

  if (overview) schema.description = overview
  if (releaseDate) schema.datePublished = releaseDate
  if (posterUrl) schema.image = posterUrl
  if (genres.length > 0) schema.genre = genres.map((g) => g.name)
  if (runtime) schema.duration = `PT${runtime}M`

  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(2)),
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviews.length,
    }
    schema.review = reviews.map((r) => {
      const rev: Record<string, unknown> = {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        datePublished: r.created_at.slice(0, 10),
      }
      if (r.content) rev.reviewBody = r.content
      return rev
    })
  }

  return schema
}

function msToDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  return `PT${Math.floor(totalSec / 60)}M${totalSec % 60}S`
}

const RELEASE_TYPE_MAP: Record<string, { albumReleaseType?: string; albumProductionType?: string }> = {
  ep: { albumReleaseType: 'EPRelease' },
  single: { albumReleaseType: 'SingleRelease' },
  album: { albumReleaseType: 'AlbumRelease', albumProductionType: 'StudioAlbum' },
  soundtrack: { albumReleaseType: 'AlbumRelease', albumProductionType: 'SoundtrackAlbum' },
}

export function buildMusicReleaseSchema({
  title,
  release_type,
  release_date,
  cover_art_url,
  description,
  tracks,
  reviews,
  path,
}: {
  title: string
  release_type: string
  release_date: string | null
  cover_art_url: string | null
  description: string | null
  tracks: Array<{ title: string; track_number: number | null; duration_ms: number | null }>
  reviews: Array<{
    rating: number
    content: string | null
    created_at: string
    profiles: { username: string | null; display_name: string | null } | null
  }>
  /** The release's own canonical page, e.g. `/music/pivot-scrape`. */
  path: string
}) {
  const url = absoluteUrl(path)
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    '@id': `${url}#release`,
    url,
    name: title,
    byArtist: { '@id': SOPHIE_PERSON_ID },
    inLanguage: 'en',
    publisher: { '@id': FAN_PUBLISHER_ID },
  }

  const typeAttrs = RELEASE_TYPE_MAP[release_type]
  if (typeAttrs?.albumReleaseType) schema.albumReleaseType = typeAttrs.albumReleaseType
  if (typeAttrs?.albumProductionType) schema.albumProductionType = typeAttrs.albumProductionType

  if (release_date) schema.datePublished = release_date
  if (cover_art_url) schema.image = cover_art_url
  if (description) schema.description = description

  if (tracks.length > 0) {
    schema.numTracks = tracks.length
    schema.track = tracks.map((t) => {
      const rec: Record<string, unknown> = { '@type': 'MusicRecording', name: t.title }
      if (t.track_number != null) rec.position = t.track_number
      if (t.duration_ms != null) rec.duration = msToDuration(t.duration_ms)
      return rec
    })
  }

  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(2)),
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviews.length,
    }
    schema.review = reviews.map((r) => {
      const rev: Record<string, unknown> = {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.profiles?.display_name ?? r.profiles?.username ?? 'Anonymous',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        datePublished: r.created_at.slice(0, 10),
      }
      if (r.content) rev.reviewBody = r.content
      return rev
    })
  }

  return schema
}

export function buildTvSeriesSchema({
  tmdbId,
  title,
  overview,
  firstAirDate,
  lastAirDate,
  posterUrl,
  genres,
  numberOfSeasons,
  numberOfEpisodes,
}: {
  tmdbId: number
  title: string
  overview: string | null
  firstAirDate: string | null
  lastAirDate: string | null
  posterUrl: string | null
  genres: Array<{ name: string }>
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    '@id': absoluteUrl(`/tv/${tmdbId}#series`),
    name: title,
    url: absoluteUrl(`/tv/${tmdbId}`),
    actor: { '@id': SOPHIE_PERSON_ID },
    inLanguage: 'en',
    publisher: { '@id': FAN_PUBLISHER_ID },
  }

  if (overview) schema.description = overview
  if (firstAirDate) schema.datePublished = firstAirDate
  if (lastAirDate) schema.endDate = lastAirDate
  if (posterUrl) schema.image = posterUrl
  if (genres.length > 0) schema.genre = genres.map((g) => g.name)
  if (numberOfSeasons != null) schema.numberOfSeasons = numberOfSeasons
  if (numberOfEpisodes != null) schema.numberOfEpisodes = numberOfEpisodes

  return schema
}
