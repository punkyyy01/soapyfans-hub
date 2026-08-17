import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  getPersonImages,
  getPersonCombinedCredits,
  getTmdbImageUrl,
  normalizeCredit,
  sortByDateDesc,
  getPortraitUrls,
  type NormalizedCredit,
  type TmdbCombinedCredits,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, buildWebSiteSchema, serializeJsonLd } from '@/utils/schema'
import Hero from '@/components/ui/Hero'
import Reveal from '@/components/ui/Reveal'
import FilmCard from '@/components/media/FilmCard'
import MusicSection from '@/components/forms/MusicSection'

export const revalidate = 3600

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
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
  const creditsPromise = getPersonCombinedCredits()
    .catch((): TmdbCombinedCredits => { return { id: 0, cast: [], crew: [] } })

  const portraitPromise = getPersonImages()
    .catch((): TmdbPersonImages => { return { id: 0, profiles: [] } })

  const [credits, imagesData] = await Promise.all([
    creditsPromise,
    portraitPromise,
  ])

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

  const portraitUrls = getPortraitUrls(imagesData.profiles)

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

      {/* ── ABOUT SOAPYFANS HUB & PURPOSE ────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-28 sm:px-10">
        <Reveal stagger={0.12} y={32}>
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)]/40 to-[var(--bg-elevated)]/10 p-8 sm:p-12">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)] font-medium">
                About SoapyFans Hub · Application Purpose
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] font-medium leading-[1.02] tracking-[-0.02em] text-[var(--text-primary)] text-balance">
                What is <span className="italic text-[var(--accent-gold)]">SoapyFans Hub</span>?
              </h2>
              <p className="mt-5 text-base leading-[1.8] text-[var(--text-secondary)] text-pretty">
                <strong className="font-semibold text-[var(--text-primary)]">SoapyFans Hub</strong> is an unofficial, community-driven fan archive dedicated to archiving, organizing, and discussing the career of actress and musician <strong className="font-semibold text-[var(--text-primary)]">Sophie Thatcher</strong>.
              </p>
              <p className="mt-3 text-base leading-[1.8] text-[var(--text-secondary)] text-pretty">
                Our application gathers comprehensive film and television credits, original music releases, press appearances, and community reviews in a single, accessible hub. Visitors can explore the public archive freely without an account, or sign in using <strong className="font-semibold text-[var(--text-primary)]">Google OAuth</strong> or Discord to rate titles and publish their own reviews.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-6 backdrop-blur transition-colors hover:border-[var(--accent-amber)]/40">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-amber)]/10 text-[var(--accent-gold)] font-display text-lg">
                  🎬
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Film &amp; TV Archive
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Full filmography and television credits powered by TMDB, covering breakout performances in <em>Yellowjackets</em>, <em>Heretic</em>, <em>Companion</em>, <em>Prospect</em>, and more.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-6 backdrop-blur transition-colors hover:border-[var(--accent-amber)]/40">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-amber)]/10 text-[var(--accent-gold)] font-display text-lg">
                  🎵
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Music &amp; Releases
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Discography database with tracklists, music videos, and streaming links for Sophie Thatcher&apos;s debut EP <em>Pivot &amp; Scrape</em>, singles, and soundtrack features.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 p-6 backdrop-blur transition-colors hover:border-[var(--accent-amber)]/40">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-amber)]/10 text-[var(--accent-gold)] font-display text-lg">
                  ⭐
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Fan Reviews &amp; Ratings
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Sign in securely with Google to create a fan profile, leave star ratings, write reviews, and contribute to the community collection.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)]">
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-forest)]" />
                <span>Unofficial fan project · Not affiliated with or endorsed by Sophie Thatcher.</span>
              </p>
              <div className="flex items-center gap-4 text-[0.68rem] uppercase tracking-[0.24em]">
                <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                <span className="text-[var(--border-strong)]">·</span>
                <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] underline-offset-4 hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

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
              <span className="text-[var(--accent-gold)] font-medium">SoapyFans Hub</span>
              <span className="h-px w-12 bg-[var(--border-strong)]" />
              <span>Sophie Thatcher Archive</span>
              <span className="h-px w-12 bg-[var(--border-strong)]" />
              <span>Credits via TMDB</span>
              <span className="h-px w-12 bg-[var(--border-strong)]" />
              <span>Fan Reviews</span>
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
            <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)] font-medium">
              Join the SoapyFans Hub community
            </p>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-[var(--text-primary)] text-balance">
              Leave a note worth <span className="italic text-[var(--accent-gold)]">keeping</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.7] text-[var(--text-secondary)] text-pretty">
              Sign in with your Google or Discord account to add star ratings and share reviews across filmography and music releases in the archive.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-full bg-[var(--accent-amber)] px-7 py-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_40px_rgba(255,183,0,0.45)]"
              >
                Sign in with Google
              </Link>
              <Link
                href="/films"
                className="rounded-full border border-[var(--border-strong)] px-7 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
              >
                Browse the archive
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
