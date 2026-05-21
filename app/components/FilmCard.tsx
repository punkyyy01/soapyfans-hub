import Image from 'next/image'
import Link from 'next/link'
import { getTmdbImageUrl, type NormalizedCredit } from '@/utils/tmdb'

interface Props {
  credit: NormalizedCredit
  priority?: boolean
  featured?: boolean
}

export default function FilmCard({ credit, priority = false, featured = false }: Props) {
  const character = credit.character?.trim()
  const isTv = credit.mediaType === 'tv'
  const href = `/${isTv ? 'tv' : 'films'}/${credit.id}`
  const year = credit.year ?? '—'

  const imageSrc = featured
    ? getTmdbImageUrl(credit.backdropPath, 'w1280') ??
      getTmdbImageUrl(credit.posterPath, 'w780')
    : getTmdbImageUrl(credit.posterPath, 'w500')

  const aspectClass = featured ? 'aspect-[4/5] sm:aspect-[3/4]' : 'aspect-[2/3]'

  return (
    <Link
      href={href}
      className={`group relative block h-full focus:outline-none ${
        featured ? 'flex flex-col' : ''
      }`}
    >
      <div
        className={`relative ${aspectClass} overflow-hidden rounded-md bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:ring-[var(--accent-amber)]/50 group-hover:shadow-[0_22px_60px_-16px_rgba(232,137,12,0.6),0_0_0_1px_rgba(255,183,0,0.22)]`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={credit.title}
            fill
            sizes={
              featured
                ? '(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 50vw'
                : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw'
            }
            priority={priority}
            className="object-cover transition-all duration-[900ms] ease-out group-hover:scale-[1.06] group-hover:brightness-[0.55] group-hover:contrast-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] p-4 text-center font-display text-sm italic text-[var(--text-muted)]">
            {credit.title}
          </div>
        )}

        <span
          className={`absolute left-3 top-3 z-10 rounded-full px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.22em] backdrop-blur ${
            isTv
              ? 'bg-[var(--accent-forest-dim)] text-[var(--text-primary)] ring-1 ring-[var(--border-strong)]'
              : 'bg-[var(--bg-base)]/65 text-[var(--accent-gold)] ring-1 ring-[var(--accent-amber)]/30'
          }`}
        >
          {isTv ? 'TV' : 'Film'}
        </span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--bg-base)]/95 to-transparent opacity-90" />

        <div className="absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-2 transition-opacity duration-300 group-hover:opacity-0">
          <span className="font-display text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)]">
            {year}
          </span>
          {credit.voteAverage > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--bg-base)]/70 px-2 py-0.5 text-[0.65rem] font-medium text-[var(--accent-gold)] ring-1 ring-[var(--accent-amber)]/30 backdrop-blur">
              ★ {credit.voteAverage.toFixed(1)}
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-start justify-end gap-2 p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-6">
          <span className="text-[0.6rem] uppercase tracking-[0.45em] text-[var(--accent-amber)] [text-shadow:0_0_18px_rgba(232,137,12,0.55)]">
            {isTv ? 'As' : 'She plays'}
          </span>
          <span
            className={`font-display italic leading-[1.05] text-[var(--text-primary)] [text-shadow:0_0_24px_rgba(255,183,0,0.55),0_0_2px_rgba(0,0,0,0.6)] ${
              featured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'
            }`}
          >
            {character || credit.title}
          </span>
          <span className="mt-2 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.32em] text-[var(--accent-gold)]">
            Read more
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-[var(--accent-amber)] to-transparent opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100" />

      </div>

      {!featured && (
        <div className="mt-3 px-1">
          <p className="line-clamp-2 font-display text-[1.02rem] font-medium leading-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-gold)]">
            {credit.title}
          </p>
          <p className="mt-1 line-clamp-1 text-xs italic text-[var(--text-muted)]">
            {character ? `as ${character}` : ' '}
            {isTv && credit.episodeCount
              ? `${character ? ' · ' : ''}${credit.episodeCount} ep${credit.episodeCount === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
      )}

      {featured && (
        <div className="mt-4 space-y-3">
          <p className="font-display text-xl font-medium leading-[1.1] text-[var(--text-primary)] sm:text-2xl">
            {credit.title}
          </p>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-3">
            <p className="text-[0.62rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
              {isTv ? 'Featured series' : 'Featured film'} · {year}
            </p>
            {credit.voteAverage > 0 && (
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[var(--accent-gold)]">
                ★ {credit.voteAverage.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  )
}
