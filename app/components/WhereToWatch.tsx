import Image from 'next/image'
import { getTmdbImageUrl, type TmdbWatchProvidersForCountry } from '@/utils/tmdb'

interface Props {
  providers: TmdbWatchProvidersForCountry | null
}

const GROUPS: { key: 'flatrate' | 'rent' | 'buy'; label: string }[] = [
  { key: 'flatrate', label: 'Stream' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
]

export default function WhereToWatch({ providers }: Props) {
  if (!providers) return null

  const hasAny = GROUPS.some((g) => (providers[g.key]?.length ?? 0) > 0)
  if (!hasAny) return null

  return (
    <div className="mt-6 space-y-4 border-t border-[var(--border-subtle)] pt-6">
      <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
        Where to watch
      </p>

      {GROUPS.map(({ key, label }) => {
        const list = providers[key]
        if (!list || list.length === 0) return null
        return (
          <div key={key}>
            <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
              {label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map((p) => (
                <span
                  key={p.provider_id}
                  title={p.provider_name}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md ring-1 ring-[var(--border-subtle)]"
                >
                  {getTmdbImageUrl(p.logo_path, 'w185') && (
                    <Image
                      src={getTmdbImageUrl(p.logo_path, 'w185')!}
                      alt={p.provider_name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        )
      })}

      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 text-[0.6rem] uppercase tracking-[0.24em] text-[var(--accent-gold)] underline-offset-4 hover:underline"
        >
          See all options →
        </a>
      )}

      <p className="text-[0.55rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Streaming data by JustWatch
      </p>
    </div>
  )
}
