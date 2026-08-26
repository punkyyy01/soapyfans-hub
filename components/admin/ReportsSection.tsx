import { createAdminClient } from '@/utils/supabase/admin'
import { adminResolveReport, adminDismissReport } from '@/app/(admin)/dashboard-s9k2mx/actions'
import { fmt, truncate, TableShell, ActionBtn } from './dashboardUI'

type ReportRow = {
  id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  created_at: string
  profiles: { username: string | null } | null
}

export default async function ReportsSection() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('reports')
    .select('id, target_type, target_id, reason, status, created_at, profiles!reports_reporter_id_fkey(username)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200)
  const reports = (data ?? []) as unknown as ReportRow[]

  const idsByType = new Map<string, string[]>()
  for (const r of reports) {
    idsByType.set(r.target_type, [...(idsByType.get(r.target_type) ?? []), r.target_id])
  }

  const [reviewPreviews, musicPreviews, replyPreviews, newsPreviews] = await Promise.all([
    idsByType.get('review')?.length
      ? admin.from('reviews').select('id, content').in('id', idsByType.get('review')!)
      : Promise.resolve({ data: [] as { id: string; content: string | null }[] }),
    idsByType.get('music_review')?.length
      ? admin.from('music_reviews').select('id, content').in('id', idsByType.get('music_review')!)
      : Promise.resolve({ data: [] as { id: string; content: string | null }[] }),
    idsByType.get('review_reply')?.length
      ? admin.from('review_replies').select('id, content').in('id', idsByType.get('review_reply')!)
      : Promise.resolve({ data: [] as { id: string; content: string | null }[] }),
    idsByType.get('news_item')?.length
      ? admin.from('news_items').select('id, title').in('id', idsByType.get('news_item')!)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])

  const reportPreviews = new Map<string, string>([
    ...(reviewPreviews.data ?? []).map((r) => [r.id, r.content ?? '(no text)'] as [string, string]),
    ...(musicPreviews.data ?? []).map((r) => [r.id, r.content ?? '(no text)'] as [string, string]),
    ...(replyPreviews.data ?? []).map((r) => [r.id, r.content] as [string, string]),
    ...(newsPreviews.data ?? []).map((r) => [r.id, r.title] as [string, string]),
  ])

  return (
    <section>
      <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">
        Reports — {reports.length}
      </h2>
      {reports.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No reports yet.</p>
      ) : (
        <TableShell headers={['Reporter', 'Target', 'Preview', 'Reason', 'Date', 'Status', 'Actions']}>
          {reports.map((r) => (
            <tr
              key={r.id}
              className={`border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-elevated)] ${
                r.status !== 'pending' ? 'opacity-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                {r.profiles?.username ?? <span className="text-[var(--text-muted)]">—</span>}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{r.target_type}</td>
              <td className="max-w-xs px-4 py-3 text-xs text-[var(--text-secondary)]">
                {truncate(reportPreviews.get(r.target_id) ?? null)}
              </td>
              <td className="max-w-xs px-4 py-3 text-xs text-[var(--text-secondary)]">{truncate(r.reason)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">{fmt(r.created_at)}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider ${
                    r.status === 'pending'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                      : r.status === 'resolved'
                        ? 'bg-emerald-950/40 text-emerald-400'
                        : 'bg-red-950/40 text-red-400'
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {r.status === 'pending' && (
                  <div className="flex items-center gap-3">
                    <ActionBtn
                      action={adminResolveReport}
                      hidden={{ report_id: r.id, target_type: r.target_type, target_id: r.target_id }}
                      variant="danger"
                    >
                      Resolve
                    </ActionBtn>
                    <ActionBtn action={adminDismissReport} hidden={{ report_id: r.id }} variant="default">
                      Dismiss
                    </ActionBtn>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </section>
  )
}
