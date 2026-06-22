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

// TMDB jobs are very granular — small overrides so common roles read better
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
  'rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs text-[var(--text-secondary)]'

const ROW_LABEL_CLS =
  'w-40 shrink-0 text-[0.65rem] uppercase tracking-[0.24em] text-[var(--text-muted)]'

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
    <div className="border-t border-[var(--border-subtle)] pt-8">
      <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-[var(--border-subtle)] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-[0.7rem] uppercase tracking-[0.28em] transition-colors ${
              tab === t.id
                ? 'text-[var(--accent-gold)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'cast' &&
          (cast.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cast.slice(0, 24).map((c) => (
                <span key={`${c.id}-${c.character}`} className={PILL_CLS} title={c.character}>
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">No cast info yet.</p>
          ))}

        {tab === 'crew' &&
          (groupedCrew.length > 0 ? (
            <div className="space-y-5">
              {groupedCrew.map(([job, members]) => (
                <div key={job} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
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
            <p className="text-sm italic text-[var(--text-muted)]">No crew info yet.</p>
          ))}

        {tab === 'details' && (
          <div className="space-y-5">
            {productionCompanies.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                <p className={ROW_LABEL_CLS}>Studios</p>
                <div className="flex flex-wrap gap-2">
                  {productionCompanies.map((c) => (
                    <span key={c.id} className={PILL_CLS}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}
            {productionCountries.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                <p className={ROW_LABEL_CLS}>Country</p>
                <div className="flex flex-wrap gap-2">
                  {productionCountries.map((c) => (
                    <span key={c.iso_3166_1} className={PILL_CLS}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}
            {spokenLanguages.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                <p className={ROW_LABEL_CLS}>Languages</p>
                <div className="flex flex-wrap gap-2">
                  {spokenLanguages.map((l) => (
                    <span key={l.iso_639_1} className={PILL_CLS}>{l.english_name}</span>
                  ))}
                </div>
              </div>
            )}
            {alternativeTitles.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <p className={ROW_LABEL_CLS}>Alternative titles</p>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {alternativeTitles.map((t) => t.title).join(', ')}
                </p>
              </div>
            )}
            {productionCompanies.length === 0 &&
              productionCountries.length === 0 &&
              spokenLanguages.length === 0 &&
              alternativeTitles.length === 0 && (
                <p className="text-sm italic text-[var(--text-muted)]">No details yet.</p>
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

      <a
        href={tmdbUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-8 inline-block text-[0.65rem] uppercase tracking-[0.24em] text-[var(--text-muted)] underline-offset-4 hover:text-[var(--accent-gold)] hover:underline"
      >
        More at TMDB ↗
      </a>
    </div>
  )
}
