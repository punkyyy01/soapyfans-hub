'use client'

import { useState, useMemo } from 'react'
import type { NormalizedCredit } from '@/utils/tmdb'
import FilmCard from '@/components/media/FilmCard'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeader from '@/components/ui/SectionHeader'

interface Props {
  filmList: NormalizedCredit[]
  tvList: NormalizedCredit[]
}

export default function FilmographySearch({ filmList, tvList }: Props) {
  const [query, setQuery] = useState('')

  const allCredits = useMemo(() => [...filmList, ...tvList], [filmList, tvList])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return allCredits.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.character && c.character.toLowerCase().includes(q)) ||
        (c.year && c.year.includes(q)),
    )
  }, [query, allCredits])

  return (
    <div className="space-y-12">
      {/* ── Search Bar ──────────────────────────────────────── */}
      <div className="relative max-w-md">
        <label htmlFor="filmography-search" className="sr-only">
          Search filmography titles, roles, or years
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 text-sm text-[var(--text-muted)]" aria-hidden="true">
            ⌕
          </span>
          <input
            id="filmography-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter titles, roles, or years…"
            className="w-full rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] py-2.5 pl-9 pr-10 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="absolute right-3 rounded-full p-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-ring"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Filtered Search Results ─────────────────────────── */}
      {filtered !== null ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <p className="text-eyebrow">
              Search Results
            </p>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {filtered.length} {filtered.length === 1 ? 'match' : 'matches'} for &ldquo;{query}&rdquo;
            </span>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((credit) => (
                <FilmCard key={`${credit.mediaType}-${credit.id}`} credit={credit} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No archival records found"
              description={`No credits in Sophie's filmography match "${query}". Try searching by title, character name, or release year.`}
              action={
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent-amber)] hover:underline focus-ring rounded-xs p-1"
                >
                  Clear search filter →
                </button>
              }
            />
          )}
        </div>
      ) : (
        /* ── Standard Categorized Archive View ───────────────── */
        <div className="space-y-24">
          {/* 1. Feature Films Section */}
          <section id="films" className="scroll-mt-28 space-y-8">
            <SectionHeader
              kicker="Feature Films"
              title="On the Big Screen"
              action={
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {filmList.length} {filmList.length === 1 ? 'title' : 'titles'}
                </span>
              }
            />

            {filmList.length > 0 ? (
              <div className="space-y-10">
                {/* Featured Most Recent Film */}
                <div className="max-w-3xl">
                  <FilmCard credit={filmList[0]} priority featured />
                </div>

                {/* Remaining Feature Films Grid */}
                {filmList.length > 1 && (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filmList.slice(1).map((credit, i) => (
                      <FilmCard
                        key={`movie-${credit.id}`}
                        credit={credit}
                        priority={i < 4}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No film credits recorded"
                description="Feature films will appear here once cataloged in the archive."
              />
            )}
          </section>

          {/* 2. Editorial Transition: Yellowjackets */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 p-8 text-center sm:p-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-forest-dim)] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-primary)] ring-1 ring-[var(--accent-forest)]/40">
              Yellowjackets · 2021–Present
            </span>
            <h3 className="mt-4 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              29 episodes as Natalie Scatorccio.
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--text-secondary)] text-pretty">
              The breakthrough performance that anchored the wilderness and defined a generation of psychological horror.
            </p>
          </div>

          {/* 3. Television Section */}
          <section id="television" className="scroll-mt-28 space-y-8">
            <SectionHeader
              kicker="Television Series"
              title="On the Small Screen"
              action={
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {tvList.length} {tvList.length === 1 ? 'series' : 'series'}
                </span>
              }
            />

            {tvList.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {tvList.map((credit, i) => (
                  <FilmCard
                    key={`tv-${credit.id}`}
                    credit={credit}
                    priority={i < 3}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No television credits recorded"
                description="Television appearances will appear here once cataloged in the archive."
              />
            )}
          </section>
        </div>
      )}
    </div>
  )
}
