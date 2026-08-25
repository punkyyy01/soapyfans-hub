'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PulseFeedItem } from '@/utils/activity'
import type { TrendingItem } from '@/utils/trending'
import PulseFeedCard from './PulseFeedCard'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import SafeImage from '@/components/ui/SafeImage'

interface Props {
  feed: PulseFeedItem[]
  trending: TrendingItem[]
}

type Tab = 'activity' | 'trending'

export default function CommunityPulseSection({ feed, trending }: Props) {
  const [tab, setTab] = useState<Tab>('activity')

  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-10 sm:pb-32">
      {/* ── Section Header & Tab Controls ────────────────────── */}
      <div className="mb-10 flex flex-col gap-6 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-eyebrow">Community Archive · Live</p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Community Pulse
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Community pulse view"
          className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 backdrop-blur-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'activity'}
            aria-controls="pulse-panel"
            id="tab-activity"
            onClick={() => setTab('activity')}
            className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.14em] font-medium transition-all focus-ring cursor-pointer select-none ${
              tab === 'activity'
                ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] shadow-xs ring-1 ring-[var(--accent-amber)]/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Recent Activity
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'trending'}
            aria-controls="pulse-panel"
            id="tab-trending"
            onClick={() => setTab('trending')}
            className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.14em] font-medium transition-all focus-ring cursor-pointer select-none ${
              tab === 'trending'
                ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] shadow-xs ring-1 ring-[var(--accent-amber)]/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Trending This Week
          </button>
        </div>
      </div>

      {/* ── Panel ─────────────────────────────────────────────── */}
      <div id="pulse-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'activity' ? (
          feed.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {feed.map((item) => (
                <PulseFeedCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No activity yet"
              description="Reviews and news will show up here as the community gets going."
            />
          )
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {trending.map((item) => (
              <Link
                key={`${item.mediaType}-${item.id}`}
                href={item.href}
                className="group flex flex-col focus-ring rounded-md"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300 ease-out group-hover:border-[var(--border-strong)]">
                  {item.imageUrl ? (
                    <SafeImage
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center p-4 text-center font-display text-xs italic text-[var(--text-muted)]">
                          {item.title}
                        </div>
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-4 text-center font-display text-xs italic text-[var(--text-muted)]">
                      {item.title}
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <Badge variant={item.mediaType === 'music' ? 'music' : 'film'} size="sm">
                      {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2.5 space-y-0.5 px-0.5">
                  <h3 className="line-clamp-2 font-display text-[0.92rem] font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)]">
                    {item.title}
                  </h3>
                  <StarRating value={Math.round(item.avgRating)} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No trending titles this week"
            description="Be the first to leave a review and kick off this week's chart."
          />
        )}
      </div>
    </section>
  )
}
