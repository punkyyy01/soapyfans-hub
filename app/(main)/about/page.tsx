import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  getPersonImages,
  getTmdbImageUrl,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, serializeJsonLd } from '@/utils/schema'
import Reveal from '@/app/components/Reveal'
import PhotoGallery from '@/app/components/PhotoGallery'

// ── Constants ────────────────────────────────────────────────

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
    category: 'Theatre',
    title: 'Stage roots',
    description:
      'Oliver!, Seussical, The Diary of Anne Frank, The Secret Garden. Craft built before cameras.',
  },
  {
    year: '2018',
    category: 'Film debut',
    title: 'Prospect',
    description:
      'Co-starring opposite Pedro Pascal. Premiered at SXSW, 89% on Rotten Tomatoes.',
  },
  {
    year: '2019',
    category: 'Television',
    title: 'Chicago P.D.',
    description:
      'Recurring work that sharpened screen instincts before the breakthrough.',
  },
  {
    year: '2021–Present',
    category: 'Series',
    title: 'Yellowjackets',
    description:
      '29 episodes as Teen Natalie Scatorccio. A generation-defining performance.',
    tag: 'Breakthrough',
  },
  {
    year: '2024',
    category: 'Feature',
    title: 'Heretic',
    description:
      'Opposite Hugh Grant. Psychological territory that expanded her dramatic range.',
  },
  {
    year: '2025',
    category: 'Landmark',
    title: 'Companion',
    description:
      "A blank slate, deliberately chosen. Critics' Choice Super Award followed.",
  },
]

interface RecognitionEntry {
  year: string
  title: string
  note: string
  type: string
}

const RECOGNITION: RecognitionEntry[] = [
  { year: '2025', title: "Critics' Choice Super Award", note: 'For Companion', type: 'Award' },
  { year: '2022', title: 'Vogue', note: 'September profile', type: 'Press' },
  { year: '2024', title: 'Vanity Fair', note: '"All the Rage"', type: 'Press' },
  { year: '2025', title: "Harper's Bazaar", note: 'Possibility Issue', type: 'Press' },
  { year: '2025', title: 'Dazed', note: 'Cover & interview, March', type: 'Press' },
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

  const sortedProfiles = imagesData.profiles
    .filter((p) => p.aspect_ratio <= 0.74)
    .sort((a, b) => {
      const ratioDiff = a.aspect_ratio - b.aspect_ratio
      if (Math.abs(ratioDiff) > 0.05) return ratioDiff
      return b.vote_average - a.vote_average
    })

  const portraitUrls = sortedProfiles
    .slice(0, 8)
    .map((p) => getTmdbImageUrl(p.file_path, 'w780'))
    .filter((u): u is string => u !== null)

  const galleryPhotos = sortedProfiles
    .slice(0, 12)
    .map((p) => ({
      src: getTmdbImageUrl(p.file_path, 'w500') ?? '',
      alt: 'Sophie Thatcher',
    }))
    .filter((p) => p.src !== '')

  // Different portrait indices for each section to vary visually
  const mastheadPortrait = portraitUrls[1] ?? portraitUrls[0] ?? null
  const bioPortrait = portraitUrls[2] ?? portraitUrls[1] ?? portraitUrls[0] ?? null

  const age = getAge()

  return (
    <main className="bg-[var(--bg-base)]">
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

      {/* ── 1. MASTHEAD ─────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden">
        {/* Portrait column — right 42%, full section height, desktop only */}
        {mastheadPortrait && (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] lg:block">
            <Image
              src={mastheadPortrait}
              alt=""
              fill
              priority
              sizes="42vw"
              className="object-cover object-[center_10%] [filter:grayscale(0.2)_contrast(1.05)_brightness(0.92)]"
            />
            {/* Amber color overlay — identical to Hero.tsx */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[rgba(232,137,12,0.32)] via-[rgba(232,137,12,0.05)] to-[rgba(42,92,63,0.18)] mix-blend-color"
            />
            {/* Left fade */}
            <span aria-hidden className="absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-[var(--bg-base)] to-transparent" />
            {/* Right fade */}
            <span aria-hidden className="absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-[var(--bg-base)] to-transparent" />
            {/* Top fade */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[25%] bg-gradient-to-b from-[var(--bg-base)] to-transparent" />
            {/* Bottom fade */}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />
            {/* Ring inset — same as Hero portrait */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[var(--accent-amber)]/15"
            />
          </div>
        )}

        {/* Text content — constrained so it doesn't overlap portrait on desktop */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 sm:py-24">
          <Reveal immediate stagger={0.12} y={28}>
            <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
              About
            </p>

            <h1 className="mt-6 font-display text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.025em] text-[var(--text-primary)] lg:max-w-[58%]">
              Sophie Bathsheba
              <br />
              Thatcher
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-[0.68rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
              <span>18 October 2000</span>
              <span className="h-px w-8 bg-[var(--border-strong)]" />
              <span>Chicago, Illinois</span>
              <span className="h-px w-8 bg-[var(--border-strong)]" />
              <span>{age} years</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-[var(--border-subtle)] pt-6 text-[0.68rem] uppercase tracking-[0.34em] text-[var(--text-muted)]">
              <a
                href="https://instagram.com/soapy.t"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent-amber)]"
              >
                <span>Instagram</span>
                <span className="text-[var(--text-secondary)]">@soapy.t</span>
              </a>
              <span className="h-px w-6 bg-[var(--border-subtle)]" />
              <a
                href="https://youtube.com/@SophieThatcher"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent-amber)]"
              >
                <span>YouTube</span>
                <span className="text-[var(--text-secondary)]">@SophieThatcher</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2. GALLERY ──────────────────────────────────── */}
      {galleryPhotos.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-10 sm:pb-28">
          <Reveal stagger={0.1} y={36}>
            <div className="mb-10 border-b border-[var(--border-subtle)] pb-8">
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                Images
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.025em] text-[var(--text-primary)]">
                A portrait in <span className="italic text-[var(--accent-gold)]">stills</span>.
              </h2>
            </div>

            <PhotoGallery photos={galleryPhotos} />
          </Reveal>
        </section>
      )}

      {/* ── 3. THE PERSON ───────────────────────────────── */}
      {/* Full-bleed: section has no max-w constraint; image fills it */}
      <section className="relative overflow-hidden py-32 sm:py-40">
        {bioPortrait && (
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={bioPortrait}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[center_20%] [filter:grayscale(0.3)_brightness(0.25)]"
            />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'rgba(8,7,4,0.75)' }}
            />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-[680px] px-6 sm:px-10">
          <Reveal stagger={0.1} y={36}>
            <div className="mb-12 text-center">
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                The person
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.025em] text-[var(--text-primary)]">
                Beyond the <span className="italic text-[var(--accent-gold)]">roles</span>.
              </h2>
            </div>

            <div className="space-y-5 text-base leading-[1.85] text-[var(--text-secondary)] text-pretty">
              <p>
                Born in Chicago and raised in Evanston, Sophie Thatcher grew up inside a family
                that was constantly making things. Her mother is a pianist and piano teacher; her
                sister Emma is a filmmaker who directed Provo (2022), where Sophie served as an
                executive producer; her brother Alexander writes; and her identical twin Ellie is a
                visual artist.
              </p>
              <p>
                She was raised Mormon, a faith she left in her early teens — that history made her
                role as Sister Barnes in Heretic feel personal. As she put it: &ldquo;It was hard
                growing up Mormon. I don&rsquo;t think it&rsquo;s evil, I just don&rsquo;t think
                it&rsquo;s right for me.&rdquo;
              </p>
              <p>
                Today she lives in Los Angeles, tucked into a discreet canyon, balancing screen
                work with music and the small rituals that keep her grounded.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 4. THE CAREER ───────────────────────────────── */}
      <section className="relative border-y border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 sm:px-10 sm:pb-28">
          <Reveal stagger={0.08} y={36}>
            <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                The career
              </p>
              <h2 className="mt-4 font-display text-[clamp(1.8rem,3.2vw,2.8rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]">
                A timeline with <span className="italic text-[var(--accent-gold)]">weight</span>.
              </h2>
            </div>

            <div>
              {TIMELINE.map((item, i) => {
                const isYellowjackets = item.title === 'Yellowjackets'
                return (
                  <div
                    key={item.title}
                    className={`grid grid-cols-1 gap-y-3 border-b border-[var(--border-subtle)] py-8 sm:grid-cols-[120px_1fr] sm:gap-x-10 ${
                      i === 0 ? 'border-t' : ''
                    } ${isYellowjackets ? 'border-l-2 pl-4 sm:pl-4' : ''}`}
                    style={
                      isYellowjackets
                        ? {
                            background: 'rgba(232,137,12,0.06)',
                            borderLeftColor: '#e8890c',
                          }
                        : undefined
                    }
                  >
                    {/* Left: year + category */}
                    <div className="flex items-baseline gap-3 sm:block sm:pt-1">
                      <p className="font-mono text-sm text-[var(--accent-amber)]">{item.year}</p>
                      <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[var(--text-muted)] sm:mt-1.5">
                        {item.category}
                      </p>
                    </div>

                    {/* Right: title + description */}
                    <div className="sm:border-l sm:border-[var(--border-subtle)] sm:pl-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl italic text-[var(--text-primary)]">
                          {item.title}
                        </h3>
                        {item.tag && (
                          <span className="rounded-full bg-[var(--accent-amber)] px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.22em] text-[var(--bg-base)]">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-[1.8] text-[var(--text-secondary)]">
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

      {/* ── 5. RECOGNITION ──────────────────────────────── */}
      <section className="relative border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 sm:px-10 sm:pb-28">
          <Reveal stagger={0.08} y={36}>
            <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                Recognition
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.025em] text-[var(--text-primary)]">
                The work, <span className="italic text-[var(--accent-gold)]">noticed</span>.
              </h2>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {RECOGNITION.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="flex items-baseline gap-4 py-5 transition-colors duration-200 hover:bg-[var(--bg-elevated)] sm:gap-8"
                >
                  <span className="w-10 shrink-0 font-mono text-sm tabular-nums text-[var(--accent-amber)]">
                    {item.year}
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="font-display text-[1.5rem] italic leading-none text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <span className="ml-3 hidden text-sm text-[var(--text-muted)] sm:inline">
                      &mdash; {item.note}
                    </span>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)] sm:hidden">{item.note}</p>
                  </div>

                  <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-[0.35em] text-[var(--text-muted)]">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-8">
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[var(--text-muted)]">
                Explore more
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/films"
                  className="rounded-full border border-[var(--border-strong)] px-7 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
                >
                  Films
                </Link>
                <Link
                  href="/music"
                  className="rounded-full bg-[var(--accent-amber)] px-7 py-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_40px_rgba(255,183,0,0.45)]"
                >
                  Music
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
