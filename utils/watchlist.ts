export type WatchlistMediaType = 'movie' | 'tv'

export function isWatchlistMediaType(value: string | null | undefined): value is WatchlistMediaType {
  return value === 'movie' || value === 'tv'
}

export function watchlistTargetPath(mediaType: WatchlistMediaType, tmdbId: number): string {
  return mediaType === 'movie' ? `/films/${tmdbId}` : `/tv/${tmdbId}`
}
