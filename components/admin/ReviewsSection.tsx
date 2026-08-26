import { createAdminClient } from '@/utils/supabase/admin'
import StarRating from '@/components/ui/StarRating'
import {
  adminSoftDeleteReview,
  adminRestoreReview,
  adminSoftDeleteMusicReview,
  adminRestoreMusicReview,
  adminSoftDeleteReply,
  adminRestoreReply,
  adminApproveNewsItem,
  adminRejectNewsItem,
} from '@/app/(admin)/dashboard-s9k2mx/actions'
import { fmt, truncate, TableShell, ActionBtn } from './dashboardUI'

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
type Reply = {
  id: string
  content: string
  created_at: string
  deleted_at: string | null
  user_id: string
  profiles: { username: string | null } | null
  review_id: string | null
  music_review_id: string | null
}
type NewsItem = {
  id: string
  title: string
  source_name: string
  status: string
  published_at: string
}

export default async function ReviewsSection() {
  const admin = createAdminClient()

  const [filmRes, musicRes, repliesRes, newsRes] = await Promise.all([
    admin
      .from('reviews')
      .select('id, rating, content, created_at, deleted_at, user_id, profiles(username), films(title, release_year)')
      .order('created_at', { ascending: false }),
    admin
      .from('music_reviews')
      .select('id, rating, content, created_at, deleted_at, user_id, profiles(username), releases(title, release_type)')
      .order('created_at', { ascending: false }),
    admin
      .from('review_replies')
      .select('id, content, created_at, deleted_at, user_id, review_id, music_review_id, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(200),
    admin
      .from('news_items')
      .select('id, title, source_name, status, published_at')
      .order('published_at', { ascending: false })
      .limit(200),
  ])

  const filmReviews = (filmRes.data ?? []) as FilmReview[]
  const musicReviews = (musicRes.data ?? []) as MusicReview[]
  const replies = (repliesRes.data ?? []) as Reply[]
  const newsItems = (newsRes.data ?? []) as NewsItem[]

  return (
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
                <td className="px-4 py-3">
                  <StarRating value={r.rating} />
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
                <td className="px-4 py-3">
                  <StarRating value={r.rating} />
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

      <div>
        <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">
          Replies — {replies.length}
        </h2>
        {replies.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No replies yet.</p>
        ) : (
          <TableShell headers={['Author', 'On', 'Content', 'Date', 'Status', 'Actions']}>
            {replies.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] ${
                  r.deleted_at ? 'opacity-50' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {r.profiles?.username ?? <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                  {r.review_id ? 'Film review' : 'Music review'}
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
                    <ActionBtn action={adminRestoreReply} hidden={{ reply_id: r.id }} variant="success">
                      Restore
                    </ActionBtn>
                  ) : (
                    <ActionBtn action={adminSoftDeleteReply} hidden={{ reply_id: r.id }} variant="danger">
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
          News Items — {newsItems.length}
        </h2>
        {newsItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No news items yet.</p>
        ) : (
          <TableShell headers={['Title', 'Source', 'Date', 'Status', 'Actions']}>
            {newsItems.map((n) => (
              <tr
                key={n.id}
                className={`border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] ${
                  n.status === 'rejected' ? 'opacity-50' : ''
                }`}
              >
                <td className="max-w-sm px-4 py-3 text-sm text-[var(--text-secondary)]">{truncate(n.title, 120)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{n.source_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">
                  {fmt(n.published_at)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider ${
                      n.status === 'approved'
                        ? 'bg-emerald-950/40 text-emerald-400'
                        : n.status === 'rejected'
                          ? 'bg-red-950/40 text-red-400'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                    }`}
                  >
                    {n.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {n.status === 'rejected' ? (
                    <ActionBtn action={adminApproveNewsItem} hidden={{ news_item_id: n.id }} variant="success">
                      Approve
                    </ActionBtn>
                  ) : (
                    <ActionBtn action={adminRejectNewsItem} hidden={{ news_item_id: n.id }} variant="danger">
                      Reject
                    </ActionBtn>
                  )}
                </td>
              </tr>
            ))}
          </TableShell>
        )}
      </div>
    </section>
  )
}
