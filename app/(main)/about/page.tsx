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
import PhotoGallery from '@/components/media/PhotoGallery'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

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
      'Early stage performances in Oliver!, Seussical, The Diary of Anne Frank, and The Secret Garden. Classical craft built before cameras.',
  },
  {
    year: '2018',
    category: 'Film Debut',
    title: 'Prospect',
    description:
      'Leading screen debut opposite Pedro Pascal. Premiered at SXSW to critical acclaim and established her screen presence.',
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
      'Psychological horror opposite Hugh Grant for A24. Expanded her dramatic range with a nuanced portrayal of faith and resilience.',
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

function getAge(): number {
  const dob = new Date('2000-10-18')
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

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
      alt: 'Sophie Thatcher archival portrait',
    }))
    .filter((p) => p.src !== '')

  const mastheadPortrait = portraitUrls[1] ?? portraitUrls[0] ?? null
  const age = getAge()

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-24 sm:pt-28">
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

      <PageContainer size="default">
        {/* ── 01 — Editorial Masthead Header ──────────────────── */}
        <header className="mb-20 border-b border-[var(--border-subtle)] pb-12 sm:mb-24 sm:pb-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end lg:gap-14">
            <div className="space-y-6">
              <p className="text-eyebrow">
                Biographical Profile · The Archive
              </p>

              <h1 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[0.94] tracking-tight text-[var(--text-primary)]">
                Sophie Bathsheba
                <br />
                Thatcher
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                Born in Chicago and raised in Evanston, Illinois. An actor, musician, and visual artist whose performances balance psychological stillness with raw dramatic weight.
              </p>

              {/* Documentary Metadata */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-metadata">
                <span>
                  Born <strong className="font-medium text-[var(--text-primary)]">18 October 2000</strong>
                </span>
                <span>
                  Origin <strong className="font-medium text-[var(--text-primary)]">Chicago, Illinois</strong>
                </span>
                <span>
                  Age <strong className="font-medium text-[var(--text-primary)]">{age} years</strong>
                </span>
              </div>

              {/* Official Social Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://instagram.com/soapy.t"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-ring"
                >
                  <span>Instagram</span>
                  <span className="text-[var(--text-muted)]">@soapy.t ↗</span>
                </a>
                <a
                  href="https://youtube.com/@SophieThatcher"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-ring"
                >
                  <span>YouTube</span>
                  <span className="text-[var(--text-muted)]">@SophieThatcher ↗</span>
                </a>
              </div>
            </div>

            {/* Masthead Portrait Frame */}
            {mastheadPortrait && (
              <div className="relative aspect-[3/4] w-full max-w-[340px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-xl lg:max-w-none">
                <Image
                  src={mastheadPortrait}
                  alt="Sophie Thatcher"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover object-[center_15%]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/40 via-transparent to-transparent"
                />
              </div>
            )}
          </div>
        </header>

        <div className="space-y-24 pb-32">
          {/* ── 02 — Portrait Gallery ─────────────────────────── */}
          {galleryPhotos.length > 0 && (
            <section id="gallery" className="scroll-mt-28 space-y-8">
              <SectionHeader
                kicker="Archival Photography"
                title="Portraits &amp; Stills"
                action={
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {galleryPhotos.length} archival stills
                  </span>
                }
              />

              <PhotoGallery photos={galleryPhotos} />
            </section>
          )}

          {/* ── 03 — Biography / Roots & Context ──────────────── */}
          <section id="biography" className="scroll-mt-28 space-y-8">
            <SectionHeader
              kicker="Origins &amp; Craft"
              title="Beyond the Screen"
            />

            <div className="border-t border-b border-[var(--border-subtle)] py-10 sm:py-14">
              <div className="max-w-3xl space-y-6 text-base leading-[1.85] text-[var(--text-secondary)] text-pretty sm:text-lg">
                <p className="font-display text-xl font-normal text-[var(--text-primary)] sm:text-2xl leading-relaxed">
                  Born in Chicago and raised in Evanston, Sophie Thatcher grew up immersed in a creative household where artistic practice was woven into daily life.
                </p>
                <p>
                  Her mother is a pianist and music educator; her sister Emma is an independent filmmaker whose feature <em>Provo</em> (2022) counted Sophie among its executive producers; her brother Alexander writes; and her identical twin Ellie works as a visual artist. This family environment nurtured a deep familiarity with discipline, craft, and independent creation.
                </p>
                <blockquote className="my-8 border-l-2 border-[var(--accent-amber)] pl-6 italic text-[var(--text-primary)]">
                  &ldquo;It was hard growing up Mormon. I don’t think it’s evil, I just don’t think it’s right for me.&rdquo;
                </blockquote>
                <p>
                  Raised in the LDS (Mormon) faith before departing in her early adolescence, Thatcher’s personal history informed her nuanced approach to complex spiritual themes — particularly her performance as Sister Barnes in Scott Beck and Bryan Woods’ <em>Heretic</em> (2024).
                </p>
                <p>
                  Now based in Los Angeles, she balances prominent screen work across television and feature films with her independent music project and private studio artwork, maintaining an artistic identity that is textured, deliberate, and fiercely personal.
                </p>
              </div>
            </div>
          </section>

          {/* ── 04 — Career Timeline ──────────────────────────── */}
          <section id="timeline" className="scroll-mt-28 space-y-8">
            <SectionHeader
              kicker="Career Milestones"
              title="Chronology of Work"
              action={
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  2011 — Present
                </span>
              }
            />

            <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
              {TIMELINE.map((item) => {
                const isYellowjackets = item.title.includes('Yellowjackets')
                return (
                  <div
                    key={item.title}
                    className="grid grid-cols-1 gap-y-3 py-6 sm:grid-cols-[140px_1fr] sm:gap-x-10 sm:py-8"
                  >
                    {/* Left: Year & Category */}
                    <div className="space-y-1 sm:pt-0.5">
                      <p className="font-mono text-sm font-medium text-[var(--text-primary)]">
                        {item.year}
                      </p>
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        {item.category}
                      </p>
                    </div>

                    {/* Right: Title & Description */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                          {item.title}
                        </h3>
                        {item.tag && (
                          <Badge variant={isYellowjackets ? 'tv' : 'award'} size="sm">
                            {item.tag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── 05 — Recognition / Select Press ───────────────── */}
          <section id="recognition" className="scroll-mt-28 space-y-8">
            <SectionHeader
              kicker="Critical Reception &amp; Press"
              title="Recognition"
            />

            <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
              {RECOGNITION.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:py-5"
                >
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="w-12 shrink-0 font-mono text-xs text-[var(--text-muted)]">
                      {item.year}
                    </span>
                    <span className="font-display text-lg font-medium text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      · {item.note}
                    </span>
                  </div>

                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)] sm:self-center">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 06 — Explore the Archive (Closure) ────────────── */}
          <section className="border-t border-[var(--border-subtle)] pt-12 text-center space-y-4">
            <p className="text-eyebrow">
              The Living Catalog
            </p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Explore the Archive
            </h2>
            <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)] text-pretty">
              Browse cataloged screen credits, technical details, and original music releases across the archive.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-3">
              <Button href="/films" variant="primary" size="md">
                Browse Filmography →
              </Button>
              <Button href="/music" variant="secondary" size="md">
                Explore Music Archive →
              </Button>
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  )
}

