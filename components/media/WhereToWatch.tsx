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
    <div className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5 backdrop-blur-xs">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <p className="text-eyebrow">
          Where to Watch
        </p>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          JustWatch
        </span>
      </div>

      {GROUPS.map(({ key, label }) => {
        const list = providers[key]
        if (!list || list.length === 0) return null
        return (
          <div key={key} className="space-y-2">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] font-medium">
              {label}
            </p>
            <div className="flex flex-wrap gap-2">
              {list.map((p) => {
                const logoSrc = getTmdbImageUrl(p.logo_path, 'w185')
                return (
                  <span
                    key={p.provider_id}
                    title={p.provider_name}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] transition-all hover:border-[var(--border-strong)]"
                  >
                    {logoSrc ? (
                      <Image
                        src={logoSrc}
                        alt={p.provider_name}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[0.6rem] text-[var(--text-muted)] font-mono">
                        {p.provider_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}

      {providers.link && (
        <div className="border-t border-[var(--border-subtle)] pt-3 text-right">
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--accent-amber)] transition-colors hover:underline focus-ring rounded-xs"
          >
            <span>All streaming options</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </div>
  )
}

