import Link from 'next/link'
import type { PulseFeedItem } from '@/utils/activity'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import SafeImage from '@/components/ui/SafeImage'

const KIND_LABEL: Record<PulseFeedItem['kind'], string> = {
  review: 'Film',
  music_review: 'Music',
  news: 'News',
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

function ImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)] font-display text-lg italic text-[var(--text-muted)]">
      —
    </div>
  )
}

// One card renderer for all three feed kinds -- same thumbnail treatment,
// same font-display title, same font-mono metadata row -- so the feed
// reads as one consistent list rather than three differently-styled ones.
export default function PulseFeedCard({ item }: { item: PulseFeedItem }) {
  return (
    <Link
      href={item.href}
      className="group flex gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-4 transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] focus-ring"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        {item.imageUrl ? (
          item.kind === 'news' ? (
            // Same-origin proxy for unpredictable third-party domains --
            // see components/news/NewsCard.tsx for the identical pattern.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <SafeImage
              src={item.imageUrl}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              fallback={<ImageFallback />}
            />
          )
        ) : (
          <ImageFallback />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.kind === 'news' ? 'neutral' : item.kind === 'music_review' ? 'music' : 'film'} size="sm">
            {KIND_LABEL[item.kind]}
          </Badge>
          {item.rating !== null && <StarRating value={item.rating} size="sm" />}
          <span className="ml-auto shrink-0 font-mono text-[0.65rem] text-[var(--text-muted)]">
            {timeAgo(item.timestamp)}
          </span>
        </div>

        <h3 className="line-clamp-1 font-display text-base font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)]">
          {item.title}
        </h3>

        <p className="line-clamp-1 text-xs text-[var(--text-secondary)]">
          {item.authorName ? (
            <>
              <span className="text-[var(--text-muted)]">{item.authorName}</span>
              {item.subtitle && <span> — {item.subtitle}</span>}
            </>
          ) : (
            item.subtitle
          )}
        </p>
      </div>
    </Link>
  )
}
