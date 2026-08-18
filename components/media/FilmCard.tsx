import Image from 'next/image'
import Link from 'next/link'
import { getTmdbImageUrl, type NormalizedCredit } from '@/utils/tmdb'
import Badge from '@/components/ui/Badge'

interface Props {
  credit: NormalizedCredit
  priority?: boolean
  featured?: boolean
  className?: string
}

export default function FilmCard({
  credit,
  priority = false,
  featured = false,
  className = '',
}: Props) {
  const character = credit.character?.trim()
  const isTv = credit.mediaType === 'tv'
  const href = `/${isTv ? 'tv' : 'films'}/${credit.id}`
  const year = credit.year ?? '—'

  const imageSrc = featured
    ? getTmdbImageUrl(credit.backdropPath, 'w1280') ??
      getTmdbImageUrl(credit.posterPath, 'w780')
    : getTmdbImageUrl(credit.posterPath, 'w500')

  if (featured) {
    return (
      <Link
        href={href}
        className={`group relative flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] focus-ring sm:flex-row ${className}`}
      >
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-[var(--bg-elevated)] sm:aspect-[16/10] sm:w-[42%] md:w-[38%]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={credit.title}
              fill
              sizes="(max-width: 640px) 100vw, 420px"
              priority={priority}
              className="object-cover object-[center_20%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center font-display text-base italic text-[var(--text-muted)]">
              {credit.title}
            </div>
          )}

          <div className="absolute left-3 top-3 z-10">
            <Badge variant={isTv ? 'tv' : 'film'} size="sm">
              {isTv ? 'TV Series' : 'Film'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-metadata">
              <span className="font-mono text-xs text-[var(--text-secondary)]">{year}</span>
              {credit.voteAverage > 0 && (
                <span className="font-mono text-xs font-medium text-[var(--accent-gold)]">
                  ★ {credit.voteAverage.toFixed(1)}
                </span>
              )}
            </div>

            <h3 className="font-display text-xl font-medium leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)] sm:text-2xl">
              {credit.title}
            </h3>

            {character && (
              <p className="text-xs italic text-[var(--text-secondary)]">
                as {character}
                {isTv && credit.episodeCount
                  ? ` · ${credit.episodeCount} ep${credit.episodeCount === 1 ? '' : 's'}`
                  : ''}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3.5 text-xs text-metadata">
            <span className="text-[var(--text-muted)]">Featured archival work</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-amber)] transition-transform duration-200 group-hover:translate-x-1">
              Explore entry →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`group relative flex flex-col focus-ring rounded-lg ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300 ease-out group-hover:border-[var(--border-strong)] group-hover:shadow-lg">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={credit.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center font-display text-xs italic text-[var(--text-muted)]">
            {credit.title}
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 z-10">
          <Badge variant={isTv ? 'tv' : 'film'} size="sm">
            {isTv ? 'TV' : 'Film'}
          </Badge>
        </div>

        {credit.voteAverage > 0 && (
          <div className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[var(--bg-base)]/80 px-2 py-0.5 text-[0.62rem] font-mono font-medium text-[var(--accent-gold)] backdrop-blur-xs ring-1 ring-[var(--border-subtle)]">
            ★ {credit.voteAverage.toFixed(1)}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-base)]/80 to-transparent" />
      </div>

      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="line-clamp-1 font-display text-[0.95rem] font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-amber)]">
          {credit.title}
        </h3>
        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="line-clamp-1 italic text-[var(--text-secondary)]">
            {character ? `as ${character}` : (isTv ? 'TV Series' : 'Feature film')}
          </p>
          <span className="shrink-0 font-mono text-[0.7rem] text-[var(--text-muted)]">
            {year}
          </span>
        </div>
      </div>
    </Link>
  )
}

