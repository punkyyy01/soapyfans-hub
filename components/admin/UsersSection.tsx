import { createAdminClient } from '@/utils/supabase/admin'
import { adminBanUser, adminUnbanUser } from '@/app/(admin)/dashboard-s9k2mx/actions'
import { fmt, TableShell, ActionBtn } from './dashboardUI'

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

export default async function UsersSection() {
  const admin = createAdminClient()

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

  const users: UserRow[] = (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    created_at: p.created_at,
    email: emailMap.get(p.id) ?? '',
    isBanned: bannedMap.has(p.id),
    banReason: bannedMap.get(p.id) ?? null,
    reviewCount: reviewCountMap.get(p.id) ?? 0,
  }))

  return (
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
  )
}
