import type { Metadata } from 'next'
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
import Link from 'next/link'
import Hero from '@/components/ui/Hero'
import WorksSection from '@/components/media/WorksSection'
import MusicSection from '@/components/forms/MusicSection'
import PageContainer from '@/components/ui/PageContainer'

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
      <div className="mb-10 h-8 w-48 animate-pulse rounded bg-[var(--bg-elevated)]" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-[var(--bg-elevated)]/60" />
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const creditsPromise = getPersonCombinedCredits()
    .catch((): TmdbCombinedCredits => ({ id: 0, cast: [], crew: [] }))

  const portraitPromise = getPersonImages()
    .catch((): TmdbPersonImages => ({ id: 0, profiles: [] }))

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

  const films = dated.filter((c) => c.mediaType === 'movie')
  const tv = dated.filter((c) => c.mediaType === 'tv')

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
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

      {/* ── 01: Hero ────────────────────────────────────────── */}
      <Hero
        backdropUrl={backdropUrl}
        portraitUrls={portraitUrls}
        featuredTitle={heroCredit?.title ?? 'Sophie Thatcher'}
        featuredYear={heroCredit?.year ?? null}
        filmCount={all.length}
      />

      {/* ── 02: Works (Unified All / Films / TV Filter) ──────── */}
      {all.length > 0 && (
        <WorksSection
          allCredits={dated}
          filmCredits={films}
          tvCredits={tv}
        />
      )}

      {/* ── 03: Music Corner ─────────────────────────────────── */}
      <Suspense fallback={<MusicSkeleton />}>
        <MusicSection />
      </Suspense>

      {/* ── 04: Community Invitation ─────────────────────────── */}
      <section className="relative pb-24 sm:pb-32">
        <PageContainer size="default">
          <div className="border-t border-b border-[var(--border-subtle)] py-12 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-14">
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Community Archive
                </p>
                <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Leave a note worth keeping.
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
                  Sign in to rate titles across Sophie&apos;s filmography, write fan reviews, and personalize your own profile dossier with custom CSS and favorite picks.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent-amber)] px-6 py-2.5 text-xs uppercase tracking-[0.14em] font-medium text-[var(--text-inverse)] transition-all hover:bg-[var(--accent-amber-hover)] focus-ring"
                >
                  Join the community →
                </Link>
                <Link
                  href="/films"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-2.5 text-xs uppercase tracking-[0.14em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:bg-[var(--accent-amber-dim)] focus-ring"
                >
                  Browse full archive
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </main>
  )
}

