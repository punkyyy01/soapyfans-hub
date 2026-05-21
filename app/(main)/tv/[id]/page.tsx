import type { Metadata } from 'next'
import { getTvDetails, getTmdbImageUrl } from '@/utils/tmdb'
import { buildTvSeriesSchema, serializeJsonLd } from '@/utils/schema'
import Reveal from '@/app/components/Reveal'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tvId = Number(id)
  if (!Number.isFinite(tvId) || tvId <= 0) return {}

  try {
    const tv = await getTvDetails(tvId)
    const firstYear = tv.first_air_date ? tv.first_air_date.slice(0, 4) : null
    const lastYear = tv.last_air_date ? tv.last_air_date.slice(0, 4) : null
    const yearLabel =
      firstYear && lastYear && firstYear !== lastYear
        ? `${firstYear}–${tv.in_production ? 'present' : lastYear}`
        : firstYear ?? ''
    const titleWithYear = yearLabel ? `${tv.name} (${yearLabel})` : tv.name
    const description = tv.overview
      ? `${tv.overview.slice(0, 200)}${tv.overview.length > 200 ? '…' : ''} · A Sophie Thatcher TV credit on SoapyFans Hub — fan-made, unofficial.`
      : `${titleWithYear} — a Sophie Thatcher TV credit on SoapyFans Hub. Fan-made, unofficial, not affiliated with Sophie Thatcher.`
    const ogImage = getTmdbImageUrl(tv.backdrop_path, 'w1280') ?? getTmdbImageUrl(tv.poster_path, 'w780')
    const canonical = `/tv/${tvId}`

    return {
      title: titleWithYear,
      description,
      alternates: { canonical },
      openGraph: {
        type: 'video.tv_show',
        title: `${titleWithYear} · Sophie Thatcher`,
        description,
        url: canonical,
        images: ogImage ? [{ url: ogImage, alt: tv.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${titleWithYear} · Sophie Thatcher`,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
    }
  } catch {
    return {
      title: 'TV',
      robots: { index: false, follow: false },
    }
  }
}

export default async function TvDetailPage({ params }: Props) {
  const { id } = await params
  const tvId = Number(id)

  if (!Number.isFinite(tvId) || tvId <= 0) notFound()

  const tv = await getTvDetails(tvId).catch(() => notFound())

  const poster = getTmdbImageUrl(tv.poster_path, 'w500')
  const backdrop = getTmdbImageUrl(tv.backdrop_path, 'w1280')
  const firstYear = tv.first_air_date ? tv.first_air_date.slice(0, 4) : null
  const lastYear = tv.last_air_date ? tv.last_air_date.slice(0, 4) : null
  const yearLabel =
    firstYear && lastYear && firstYear !== lastYear
      ? `${firstYear} — ${tv.in_production ? 'present' : lastYear}`
      : firstYear ?? '—'

  const avgRuntime = tv.episode_run_time?.[0] ?? null

  const seriesSchema = buildTvSeriesSchema({
    tmdbId: tvId,
    title: tv.name,
    overview: tv.overview,
    firstAirDate: tv.first_air_date,
    lastAirDate: tv.last_air_date,
    posterUrl: poster,
    genres: tv.genres,
    numberOfSeasons: tv.number_of_seasons,
    numberOfEpisodes: tv.number_of_episodes,
  })

  return (
    <main className="relative bg-[var(--bg-base)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(seriesSchema) }}
      />
      <section className="relative h-[68vh] min-h-[480px] w-full overflow-hidden grain">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_22%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.55)] to-[rgba(8,7,4,0.2)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.3)] to-transparent" />
      </section>

      <section className="relative z-10 mx-auto -mt-6 max-w-6xl px-6 pt-4 sm:-mt-8 sm:px-10">
        <Link
          href="/films#television"
          className="group inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)]"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Back to TV index
        </Link>
        <Reveal immediate stagger={0.1} y={28}>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] uppercase tracking-[0.5em]">
            <span className="rounded-full bg-[var(--accent-forest-dim)] px-2.5 py-0.5 text-[var(--text-primary)] ring-1 ring-[var(--border-strong)]">
              Series
            </span>
            <span className="text-[var(--accent-amber)]">{yearLabel}</span>
            {tv.number_of_seasons > 0 && (
              <span className="text-[var(--text-muted)]">
                · {tv.number_of_seasons}{' '}
                {tv.number_of_seasons === 1 ? 'season' : 'seasons'}
              </span>
            )}
            {tv.number_of_episodes > 0 && (
              <span className="text-[var(--text-muted)]">
                · {tv.number_of_episodes} eps
              </span>
            )}
            {avgRuntime && (
              <span className="text-[var(--text-muted)]">· ~{avgRuntime} min</span>
            )}
            {tv.status && (
              <span className="text-[var(--text-muted)]">· {tv.status}</span>
            )}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.8rem)] font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)] text-balance">
            {tv.name}
          </h1>
          {tv.tagline && (
            <p className="mt-5 max-w-2xl font-display text-lg italic text-[var(--text-secondary)] text-pretty sm:text-xl">
              “{tv.tagline}”
            </p>
          )}
        </Reveal>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-32 pt-10 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="mt-6 overflow-hidden rounded-md bg-[var(--bg-elevated)] ring-1 ring-[var(--border-strong)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
              {poster ? (
                <Image
                  src={poster}
                  alt={tv.name}
                  width={500}
                  height={750}
                  className="w-full"
                />
              ) : (
                <div className="flex h-[420px] items-center justify-center font-display italic text-[var(--text-muted)]">
                  Poster missing.
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4 text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span>TMDB rating</span>
                <span className="text-[var(--accent-gold)]">
                  ★ {tv.vote_average.toFixed(1)} / 10
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span>First aired</span>
                <span className="text-[var(--text-secondary)] normal-case tracking-normal">
                  {tv.first_air_date || '—'}
                </span>
              </div>
              {tv.last_air_date && (
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <span>Last aired</span>
                  <span className="text-[var(--text-secondary)] normal-case tracking-normal">
                    {tv.last_air_date}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span>Seasons</span>
                <span className="text-[var(--text-secondary)]">
                  {tv.number_of_seasons}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span>Episodes</span>
                <span className="text-[var(--text-secondary)]">
                  {tv.number_of_episodes}
                </span>
              </div>
              {tv.networks && tv.networks.length > 0 && (
                <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-3">
                  <span>Network{tv.networks.length > 1 ? 's' : ''}</span>
                  <span className="text-right text-[var(--text-secondary)] normal-case tracking-normal">
                    {tv.networks.map((n) => n.name).join(', ')}
                  </span>
                </div>
              )}
              {tv.created_by && tv.created_by.length > 0 && (
                <div className="flex items-start justify-between">
                  <span>Created by</span>
                  <span className="text-right text-[var(--text-secondary)] normal-case tracking-normal">
                    {tv.created_by.map((c) => c.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-16 pt-10 lg:pt-12">
            <Reveal immediate stagger={0.1}>
              <div className="flex flex-wrap gap-2">
                {tv.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--text-secondary)]"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
              <p className="font-display text-[1.35rem] font-medium leading-relaxed text-[var(--text-primary)] text-pretty sm:text-2xl">
                {tv.overview || 'No synopsis yet.'}
              </p>
            </Reveal>

            <section className="space-y-6">
              <div className="border-b border-[var(--border-subtle)] pb-5">
                <p className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.5em] text-[var(--text-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-forest)]" />
                  Fan notes
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Reviews
                </h2>
              </div>
              <p className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/40 px-5 py-4 text-sm text-[var(--text-secondary)]">
                TV reviews are coming soon. For now, the floor is open for films only —{' '}
                <Link
                  href="/films#films"
                  className="font-medium uppercase tracking-[0.18em] text-[var(--accent-gold)] underline-offset-4 hover:underline"
                >
                  browse films
                </Link>{' '}
                if you’d like to leave a review.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
