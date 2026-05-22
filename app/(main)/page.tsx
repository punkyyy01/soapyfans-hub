import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  getPersonImages,
  getPersonCombinedCredits,
  getTmdbImageUrl,
  normalizeCredit,
  type NormalizedCredit,
  type TmdbCombinedCredits,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { getUser } from '@/utils/supabase/server'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, buildWebSiteSchema, serializeJsonLd } from '@/utils/schema'
import Hero from '@/app/components/Hero'
import Reveal from '@/app/components/Reveal'
import FilmCard from '@/app/components/FilmCard'
import MusicSection from '@/app/components/MusicSection'

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: '/',
    type: 'website',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

function sortByDateDesc(a: NormalizedCredit, b: NormalizedCredit) {
  const ta = a.date ? new Date(a.date).getTime() : 0
  const tb = b.date ? new Date(b.date).getTime() : 0
  return tb - ta
}

function MusicSkeleton() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-10">
      <div className="mb-12 border-b border-[var(--border-subtle)] pb-6">
        <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--bg-elevated)]" />
        <div className="mt-4 h-10 w-56 animate-pulse rounded bg-[var(--bg-elevated)]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-[var(--bg-elevated)]/60" />
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const t0 = performance.now()
  const elapsed = (label: string) =>
    console.log(`[home] ${label}: ${(performance.now() - t0).toFixed(0)}ms`)

  const creditsPromise = getPersonCombinedCredits()
    .then((r) => { elapsed('tmdb-credits'); return r })
    .catch((): TmdbCombinedCredits => { elapsed('tmdb-credits-error'); return { id: 0, cast: [], crew: [] } })

  const portraitPromise = getPersonImages()
    .then((r) => { elapsed('tmdb-portrait'); return r })
    .catch((): TmdbPersonImages => { elapsed('tmdb-portrait-error'); return { id: 0, profiles: [] } })

  const [user, credits, imagesData] = await Promise.all([
    getUser(),
    creditsPromise,
    portraitPromise,
  ])
  elapsed('critical-path-done')

  const seen = new Set<string>()
  const all: NormalizedCredit[] = []
  for (const c of credits.cast) {
    const key = `${c.media_type}:${c.id}`
    if (seen.has(key)) continue
    seen.add(key)
    all.push(normalizeCredit(c))
  }

  const dated = all.filter((c) => c.date).sort(sortByDateDesc)
  const heroCredit = dated.find((c) => c.backdropPath) ?? dated[0] ?? all[0]

  const backdropUrl =
    getTmdbImageUrl(heroCredit?.backdropPath ?? null, 'w1280') ??
    getTmdbImageUrl(heroCredit?.posterPath ?? null, 'w780') ??
    ''

  const portraitUrls = imagesData.profiles
    .filter(p => p.aspect_ratio <= 0.74)
    .sort((a, b) => {
      const ratioDiff = a.aspect_ratio - b.aspect_ratio
      if (Math.abs(ratioDiff) > 0.05) return ratioDiff
      return b.vote_average - a.vote_average
    })
    .slice(0, 8)
    .map(p => getTmdbImageUrl(p.file_path, 'w780'))
    .filter((u): u is string => u !== null)

  const aboutPortrait = portraitUrls[0] ?? backdropUrl

  const films = dated.filter((c) => c.mediaType === 'movie').slice(0, 5)
  const tv = dated.filter((c) => c.mediaType === 'tv').slice(0, 5)

  const [filmFeatured, ...filmRest] = films
  const [tvFeatured, ...tvRest] = tv

  return (
    <main className="bg-[var(--bg-base)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildWebSiteSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildWebPageSchema({
              name: `${SITE_NAME} — ${SITE_TAGLINE}`,
              description: SITE_DESCRIPTION,
              path: '/',
            }),
          ),
        }}
      />
      <Hero
        backdropUrl={backdropUrl}
        portraitUrls={portraitUrls}
        featuredTitle={heroCredit?.title ?? 'Sophie Thatcher'}
        featuredYear={heroCredit?.year ?? null}
        filmCount={all.length}
      />

      {films.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 pb-28 sm:px-10">
          <div className="mb-14 grid grid-cols-12 items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
            <div className="col-span-12 lg:col-span-9">
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                Big screen · recent credits
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.025em] text-[var(--text-primary)]">
                Recent <span className="italic text-[var(--accent-gold)]">films</span>.
              </h2>
            </div>
            <div className="col-span-12 flex items-center justify-between gap-6 lg:col-span-3 lg:justify-end">
              <Link
                href="/films#films"
                className="group inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)]"
              >
                Full film index
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {filmFeatured && (
            <Reveal
              selector="[data-film-card]"
              stagger={0.08}
              y={48}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
            >
              <div
                data-film-card
                className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
              >
                <FilmCard credit={filmFeatured} priority featured />
              </div>
              {filmRest.map((c, i) => (
                <div key={`movie-${c.id}`} data-film-card>
                  <FilmCard credit={c} priority={i < 2} />
                </div>
              ))}
            </Reveal>
          )}
        </section>
      )}

      <section className="relative mx-auto max-w-7xl px-6 pb-28 sm:px-10">
        <Reveal stagger={0.12}>
          <div className="relative border-y border-[var(--border-subtle)] py-20 sm:py-24">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-6 left-0 select-none font-display text-[10rem] italic leading-none text-[var(--accent-amber)]/15 sm:-top-10 sm:text-[14rem]"
            >
              &ldquo;
            </span>
            <p className="font-display text-[clamp(1.85rem,4.4vw,3.6rem)] font-medium italic leading-[1.12] tracking-[-0.01em] text-[var(--text-primary)] text-balance sm:max-w-5xl">
              A fan-made index, built for deep dives: credits you can browse, and a floor where fans leave notes worth keeping.
            </p>
            <div className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[0.66rem] uppercase tracking-[0.42em] text-[var(--text-muted)]">
              <span className="text-[var(--accent-gold)]">SoapyFans Hub</span>
              <span className="h-px w-12 bg-[var(--border-strong)]" />
              <span>Credits via TMDB</span>
              <span className="h-px w-12 bg-[var(--border-strong)]" />
              <span>Reviews by fans</span>
            </div>
          </div>
        </Reveal>
      </section>

      {tv.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 pb-32 sm:px-10">
          <div className="mb-14 grid grid-cols-12 items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
            <div className="col-span-12 lg:col-span-9">
              <p className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.55em] text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-forest)]" />
                Small screen · recent credits
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.025em] text-[var(--text-primary)]">
                TV <span className="italic text-[var(--accent-gold)]">work</span>.
              </h2>
            </div>
            <div className="col-span-12 flex items-center justify-between gap-6 lg:col-span-3 lg:justify-end">
              <Link
                href="/films#television"
                className="group inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)]"
              >
                Full TV index
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {tvFeatured && (
            <Reveal
              selector="[data-film-card]"
              stagger={0.08}
              y={48}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
            >
              <div
                data-film-card
                className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
              >
                <FilmCard credit={tvFeatured} featured />
              </div>
              {tvRest.map((c) => (
                <div key={`tv-${c.id}`} data-film-card>
                  <FilmCard credit={c} />
                </div>
              ))}
            </Reveal>
          )}
        </section>
      )}

      <section className="relative mx-auto max-w-7xl px-6 pb-28 sm:px-10">
        <Reveal stagger={0.12} y={36}>
          <div className="grid grid-cols-1 gap-10 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-10 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                The person behind the work
              </p>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] font-medium leading-[0.98] tracking-[-0.02em] text-[var(--text-primary)] text-balance">
                A closer portrait of Sophie — beyond the roles.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-[1.75] text-[var(--text-secondary)] text-pretty">
                Family roots in Chicago and Evanston, a Mormon upbringing she left young, and the small rituals that shape her days in Los Angeles.
              </p>
              <Link
                href="/about"
                className="group mt-8 inline-flex items-center gap-3 rounded-full border border-[var(--border-strong)] px-7 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
              >
                Read more
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-[var(--border-subtle)]">
              {aboutPortrait ? (
                <Image
                  src={aboutPortrait}
                  alt="Sophie Thatcher"
                  width={640}
                  height={820}
                  className="h-full w-full object-cover [filter:grayscale(0.15)_contrast(1.05)_brightness(0.9)]"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center bg-[var(--bg-card)] text-sm italic text-[var(--text-muted)]">
                  Portrait unavailable
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(8,7,4,0.6)] via-transparent to-transparent" />
            </div>
          </div>
        </Reveal>
      </section>

      <Suspense fallback={<MusicSkeleton />}>
        <MusicSection />
      </Suspense>

      <section className="relative border-t border-[var(--border-subtle)] bg-gradient-to-b from-transparent to-[rgba(42,92,63,0.08)]">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center sm:px-10">
          <Reveal stagger={0.14}>
            <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
              The floor
            </p>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-[var(--text-primary)] text-balance">
              Leave a note worth <span className="italic text-[var(--accent-gold)]">keeping</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.7] text-[var(--text-secondary)] text-pretty">
              Sign in to add your rating and a few lines. The archive grows one sentence at a time.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {!user && (
                <Link
                  href="/login"
                  className="rounded-full bg-[var(--accent-amber)] px-7 py-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_40px_rgba(255,183,0,0.45)]"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/films"
                className="rounded-full border border-[var(--border-strong)] px-7 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
              >
                Browse the index
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
