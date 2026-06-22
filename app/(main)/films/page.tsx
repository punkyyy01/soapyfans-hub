import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  getPersonCombinedCredits,
  getTmdbImageUrl,
  normalizeCredit,
  sortByDateDesc,
  type NormalizedCredit,
} from '@/utils/tmdb'
import { getSophieWikidataCredits } from '@/utils/wikidata'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildCollectionPageSchema, serializeJsonLd } from '@/utils/schema'
import FilmCard from '@/components/media/FilmCard'
import Reveal from '@/components/ui/Reveal'

const FILMOGRAPHY_DESCRIPTION =
  "Sophie Thatcher's complete filmography and TV credits — films, series, and other on-screen work, sorted by release date. A fan-made index, unofficial and not affiliated with Sophie Thatcher."

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Filmography',
  description: FILMOGRAPHY_DESCRIPTION,
  alternates: { canonical: '/films' },
  openGraph: {
    title: 'Filmography · Sophie Thatcher',
    description: FILMOGRAPHY_DESCRIPTION,
    url: '/films',
    type: 'website',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'Filmography · Sophie Thatcher',
      },
    ],
  },
  twitter: {
    title: 'Filmography · Sophie Thatcher',
    description: FILMOGRAPHY_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

function FeaturedFilmCard({ credit }: { credit: NormalizedCredit }) {
  const href = `/${credit.mediaType === 'tv' ? 'tv' : 'films'}/${credit.id}`
  const backdropSrc = getTmdbImageUrl(credit.backdropPath, 'w1280')
    ?? getTmdbImageUrl(credit.posterPath, 'w780')
  const character = credit.character?.trim()

  return (
    <Link href={href} className="group relative mb-14 block">
      <div className="relative h-[52vh] min-h-[320px] overflow-hidden rounded-xl ring-1 ring-[var(--border-subtle)]">
        {backdropSrc && (
          <Image
            src={backdropSrc}
            alt={credit.title}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[center_22%] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.4)] to-[rgba(8,7,4,0.1)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.2)] to-transparent" />
        <div className="absolute left-5 top-5 rounded-full border border-[var(--accent-amber)]/40 bg-[var(--bg-base)]/60 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--accent-amber)] backdrop-blur-sm">
          Most recent · {credit.year ?? '—'}
        </div>
        <div className="absolute inset-x-6 bottom-8 sm:inset-x-10">
          <p className="text-[0.62rem] uppercase tracking-[0.45em] text-[var(--accent-amber)]">Film</p>
          <h3 className="mt-2 font-display text-[clamp(1.8rem,4.5vw,3.6rem)] font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)]">
            {credit.title}
          </h3>
          {character && (
            <p className="mt-3 font-display text-base italic text-[var(--text-secondary)]">
              as {character}
            </p>
          )}
          <span className="mt-5 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.32em] text-[var(--accent-gold)] transition-all group-hover:gap-3">
            Read more <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-[var(--accent-amber)] to-transparent opacity-0 transition-all duration-700 group-hover:scale-x-100 group-hover:opacity-100" />
      </div>
    </Link>
  )
}

function yearSpan(credits: NormalizedCredit[]): string | null {
  const years = credits
    .map((c) => Number(c.year))
    .filter((n) => Number.isFinite(n))
  if (years.length === 0) return null
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? `${min}` : `${min} — ${max}`
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default async function FilmsPage() {
  const [creditsResult, wikidataResult] = await Promise.allSettled([
    getPersonCombinedCredits(),
    getSophieWikidataCredits(),
  ])

  const credits =
    creditsResult.status === 'fulfilled'
      ? creditsResult.value
      : { id: 0, cast: [], crew: [] }

  const wikidataCredits =
    wikidataResult.status === 'fulfilled' ? wikidataResult.value : []

  const seen = new Set<string>()
  const all: NormalizedCredit[] = []
  for (const c of credits.cast) {
    const key = `${c.media_type}:${c.id}`
    if (seen.has(key)) continue
    seen.add(key)
    all.push(normalizeCredit(c))
  }

  const films = all
    .filter((c) => c.mediaType === 'movie' && c.date)
    .sort(sortByDateDesc)

  const tv = all
    .filter((c) => c.mediaType === 'tv' && c.date)
    .sort(sortByDateDesc)

  const undatedFilms = all.filter((c) => c.mediaType === 'movie' && !c.date)
  const undatedTv = all.filter((c) => c.mediaType === 'tv' && !c.date)

  const filmList = [...films, ...undatedFilms]
  const tvList = [...tv, ...undatedTv]

  const tmdbTitles = new Set(all.map((c) => normalizeTitle(c.title)))
  const beyondCredits = wikidataCredits.filter(
    (c) => !tmdbTitles.has(normalizeTitle(c.title))
  )

  return (
    <main className="relative bg-[var(--bg-base)] pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildCollectionPageSchema({
              name: 'Filmography · Sophie Thatcher',
              description: FILMOGRAPHY_DESCRIPTION,
              path: '/films',
            }),
          ),
        }}
      />
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <header className="mb-20 border-b border-[var(--border-subtle)] pb-10">
          <Reveal immediate stagger={0.1} y={24}>
            <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
              The Index
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)] sm:text-6xl">
              Filmography
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              A clean list of credits, deduped and sorted by release date. Film pages also have a fan floor for reviews.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-3 text-xs uppercase tracking-[0.32em] text-[var(--text-muted)]">
              <span>
                <span className="text-[var(--text-secondary)]">
                  {filmList.length.toString().padStart(2, '0')}
                </span>{' '}
                films
              </span>
              <span>
                <span className="text-[var(--text-secondary)]">
                  {tvList.length.toString().padStart(2, '0')}
                </span>{' '}
                tv credits
              </span>
              {beyondCredits.length > 0 && (
                <span>
                  <span className="text-[var(--text-secondary)]">
                    {beyondCredits.length.toString().padStart(2, '0')}
                  </span>{' '}
                  beyond
                </span>
              )}
              {yearSpan(all) && (
                <span>
                  <span className="text-[var(--text-secondary)]">
                    {yearSpan(all)}
                  </span>{' '}
                  span
                </span>
              )}
              <span className="hidden sm:inline">
                Order ·{' '}
                <span className="text-[var(--accent-gold)]">most recent first</span>
              </span>
            </div>
            <nav className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.7rem] uppercase tracking-[0.28em]">
              <a
                href="#films"
                className="text-[var(--text-secondary)] underline-offset-8 transition-colors hover:text-[var(--accent-gold)] hover:underline"
              >
                ↓ Films
              </a>
              <span className="text-[var(--border-strong)]">·</span>
              <a
                href="#television"
                className="text-[var(--text-secondary)] underline-offset-8 transition-colors hover:text-[var(--accent-gold)] hover:underline"
              >
                ↓ Television
              </a>
              {beyondCredits.length > 0 && (
                <>
                  <span className="text-[var(--border-strong)]">·</span>
                  <a
                    href="#beyond"
                    className="text-[var(--text-secondary)] underline-offset-8 transition-colors hover:text-[var(--accent-gold)] hover:underline"
                  >
                    ↓ Beyond the screen
                  </a>
                </>
              )}
            </nav>
          </Reveal>
        </header>

        <section id="films" className="scroll-mt-28">
          <div className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
                On the big screen
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Films
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
              {filmList.length.toString().padStart(2, '0')} titles
            </span>
          </div>

          {filmList.length > 0 ? (
            <>
              <FeaturedFilmCard credit={filmList[0]} />
              {filmList.length > 1 && (
                <Reveal
                  selector="[data-film-card]"
                  stagger={0.045}
                  y={36}
                  immediate
                  className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                >
                  {filmList.slice(1).map((c, i) => (
                    <div key={`movie-${c.id}`} data-film-card>
                      <FilmCard credit={c} priority={i < 4} />
                    </div>
                  ))}
                </Reveal>
              )}
            </>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">
              No film credits yet.
            </p>
          )}
        </section>

        <div className="relative my-16">
          <div className="relative border-y border-[var(--border-subtle)] py-12 text-center">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--bg-base)] px-6">
              <span className="text-[0.58rem] uppercase tracking-[0.5em] text-[var(--accent-forest)]">
                Yellowjackets · 2021–2024
              </span>
            </span>
            <p className="font-display text-[clamp(1.1rem,2.5vw,1.8rem)] font-medium italic leading-[1.2] tracking-tight text-[var(--text-primary)]">
              29 episodes as Natalie Scatorccio.
            </p>
            <p className="mt-2 font-display text-[clamp(0.9rem,2vw,1.4rem)] italic text-[var(--text-secondary)]">
              The role that changed everything.
            </p>
          </div>
        </div>

        <section id="television" className="mt-28 scroll-mt-28">
          <div className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <p className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.5em] text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-forest)]" />
                On the small screen
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Television
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
              {tvList.length.toString().padStart(2, '0')} series
            </span>
          </div>

          {tvList.length > 0 ? (
            <Reveal
              selector="[data-film-card]"
              stagger={0.045}
              y={36}
              immediate
              className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {tvList.map((c, i) => (
                <div key={`tv-${c.id}`} data-film-card>
                  <FilmCard credit={c} priority={i < 3} />
                </div>
              ))}
            </Reveal>
          ) : (
            <p className="text-sm italic text-[var(--text-muted)]">
              No TV credits yet.
            </p>
          )}
        </section>

        {beyondCredits.length > 0 && (
          <section id="beyond" className="mt-28 scroll-mt-28 pb-32">
            <div className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-gold)]">
                  Stage · Music · Production
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Beyond the screen
                </h2>
              </div>
              <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
                {beyondCredits.length.toString().padStart(2, '0')} credits
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {beyondCredits.map((c) => (
                <div
                  key={c.wikidataId}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 ring-1 ring-transparent transition-colors hover:border-[var(--accent-amber)]/40 hover:ring-[var(--accent-amber)]/10"
                >
                  <p className="font-display text-sm font-medium leading-snug text-[var(--text-primary)]">
                    {c.title}
                  </p>
                  <p className="mt-1.5 text-xs italic text-[var(--text-muted)]">
                    {c.character ? `as ${c.character}` : ' '}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">
                      {c.year ?? '—'}
                    </span>
                    {c.mediaType && (
                      <span className="rounded-full bg-[var(--bg-base)] px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.22em] text-[var(--accent-gold)] ring-1 ring-[var(--accent-amber)]/25">
                        {c.mediaType}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {beyondCredits.length === 0 && <div className="pb-32" />}
      </div>
    </main>
  )
}
