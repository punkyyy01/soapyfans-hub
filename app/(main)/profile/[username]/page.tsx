import type { Metadata } from 'next'
import { createClient, getUser } from '@/utils/supabase/server'
import EditProfileForm from '@/app/components/EditProfileForm'
import ProfileReviewList from '@/app/components/ProfileReviewList'
import type { ReviewItem } from '@/app/components/ProfileReviewList'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ username: string }>
  searchParams?: Promise<{ error?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} · Profile`,
    description: `Fan profile and reviews on SoapyFans Hub.`,
    robots: { index: false, follow: false },
  }
}

type RawReview = {
  id: string
  rating: number
  content: string | null
  created_at: string
  films: { title: string; poster_path: string | null; tmdb_id: number } | null
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const { error } = (await searchParams) ?? {}
  const supabase = await createClient()

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isUuid = UUID_RE.test(username)

  const profileQuery = supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at, reviews(id, rating, content, created_at, films(title, poster_path, tmdb_id))')

  const [{ data: profile }, user] = await Promise.all([
    (isUuid
      ? profileQuery.eq('id', username)
      : profileQuery.ilike('username', username)
    ).maybeSingle(),
    getUser(),
  ])

  if (!profile) notFound()

  const reviews: ReviewItem[] = ((profile.reviews ?? []) as RawReview[])
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      film: r.films ?? null,
    }))
  const isOwner = user?.id === profile.id
  const profileSlug = profile.username ?? profile.id
  const displayName = profile.display_name ?? profile.username ?? 'Anonymous'
  const avatarInitial = displayName[0]?.toUpperCase() ?? '?'
  const joinedDate = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  })

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-24 sm:px-10 sm:pb-32 sm:pt-28">
      <section className="mb-14 space-y-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={80}
                height={80}
                className="rounded-full ring-2 ring-[var(--accent-amber)]/30 shadow-[0_0_24px_rgba(232,137,12,0.15)]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--accent-amber)]/40 bg-gradient-to-br from-[var(--accent-amber)] to-[#7a4108] text-2xl font-semibold text-[var(--bg-base)] shadow-[0_0_24px_rgba(232,137,12,0.2)]">
                {avatarInitial}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                {displayName}
              </h1>
              {profile.username && (
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">@{profile.username}</p>
              )}
            </div>
            {profile.bio && (
              <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                {profile.bio}
              </p>
            )}
            <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Member since {joinedDate}
            </p>
          </div>

          {isOwner && <EditProfileForm profile={profile} />}
        </div>

        <div className="border-b border-[var(--border-subtle)]" />
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
              Archive
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Reviews
            </h2>
          </div>
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
            {reviews.length.toString().padStart(2, '0')}{' '}
            {reviews.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {error && (
          <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <ProfileReviewList
          reviews={reviews}
          isOwner={isOwner}
          profileSlug={profileSlug}
        />
      </section>
    </main>
  )
}
