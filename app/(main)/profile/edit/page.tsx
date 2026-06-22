import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/utils/supabase/server'
import { getMovieDetails, getTvDetails } from '@/utils/tmdb'
import ProfileEditForm from '@/components/profile/ProfileEditForm'

export const metadata: Metadata = {
  title: 'Edit Profile',
  robots: { index: false, follow: false },
}

type FavoriteRow = {
  id: string
  tmdb_id: number
  media_type: string
  position: number
}

export type EnrichedFavorite = FavoriteRow & {
  title: string | null
  posterPath: string | null
}

export default async function ProfileEditPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, username, display_name, avatar_url, bio, created_at,
      banner_url, accent_color, profile_css, pronouns, location_text, website_url, show_activity,
      profile_favorites(id, tmdb_id, media_type, position)
    `)
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const rawFavs = ((profile.profile_favorites ?? []) as FavoriteRow[])
    .slice()
    .sort((a, b) => a.position - b.position)

  const favorites: EnrichedFavorite[] = await Promise.all(
    rawFavs.map(async (fav): Promise<EnrichedFavorite> => {
      try {
        if (fav.media_type === 'movie') {
          const d = await getMovieDetails(fav.tmdb_id)
          return { ...fav, title: d.title, posterPath: d.poster_path }
        }
        const d = await getTvDetails(fav.tmdb_id)
        return { ...fav, title: d.name, posterPath: d.poster_path }
      } catch {
        return { ...fav, title: null, posterPath: null }
      }
    }),
  )

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <ProfileEditForm profile={profile} initialFavorites={favorites} />
    </main>
  )
}
