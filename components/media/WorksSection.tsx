'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { NormalizedCredit } from '@/utils/tmdb'
import FilmCard from '@/components/media/FilmCard'

interface WorksSectionProps {
  allCredits: NormalizedCredit[]
  filmCredits: NormalizedCredit[]
  tvCredits: NormalizedCredit[]
}

type FilterType = 'all' | 'films' | 'tv'

export default function WorksSection({
  allCredits,
  filmCredits,
  tvCredits,
}: WorksSectionProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const activeCredits =
    filter === 'films' ? filmCredits : filter === 'tv' ? tvCredits : allCredits

  const [featured, ...rest] = activeCredits
  const supporting = rest.slice(0, 5)

  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-10 sm:pb-32">
      {/* ── Section Header & Filter Controls ────────────────── */}
      <div className="mb-10 flex flex-col gap-6 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-eyebrow">
            Curated Archive · Film &amp; Television
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Featured Works
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          {/* Segmented Filter Control */}
          <div
            role="tablist"
            aria-label="Filter works by media type"
            className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 backdrop-blur-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              aria-controls="works-panel"
              id="tab-all"
              onClick={() => setFilter('all')}
              className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.14em] font-medium transition-all focus-ring cursor-pointer select-none ${
                filter === 'all'
                  ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] shadow-xs ring-1 ring-[var(--accent-amber)]/40'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({allCredits.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'films'}
              aria-controls="works-panel"
              id="tab-films"
              onClick={() => setFilter('films')}
              className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.14em] font-medium transition-all focus-ring cursor-pointer select-none ${
                filter === 'films'
                  ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] shadow-xs ring-1 ring-[var(--accent-amber)]/40'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Films ({filmCredits.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'tv'}
              aria-controls="works-panel"
              id="tab-tv"
              onClick={() => setFilter('tv')}
              className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.14em] font-medium transition-all focus-ring cursor-pointer select-none ${
                filter === 'tv'
                  ? 'bg-[var(--accent-forest-dim)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--accent-forest)]/50'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              TV ({tvCredits.length})
            </button>
          </div>

          <Link
            href="/films"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-sm py-1"
          >
            <span>Full index</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* ── Works Grid Composition ─────────────────────────── */}
      <div
        id="works-panel"
        role="tabpanel"
        aria-labelledby={`tab-${filter}`}
        className="space-y-8"
      >
        {featured && (
          <div className="w-full">
            <FilmCard credit={featured} priority featured />
          </div>
        )}

        {supporting.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {supporting.map((c, i) => (
              <FilmCard key={`${c.mediaType}-${c.id}`} credit={c} priority={i < 2} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
