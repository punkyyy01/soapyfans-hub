import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import ReportButton from '@/components/social/ReportButton'
import ShareButton from '@/components/social/ShareButton'
import { isValidNewsTag, decodeHtmlEntities } from '@/utils/news'
import { NEWS_TAG_LABEL } from '@/utils/news-display'

export type NewsCardItem = {
  id: string
  title: string
  description: string | null
  source_name: string
  source_url: string
  canonical_url?: string | null
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
  const displayTitle = decodeHtmlEntities(item.title)
  const displayDescription = item.description ? decodeHtmlEntities(item.description) : null
  const destinationUrl = item.canonical_url || item.source_url

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]">
      <Link href={`/news/${item.id}`} className="flex flex-col focus-ring">
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--bg-elevated)]/60 font-mono text-xs text-[var(--text-muted)]">
              <svg
                className="h-7 w-7 text-[var(--text-muted)]/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <span>Story</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 px-5 pb-2 pt-5">
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
            {displayTitle}
          </h3>

          {displayDescription && (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              {displayDescription}
            </p>
          )}
        </div>
      </Link>

      {/* Outside the Link: a <button> (ShareButton/ReportButton) can't
          nest inside an <a> without breaking HTML validity/accessibility. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 px-5 pb-5 pt-2">
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
        >
          {item.source_name}
          <span aria-hidden="true">↗</span>
        </a>
        <div className="flex items-center gap-3">
          <ShareButton url={`/news/${item.id}`} title={displayTitle} text={displayDescription ?? undefined} />
          <ReportButton targetType="news_item" targetId={item.id} redirectTo="/news" />
        </div>
      </div>
    </div>
  )
}
