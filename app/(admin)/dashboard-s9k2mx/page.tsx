import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  adminSoftDeleteReview,
  adminRestoreReview,
  adminSoftDeleteMusicReview,
  adminRestoreMusicReview,
  adminBanUser,
  adminUnbanUser,
} from './actions'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ section?: string }>
}

type Section = 'overview' | 'reviews' | 'users'

const VALID_SECTIONS: Section[] = ['overview', 'reviews', 'users']

function parseSection(raw?: string): Section {
  return VALID_SECTIONS.includes(raw as Section) ? (raw as Section) : 'overview'
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function stars(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

function truncate(s: string | null, len = 90) {
  if (!s) return <span className="text-[var(--text-muted)] italic">—</span>
  return s.length > len ? s.slice(0, len) + '…' : s
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <p className="text-[0.6rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  )
}

function TableShell({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-[var(--bg-card)]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[0.58rem] font-medium uppercase tracking-[0.3em] text-[var(--text-muted)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function ActionBtn({
  action,
  children,
  hidden,
  variant = 'default',
  extraInputs,
}: {
  action: (fd: FormData) => Promise<void>
  children: React.ReactNode
  hidden?: Record<string, string>
  variant?: 'danger' | 'success' | 'default'
  extraInputs?: React.ReactNode
}) {
  const color =
    variant === 'danger'
      ? 'text-red-400 hover:text-red-300'
      : variant === 'success'
        ? 'text-emerald-400 hover:text-emerald-300'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'

  return (
    <form action={action} className="inline-flex items-center gap-1">
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {extraInputs}
      <button
        type="submit"
        className={`text-xs font-medium transition-colors duration-100 ${color}`}
      >
        {children}
      </button>
    </form>
  )
}

export default async function DashboardPage({ searchParams }: Props) {
  const { section } = await searchParams
  const active = parseSection(section)
  const admin = createAdminClient()

  let totalUsers = 0
  let activeFilmReviews = 0
  let deletedFilmReviews = 0
  let activeMusicReviews = 0
  let deletedMusicReviews = 0
  let bannedCount = 0

  if (active === 'overview') {
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
    totalUsers = usersRes.count ?? 0
    activeFilmReviews = filmActiveRes.count ?? 0
    deletedFilmReviews = filmDeletedRes.count ?? 0
    activeMusicReviews = musicActiveRes.count ?? 0
    deletedMusicReviews = musicDeletedRes.count ?? 0
    bannedCount = bannedRes.count ?? 0
  }

  type FilmReview = {
    id: string
    rating: number
    content: string | null
    created_at: string
    deleted_at: string | null
    user_id: string
    profiles: { username: string | null } | null
    films: { title: string; release_year: number | null } | null
  }
  type MusicReview = {
    id: string
    rating: number
    content: string | null
    created_at: string
    deleted_at: string | null
    user_id: string
    profiles: { username: string | null } | null
    releases: { title: string; release_type: string } | null
  }

  let filmReviews: FilmReview[] = []
  let musicReviews: MusicReview[] = []

  if (active === 'reviews') {
    const [filmRes, musicRes] = await Promise.all([
      admin
        .from('reviews')
        .select('id, rating, content, created_at, deleted_at, user_id, profiles(username), films(title, release_year)')
        .order('created_at', { ascending: false }),
      admin
        .from('music_reviews')
        .select('id, rating, content, created_at, deleted_at, user_id, profiles(username), releases(title, release_type)')
        .order('created_at', { ascending: false }),
    ])
    filmReviews = (filmRes.data ?? []) as FilmReview[]
    musicReviews = (musicRes.data ?? []) as MusicReview[]
  }

  type UserRow = {
    id: string
    username: string | null
    display_name: string | null
    created_at: string
    email: string
    isBanned: boolean
    banReason: string | null
    reviewCount: number
  }

  let users: UserRow[] = []

  if (active === 'users') {
    const [profilesRes, authRes, bannedRes, filmCountRes, musicCountRes] = await Promise.all([
      admin.from('profiles').select('id, username, display_name, created_at').order('created_at', { ascending: false }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from('banned_users').select('user_id, reason'),
      admin.from('reviews').select('user_id').is('deleted_at', null),
      admin.from('music_reviews').select('user_id').is('deleted_at', null),
    ])

    const emailMap = new Map<string, string>(
      (authRes.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
    )
    const bannedMap = new Map<string, string | null>(
      (bannedRes.data ?? []).map((b) => [b.user_id, b.reason])
    )

    const reviewCountMap = new Map<string, number>()
    for (const r of filmCountRes.data ?? []) {
      reviewCountMap.set(r.user_id, (reviewCountMap.get(r.user_id) ?? 0) + 1)
    }
    for (const r of musicCountRes.data ?? []) {
      reviewCountMap.set(r.user_id, (reviewCountMap.get(r.user_id) ?? 0) + 1)
    }

    users = (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      created_at: p.created_at,
      email: emailMap.get(p.id) ?? '',
      isBanned: bannedMap.has(p.id),
      banReason: bannedMap.get(p.id) ?? null,
      reviewCount: reviewCountMap.get(p.id) ?? 0,
    }))
  }

  const tabs: { id: Section; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'users', label: 'Users' },
  ]

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-24 sm:px-10">
      <div className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <p className="text-[0.6rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard
        </h1>
      </div>

      <nav className="mb-8 flex gap-1 border-b border-[var(--border-subtle)]">
        {tabs.map(({ id, label }) => (
          <Link
            key={id}
            href={`?section=${id}`}
            className={`px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-100 ${
              active === id
                ? 'border-b-2 border-[var(--accent-amber)] text-[var(--accent-gold)]'
                : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {active === 'overview' && (
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
      )}

      {active === 'reviews' && (
        <section className="space-y-10">
          <div>
            <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">
              Film Reviews — {filmReviews.length}
            </h2>
            {filmReviews.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No film reviews yet.</p>
            ) : (
              <TableShell headers={['Author', 'Film', 'Rating', 'Content', 'Date', 'Status', 'Actions']}>
                {filmReviews.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] ${
                      r.deleted_at ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {r.profiles?.username ?? <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {r.films?.title ?? '—'}
                      {r.films?.release_year && (
                        <span className="ml-1 text-[var(--text-muted)]">({r.films.release_year})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--accent-amber)]">
                      {stars(r.rating)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {truncate(r.content)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                      {fmt(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {r.deleted_at ? (
                        <span className="rounded-full bg-red-950/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-red-400">
                          Deleted
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-950/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.deleted_at ? (
                        <ActionBtn
                          action={adminRestoreReview}
                          hidden={{ review_id: r.id }}
                          variant="success"
                        >
                          Restore
                        </ActionBtn>
                      ) : (
                        <ActionBtn
                          action={adminSoftDeleteReview}
                          hidden={{ review_id: r.id }}
                          variant="danger"
                        >
                          Delete
                        </ActionBtn>
                      )}
                    </td>
                  </tr>
                ))}
              </TableShell>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">
              Music Reviews — {musicReviews.length}
            </h2>
            {musicReviews.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No music reviews yet.</p>
            ) : (
              <TableShell headers={['Author', 'Release', 'Rating', 'Content', 'Date', 'Status', 'Actions']}>
                {musicReviews.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] ${
                      r.deleted_at ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {r.profiles?.username ?? <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {r.releases?.title ?? '—'}
                      {r.releases?.release_type && (
                        <span className="ml-1 text-[0.6rem] uppercase tracking-wider text-[var(--text-muted)]">
                          {r.releases.release_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--accent-amber)]">
                      {stars(r.rating)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-[var(--text-secondary)]">
                      {truncate(r.content)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                      {fmt(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {r.deleted_at ? (
                        <span className="rounded-full bg-red-950/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-red-400">
                          Deleted
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-950/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.deleted_at ? (
                        <ActionBtn
                          action={adminRestoreMusicReview}
                          hidden={{ review_id: r.id }}
                          variant="success"
                        >
                          Restore
                        </ActionBtn>
                      ) : (
                        <ActionBtn
                          action={adminSoftDeleteMusicReview}
                          hidden={{ review_id: r.id }}
                          variant="danger"
                        >
                          Delete
                        </ActionBtn>
                      )}
                    </td>
                  </tr>
                ))}
              </TableShell>
            )}
          </div>
        </section>
      )}

      {active === 'users' && (
        <section>
          <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">
            All Users — {users.length}
          </h2>
          {users.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No users yet.</p>
          ) : (
            <TableShell headers={['User', 'Email', 'Joined', 'Reviews', 'Status', 'Actions']}>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] ${
                    u.isBanned ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--text-primary)]">
                      {u.username ?? <span className="text-[var(--text-muted)]">no username</span>}
                    </span>
                    {u.display_name && (
                      <span className="ml-2 text-xs text-[var(--text-muted)]">{u.display_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                    {u.email || <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                    {fmt(u.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {u.reviewCount}
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <span
                        className="rounded-full bg-red-950/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-red-400"
                        title={u.banReason ?? undefined}
                      >
                        Banned
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-950/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-emerald-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <ActionBtn
                        action={adminUnbanUser}
                        hidden={{ user_id: u.id }}
                        variant="default"
                      >
                        Unban
                      </ActionBtn>
                    ) : (
                      <form action={adminBanUser} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={u.id} />
                        <input
                          type="text"
                          name="reason"
                          placeholder="Reason (optional)"
                          maxLength={200}
                          className="w-36 rounded border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                        >
                          Ban
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </TableShell>
          )}
        </section>
      )}
    </main>
  )
}
