import Badge from '@/components/ui/Badge'
import { isValidNewsTag } from '@/utils/news'
import { NEWS_TAG_LABEL } from '@/utils/news-display'

export type NewsCardItem = {
  id: string
  title: string
  description: string | null
  source_name: string
  source_url: string
  tag: string | null
  published_at: string
  image_url: string | null
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = Math.round(diffMs / 3_600_000)
  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function NewsCard({ item }: { item: NewsCardItem }) {
  return (
    <a
      href={item.source_url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] focus-ring"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--bg-elevated)]">
        {item.image_url ? (
          // Same-origin proxy (see app/api/news-image/[id]/route.ts) --
          // source images live on unpredictable third-party domains, so
          // this isn't run through next/image's remotePatterns allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/news-image/${item.id}`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-[var(--text-muted)]">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          {item.tag && (
            <Badge variant="neutral" size="sm">
              {isValidNewsTag(item.tag) ? NEWS_TAG_LABEL[item.tag] : item.tag}
            </Badge>
          )}
          <span className="ml-auto font-mono text-[0.65rem] text-[var(--text-muted)]">
            {timeAgo(item.published_at)}
          </span>
        </div>

        <h3 className="font-display text-lg font-medium leading-snug text-[var(--text-primary)] line-clamp-3 group-hover:text-[var(--accent-amber)] transition-colors">
          {item.title}
        </h3>

        {item.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
            {item.description}
          </p>
        )}

        <p className="mt-auto flex items-center gap-1.5 pt-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {item.source_name}
          <span aria-hidden="true">↗</span>
        </p>
      </div>
    </a>
  )
}
