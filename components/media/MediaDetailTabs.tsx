'use client'

import { useState } from 'react'
import type {
  TmdbCastMember,
  TmdbCrewMember,
  TmdbProductionCompany,
  TmdbProductionCountry,
  TmdbSpokenLanguage,
  TmdbAlternativeTitle,
} from '@/utils/tmdb'

interface Props {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  cast: TmdbCastMember[]
  crew: TmdbCrewMember[]
  genres: { id: number; name: string }[]
  productionCompanies: TmdbProductionCompany[]
  productionCountries: TmdbProductionCountry[]
  spokenLanguages: TmdbSpokenLanguage[]
  alternativeTitles: TmdbAlternativeTitle[]
}

type Tab = 'cast' | 'crew' | 'details' | 'genres'

const TABS: { id: Tab; label: string }[] = [
  { id: 'cast', label: 'Cast' },
  { id: 'crew', label: 'Crew' },
  { id: 'details', label: 'Details' },
  { id: 'genres', label: 'Genres' },
]

const JOB_LABEL_OVERRIDES: Record<string, string> = {
  'Director of Photography': 'Cinematography',
  'Original Music Composer': 'Music',
}

const JOB_PRIORITY = [
  'Director',
  'Writer',
  'Screenplay',
  'Story',
  'Producer',
  'Executive Producer',
  'Casting',
  'Editor',
  'Cinematography',
  'Production Design',
  'Art Direction',
  'Costume Design',
  'Music',
]

function groupCrew(crew: TmdbCrewMember[]) {
  const map = new Map<string, TmdbCrewMember[]>()
  for (const member of crew) {
    const label = JOB_LABEL_OVERRIDES[member.job] ?? member.job
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(member)
  }
  return Array.from(map.entries()).sort((a, b) => {
    const ia = JOB_PRIORITY.indexOf(a[0])
    const ib = JOB_PRIORITY.indexOf(b[0])
    if (ia === -1 && ib === -1) return a[0].localeCompare(b[0])
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

function dedupeCrew(members: TmdbCrewMember[]) {
  const seen = new Set<number>()
  return members.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

const PILL_CLS =
  'rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'

const ROW_LABEL_CLS =
  'w-36 shrink-0 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]'

export default function MediaDetailTabs({
  tmdbId,
  mediaType,
  cast,
  crew,
  genres,
  productionCompanies,
  productionCountries,
  spokenLanguages,
  alternativeTitles,
}: Props) {
  const [tab, setTab] = useState<Tab>('cast')
  const groupedCrew = groupCrew(crew)
  const tmdbUrl = `https://www.themoviedb.org/${mediaType}/${tmdbId}`

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 backdrop-blur-xs sm:p-8">
      {/* ── Accessible Tablist ─────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Media information tabs"
        className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-4"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] font-medium transition-all focus-ring cursor-pointer select-none ${
              tab === t.id
                ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] shadow-xs ring-1 ring-[var(--accent-amber)]/40'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Panels ────────────────────────────────────── */}
      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mt-6 min-h-[140px]"
      >
        {tab === 'cast' &&
          (cast.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cast.slice(0, 24).map((c) => (
                <span
                  key={`${c.id}-${c.character}`}
                  className={PILL_CLS}
                  title={c.character ? `as ${c.character}` : undefined}
                >
                  <strong className="font-medium text-[var(--text-primary)]">{c.name}</strong>
                  {c.character && (
                    <span className="ml-1.5 italic text-[var(--text-muted)]">
                      as {c.character}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">No cast information available.</p>
          ))}

        {tab === 'crew' &&
          (groupedCrew.length > 0 ? (
            <div className="space-y-4">
              {groupedCrew.map(([job, members]) => (
                <div key={job} className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-6">
                  <p className={ROW_LABEL_CLS}>{job}</p>
                  <div className="flex flex-wrap gap-2">
                    {dedupeCrew(members).map((m) => (
                      <span key={m.id} className={PILL_CLS}>
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">No crew information available.</p>
          ))}

        {tab === 'details' && (
          <div className="space-y-4">
            {productionCompanies.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-6">
                <p className={ROW_LABEL_CLS}>Studios</p>
                <div className="flex flex-wrap gap-2">
                  {productionCompanies.map((c) => (
                    <span key={c.id} className={PILL_CLS}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}
            {productionCountries.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-6">
                <p className={ROW_LABEL_CLS}>Countries</p>
                <div className="flex flex-wrap gap-2">
                  {productionCountries.map((c) => (
                    <span key={c.iso_3166_1} className={PILL_CLS}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}
            {spokenLanguages.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-6">
                <p className={ROW_LABEL_CLS}>Languages</p>
                <div className="flex flex-wrap gap-2">
                  {spokenLanguages.map((l) => (
                    <span key={l.iso_639_1} className={PILL_CLS}>{l.english_name}</span>
                  ))}
                </div>
              </div>
            )}
            {alternativeTitles.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-6">
                <p className={ROW_LABEL_CLS}>Alt. Titles</p>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {alternativeTitles.map((t) => t.title).join(', ')}
                </p>
              </div>
            )}
            {productionCompanies.length === 0 &&
              productionCountries.length === 0 &&
              spokenLanguages.length === 0 &&
              alternativeTitles.length === 0 && (
                <p className="text-sm italic text-[var(--text-muted)]">No additional metadata recorded.</p>
              )}
          </div>
        )}

        {tab === 'genres' &&
          (genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <span key={g.id} className={PILL_CLS}>{g.name}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">No genres listed.</p>
          ))}
      </div>

      <div className="mt-8 border-t border-[var(--border-subtle)] pt-4 text-right">
        <a
          href={tmdbUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
        >
          <span>Complete TMDB credits</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  )
}

