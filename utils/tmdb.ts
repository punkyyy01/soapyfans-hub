import { unstable_cache } from 'next/cache'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const SOPHIE_THATCHER_ID = 1981044
const TMDB_TIMEOUT_MS = 8000
const TMDB_REVALIDATE_SECONDS = 86400

function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error(
      'TMDB_API_KEY is missing. Add it to your environment (e.g. .env.local) and restart the dev server.'
    )
  }
  const url = new URL(`${TMDB_BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TMDB_TIMEOUT_MS)

  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: TMDB_REVALIDATE_SECONDS },
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        const hint = res.status === 401 ? ' (check TMDB_API_KEY value)' : ''
        throw new Error(`TMDB error: ${res.status} ${res.statusText}${hint}`)
      }
      return res.json() as Promise<T>
    })
    .catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('TMDB request timed out')
      }
      throw error
    })
    .finally(() => clearTimeout(timeout))
}

export interface TmdbMovieCredit {
  id: number
  media_type: 'movie'
  title: string
  original_title?: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  character?: string
  job?: string
}

export interface TmdbTvCredit {
  id: number
  media_type: 'tv'
  name: string
  original_name?: string
  first_air_date: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  character?: string
  job?: string
  episode_count?: number
}

export type TmdbCredit = TmdbMovieCredit | TmdbTvCredit

export interface TmdbCombinedCredits {
  id: number
  cast: TmdbCredit[]
  crew: TmdbCredit[]
}

export interface TmdbMovieDetails {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  genres: { id: number; name: string }[]
  runtime: number | null
  tagline: string
  status: string
}

export interface TmdbTvDetails {
  id: number
  name: string
  first_air_date: string
  last_air_date: string | null
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  genres: { id: number; name: string }[]
  episode_run_time: number[]
  number_of_seasons: number
  number_of_episodes: number
  tagline: string
  status: string
  in_production: boolean
  networks: { id: number; name: string; logo_path: string | null }[]
  created_by: { id: number; name: string }[]
}

export interface NormalizedCredit {
  id: number
  mediaType: 'movie' | 'tv'
  title: string
  date: string
  year: string | null
  posterPath: string | null
  backdropPath: string | null
  overview: string
  voteAverage: number
  character?: string
  episodeCount?: number
}

export function normalizeCredit(c: TmdbCredit): NormalizedCredit {
  if (c.media_type === 'movie') {
    return {
      id: c.id,
      mediaType: 'movie',
      title: c.title,
      date: c.release_date ?? '',
      year: c.release_date ? c.release_date.slice(0, 4) : null,
      posterPath: c.poster_path,
      backdropPath: c.backdrop_path,
      overview: c.overview,
      voteAverage: c.vote_average,
      character: c.character,
    }
  }
  return {
    id: c.id,
    mediaType: 'tv',
    title: c.name,
    date: c.first_air_date ?? '',
    year: c.first_air_date ? c.first_air_date.slice(0, 4) : null,
    posterPath: c.poster_path,
    backdropPath: c.backdrop_path,
    overview: c.overview,
    voteAverage: c.vote_average,
    character: c.character,
    episodeCount: c.episode_count,
  }
}

export function getPersonCombinedCredits(
  personId = SOPHIE_THATCHER_ID
): Promise<TmdbCombinedCredits> {
  return unstable_cache(
    () =>
      tmdbFetch<TmdbCombinedCredits>(
        `/person/${personId}/combined_credits`,
        { language: 'en-US' }
      ),
    ['tmdb', 'person', `${personId}`, 'combined-credits'],
    { revalidate: TMDB_REVALIDATE_SECONDS }
  )()
}

export interface TmdbPersonImage {
  aspect_ratio: number
  file_path: string
  height: number
  width: number
  iso_639_1: string | null
  vote_average: number
  vote_count: number
}

export interface TmdbPersonImages {
  id: number
  profiles: TmdbPersonImage[]
}

export function getPersonImages(
  personId = SOPHIE_THATCHER_ID
): Promise<TmdbPersonImages> {
  return unstable_cache(
    () => tmdbFetch<TmdbPersonImages>(`/person/${personId}/images`),
    ['tmdb', 'person', `${personId}`, 'images'],
    { revalidate: TMDB_REVALIDATE_SECONDS }
  )()
}

export function sortByDateDesc(a: NormalizedCredit, b: NormalizedCredit) {
  const ta = a.date ? new Date(a.date).getTime() : 0
  const tb = b.date ? new Date(b.date).getTime() : 0
  return tb - ta
}

export function getPortraitUrls(
  profiles: TmdbPersonImage[],
  limit = 8,
  size: 'w500' | 'w780' | 'w1280' = 'w780'
): string[] {
  return profiles
    .filter((p) => p.aspect_ratio <= 0.74)
    .sort((a, b) => {
      const ratioDiff = a.aspect_ratio - b.aspect_ratio
      if (Math.abs(ratioDiff) > 0.05) return ratioDiff
      return b.vote_average - a.vote_average
    })
    .slice(0, limit)
    .map((p) => getTmdbImageUrl(p.file_path, size))
    .filter((u): u is string => u !== null)
}

export function getMovieDetails(movieId: number): Promise<TmdbMovieDetails> {
  return unstable_cache(
    () => tmdbFetch<TmdbMovieDetails>(`/movie/${movieId}`, { language: 'en-US' }),
    ['tmdb', 'movie', `${movieId}`],
    { revalidate: TMDB_REVALIDATE_SECONDS }
  )()
}

export function getTvDetails(tvId: number): Promise<TmdbTvDetails> {
  return unstable_cache(
    () => tmdbFetch<TmdbTvDetails>(`/tv/${tvId}`, { language: 'en-US' }),
    ['tmdb', 'tv', `${tvId}`],
    { revalidate: TMDB_REVALIDATE_SECONDS }
  )()
}

export function getTmdbImageUrl(
  path: string | null,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w342'
): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}
