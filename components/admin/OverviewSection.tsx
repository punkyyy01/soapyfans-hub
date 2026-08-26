import { createAdminClient } from '@/utils/supabase/admin'
import { StatCard } from './dashboardUI'

export default async function OverviewSection() {
  const admin = createAdminClient()

  const [
    usersRes, filmActiveRes, filmDeletedRes,
    musicActiveRes, musicDeletedRes, bannedRes,
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('reviews').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('reviews').select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null),
    admin.from('music_reviews').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('music_reviews').select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null),
    admin.from('banned_users').select('id', { count: 'exact', head: true }),
  ])

  const totalUsers = usersRes.count ?? 0
  const activeFilmReviews = filmActiveRes.count ?? 0
  const deletedFilmReviews = filmDeletedRes.count ?? 0
  const activeMusicReviews = musicActiveRes.count ?? 0
  const deletedMusicReviews = musicDeletedRes.count ?? 0
  const bannedCount = bannedRes.count ?? 0

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard
          label="Film Reviews"
          value={activeFilmReviews}
          sub={`${deletedFilmReviews} deleted`}
        />
        <StatCard
          label="Music Reviews"
          value={activeMusicReviews}
          sub={`${deletedMusicReviews} deleted`}
        />
        <StatCard label="Banned Users" value={bannedCount} />
      </div>
    </section>
  )
}
