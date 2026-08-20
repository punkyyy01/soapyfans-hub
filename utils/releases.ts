import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import { assignReleaseSlugs } from '@/utils/music'

export type TrackRow = {
  id: string
  title: string
  duration_ms: number | null
  track_number: number | null
  youtube_video_id: string | null
}

export type ReleaseRow = {
  id: string
  title: string
  release_type: string
  release_date: string | null
  cover_art_url: string | null
  spotify_url: string | null
  bandcamp_url: string | null
  twitter_url: string | null
  description: string | null
  updated_at: string
  tracks: TrackRow[]
}

export type ReleaseWithSlug = ReleaseRow & { slug: string }

/**
 * Server-only: pulls in createPublicClient (Supabase) and next/cache, so
 * this must never be imported from a 'use client' component -- pure
 * release helpers (slugify, formatDuration, ...) live in utils/music.ts
 * instead, which components/media/TrackList.tsx already imports client-side.
 */
export const getReleasesWithTracks = unstable_cache(
  async (): Promise<ReleaseRow[]> => {
    const result = await createPublicClient()
      .from('releases')
      .select(
        'id, title, release_type, release_date, cover_art_url, spotify_url, bandcamp_url, twitter_url, description, updated_at, tracks(id, title, duration_ms, track_number, youtube_video_id)',
      )
      .order('release_date', { ascending: false })

    return (result.data ?? []).map((r) => ({
      ...r,
      tracks: ((r.tracks ?? []) as TrackRow[]).sort(
        (a, b) => (a.track_number ?? 999) - (b.track_number ?? 999),
      ),
    }))
  },
  ['releases', 'with-tracks'],
  { revalidate: 300 },
)

export async function getReleasesWithSlugs(): Promise<ReleaseWithSlug[]> {
  const releases = await getReleasesWithTracks()
  return assignReleaseSlugs(releases)
}
