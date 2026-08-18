import type { Metadata } from 'next'
import Image from 'next/image'
import {
  getPersonImages,
  getTmdbImageUrl,
  getPortraitUrls,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, serializeJsonLd } from '@/utils/schema'
import Reveal from '@/components/ui/Reveal'
import PhotoGallery from '@/components/media/PhotoGallery'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

// ── Constants ────────────────────────────────────────────────

export const revalidate = 3600

const ABOUT_DESCRIPTION =
  "An editorial profile of Sophie Thatcher — her Chicago roots, family of artists, and the career that made her one of her generation's most compelling performers."

interface TimelineEntry {
  year: string
  category: string
  title: string
  description: string
  tag?: string
}

const TIMELINE: TimelineEntry[] = [
  {
    year: 'Age 11',
    category: 'Stage Roots',
    title: 'Chicago Theatrical Beginnings',
    description:
      'Formative classical training in Oliver!, Seussical, The Diary of Anne Frank, and The Secret Garden. Craft built before cameras.',
  },
  {
    year: '2018',
    category: 'Film Debut',
    title: 'Prospect',
    description:
      'Leading screen debut opposite Pedro Pascal. Premiered at SXSW to critical acclaim and established her distinct screen presence.',
  },
  {
    year: '2019',
    category: 'Television',
    title: 'Chicago P.D.',
    description:
      'Formative television work that sharpened screen instincts before entering major series television.',
  },
  {
    year: '2021–Present',
    category: 'Television Series',
    title: 'Yellowjackets',
    description:
      '29 episodes as Teen Natalie Scatorccio. A generation-defining performance anchoring the critically acclaimed Showtime drama.',
    tag: 'Breakthrough',
  },
  {
    year: '2024',
    category: 'Feature Film',
    title: 'Heretic',
    description:
      'Psychological horror opposite Hugh Grant for A24. Expanded her dramatic range with a nuanced portrayal of faith, intellect, and resilience.',
  },
  {
    year: '2025',
    category: 'Feature Film',
    title: 'Companion',
    description:
      "A subversive performance chosen for its sharp conceptual complexity, followed by a Critics' Choice Super Award honor.",
  },
]

interface RecognitionEntry {
  year: string
  title: string
  note: string
  type: string
}

const RECOGNITION: RecognitionEntry[] = [
  { year: '2025', title: "Critics' Choice Super Award", note: 'For Companion (Science Fiction / Horror)', type: 'Award' },
  { year: '2025', title: 'Dazed', note: 'Cover Story & Interview (March 2025)', type: 'Press' },
  { year: '2025', title: "Harper's Bazaar", note: 'The Possibility Issue', type: 'Press' },
  { year: '2024', title: 'Vanity Fair', note: '"All the Rage" Feature', type: 'Press' },
  { year: '2022', title: 'Vogue', note: 'September Profile & Editorial', type: 'Press' },
]

// ── Helpers ──────────────────────────────────────────────────

function getAge(): number {
  const dob = new Date('2000-10-18')
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

// ── Metadata ─────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'About — Sophie Thatcher',
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About — Sophie Thatcher',
    description: ABOUT_DESCRIPTION,
    url: '/about',
    type: 'website',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'About — Sophie Thatcher',
      },
    ],
  },
  twitter: {
    title: 'About — Sophie Thatcher',
    description: ABOUT_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

// ── Page ─────────────────────────────────────────────────────

export default async function AboutPage() {
  const imagesData = await getPersonImages().catch(
    (): TmdbPersonImages => ({ id: 0, profiles: [] }),
  )

  const portraitUrls = getPortraitUrls(imagesData.profiles)

  const sortedProfiles = imagesData.profiles
    .filter((p) => p.aspect_ratio <= 0.74)
    .sort((a, b) => {
      const ratioDiff = a.aspect_ratio - b.aspect_ratio
      if (Math.abs(ratioDiff) > 0.05) return ratioDiff
      return b.vote_average - a.vote_average
    })

  const galleryPhotos = sortedProfiles
    .slice(0, 12)
    .map((p) => ({
      src: getTmdbImageUrl(p.file_path, 'w500') ?? '',
      alt: 'Sophie Thatcher archival still',
    }))
    .filter((p) => p.src !== '')

  const mastheadPortrait = portraitUrls[1] ?? portraitUrls[0] ?? null
  const bioPortrait = portraitUrls[2] ?? portraitUrls[1] ?? portraitUrls[0] ?? null
  const age = getAge()

  return (
    <main className="bg-[var(--bg-base)]">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildWebPageSchema({
              name: 'About — Sophie Thatcher',
              description: ABOUT_DESCRIPTION,
              path: '/about',
            }),
          ),
        }}
      />

      {/* ── 1. MASTHEAD (Portrait First / Person First) ──────── */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden border-b border-[var(--border-subtle)] pt-16">
        {/* Right Portrait Canvas — full height blend desktop */}
        {mastheadPortrait && (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] lg:block">
            <Image
              src={mastheadPortrait}
              alt="Sophie Thatcher"
              fill
              priority
              sizes="44vw"
              className="object-cover object-[center_10%] [filter:grayscale(0.15)_contrast(1.04)_brightness(0.95)]"
            />
            {/* Amber tone overlay */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[rgba(232,137,12,0.18)] via-transparent to-[rgba(8,7,4,0.2)] mix-blend-color"
            />
            {/* Left blend */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-[var(--bg-base)] via-[var(--bg-base)]/70 to-transparent"
            />
            {/* Top blend */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--bg-base)] to-transparent"
            />
            {/* Bottom blend */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[var(--bg-base)] to-transparent"
            />
          </div>
        )}

        {/* Text Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 sm:py-24">
          <Reveal immediate stagger={0.08} y={24} className="lg:max-w-[58%]">
            {/* Mobile Portrait */}
            {mastheadPortrait && (
              <div className="relative mb-8 h-72 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] sm:h-80 lg:hidden">
                <Image
                  src={mastheadPortrait}
                  alt="Sophie Thatcher"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover object-[center_12%]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.6)] to-transparent"
                />
              </div>
            )}

            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
              Biographical Profile · The Archive
            </p>

            <h1 className="mt-5 font-display text-[clamp(3.2rem,8.5vw,7.5rem)] font-medium leading-[0.92] tracking-tight text-[var(--text-primary)]">
              Sophie Bathsheba
              <br />
              Thatcher
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
              Born in Chicago and raised in Evanston, Illinois. An actor, musician, and visual artist whose screen presence balances psychological stillness with raw dramatic weight.
            </p>

            {/* Documentary Metadata */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <span>Born <strong className="font-mono font-medium text-[var(--text-primary)]">18 October 2000</strong></span>
              <span className="text-[var(--border-strong)]">/</span>
              <span>Origin <strong className="font-mono font-medium text-[var(--text-primary)]">Chicago, Illinois</strong></span>
              <span className="text-[var(--border-strong)]">/</span>
              <span>Age <strong className="font-mono font-medium text-[var(--text-primary)]">{age} years</strong></span>
            </div>

            {/* Verified External Links */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border-subtle)] pt-6 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <a
                href="https://instagram.com/soapy.t"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
              >
                <span>Instagram</span>
                <span className="text-[var(--text-secondary)]">@soapy.t ↗</span>
              </a>
              <span className="text-[var(--border-default)]">/</span>
              <a
                href="https://youtube.com/@SophieThatcher"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
              >
                <span>YouTube</span>
                <span className="text-[var(--text-secondary)]">@SophieThatcher ↗</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2. ARCHIVAL PHOTOGRAPHY (Portraits & Stills) ─────── */}
      {galleryPhotos.length > 0 && (
        <section id="gallery" className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
          <Reveal stagger={0.08} y={32}>
            <div className="mb-12 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                  Archival Stills
                </p>
                <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                  Portraits &amp; Photography
                </h2>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {galleryPhotos.length} archival plates
              </span>
            </div>

            <PhotoGallery photos={galleryPhotos} />
          </Reveal>
        </section>
      )}

      {/* ── 3. BIOGRAPHY (Beyond the Roles) ─────────────────── */}
      <section id="biography" className="relative overflow-hidden border-t border-[var(--border-subtle)] py-28 sm:py-36">
        {bioPortrait && (
          <div className="pointer-events-none absolute inset-0 -z-10">
            <Image
              src={bioPortrait}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[center_20%] [filter:grayscale(0.3)_brightness(0.22)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-[var(--bg-base)] via-[rgba(8,7,4,0.85)] to-[var(--bg-base)]"
            />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-[760px] px-6 sm:px-10">
          <Reveal stagger={0.08} y={24}>
            <div className="mb-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                Origins &amp; Craft
              </p>
              <h2 className="mt-3 font-display text-[clamp(2.4rem,5.5vw,4.2rem)] font-medium leading-[0.96] tracking-tight text-[var(--text-primary)]">
                Beyond the Roles
              </h2>
            </div>

            <div className="space-y-6 text-base leading-[1.9] text-[var(--text-secondary)] text-pretty sm:text-lg">
              <p className="font-display text-xl font-normal leading-relaxed text-[var(--text-primary)] sm:text-2xl">
                Born in Chicago and raised in Evanston, Sophie Thatcher grew up immersed in a creative household where artistic practice was woven into daily life.
              </p>
              <p>
                Her mother is a pianist and music educator; her sister Emma is an independent filmmaker whose feature <em>Provo</em> (2022) counted Sophie among its executive producers; her brother Alexander writes; and her identical twin Ellie works as a visual artist. This family environment nurtured a deep familiarity with discipline, craft, and independent creation.
              </p>
              <blockquote className="my-10 border-l-2 border-[var(--accent-amber)] pl-6 font-display text-xl sm:text-2xl italic leading-relaxed text-[var(--text-primary)]">
                &ldquo;It was hard growing up Mormon. I don’t think it’s evil, I just don’t think it’s right for me.&rdquo;
              </blockquote>
              <p>
                Raised in the LDS (Mormon) faith before departing in her early adolescence, Thatcher’s personal history informed her nuanced approach to complex spiritual themes — particularly her performance as Sister Barnes in Scott Beck and Bryan Woods’ <em>Heretic</em> (2024).
              </p>
              <p>
                Now based in Los Angeles, she balances prominent screen work across television and feature films with her independent music project and private studio artwork, maintaining an artistic identity that is textured, deliberate, and fiercely personal.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 4. THE CAREER (Chronology of Work) ──────────────── */}
      <section id="timeline" className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
          <Reveal stagger={0.08} y={32}>
            <div className="mb-14 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                  Career Milestones
                </p>
                <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                  A Timeline with Weight
                </h2>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                2011 — Present
              </span>
            </div>

            <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
              {TIMELINE.map((item) => {
                const isYellowjackets = item.title.includes('Yellowjackets')
                return (
                  <div
                    key={item.title}
                    className={`grid grid-cols-1 gap-y-3 py-8 sm:grid-cols-[140px_1fr] sm:gap-x-10 ${
                      isYellowjackets ? 'bg-[rgba(232,137,12,0.05)] -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-lg border-l-2 border-l-[var(--accent-amber)]' : ''
                    }`}
                  >
                    {/* Left: Year & Category */}
                    <div className="space-y-1 sm:pt-0.5">
                      <p className="font-mono text-sm font-medium text-[var(--accent-amber)]">
                        {item.year}
                      </p>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        {item.category}
                      </p>
                    </div>

                    {/* Right: Title & Description */}
                    <div className="space-y-2 sm:border-l sm:border-[var(--border-subtle)] sm:pl-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl font-medium text-[var(--text-primary)] sm:text-2xl">
                          {item.title}
                        </h3>
                        {item.tag && (
                          <Badge variant={isYellowjackets ? 'tv' : 'award'} size="sm">
                            {item.tag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 5. RECOGNITION (Critical Reception & Press) ─────── */}
      <section id="recognition" className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/40">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28">
          <Reveal stagger={0.08} y={32}>
            <div className="mb-14 border-b border-[var(--border-subtle)] pb-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                Critical Reception
              </p>
              <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                The Work, Noticed
              </h2>
            </div>

            <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
              {RECOGNITION.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="flex flex-col gap-2 py-5 transition-colors duration-200 hover:bg-[var(--bg-elevated)]/60 px-3 -mx-3 rounded sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="w-14 shrink-0 font-mono text-sm font-medium tabular-nums text-[var(--accent-amber)]">
                      {item.year}
                    </span>
                    <span className="font-display text-lg font-medium text-[var(--text-primary)] sm:text-xl">
                      {item.title}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      — {item.note}
                    </span>
                  </div>

                  <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--text-muted)] sm:self-center">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>

            {/* ── 6. ARCHIVE CLOSURE (Biographical Chapter Closure) ── */}
            <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--border-subtle)] pt-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Explore the Living Catalog
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button href="/films" variant="secondary" size="md">
                  Browse Filmography →
                </Button>
                <Button href="/music" variant="primary" size="md">
                  Music Archive →
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
