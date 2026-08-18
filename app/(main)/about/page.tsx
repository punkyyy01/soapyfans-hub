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
import Badge from '@/components/ui/Badge'

// ── Constants ────────────────────────────────────────────────

export const revalidate = 3600

const ABOUT_DESCRIPTION =
  "An editorial profile of Sophie Thatcher — her Chicago roots, family of artists, and the career that made her one of her generation's most compelling performers."

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

  const portraitUrls = getPortraitUrls(imagesData.profiles, 8, 'w780')
  const used = new Set<string>()
  function pick(...candidates: (string | null | undefined)[]): string | null {
    for (const c of candidates) {
      if (c && !used.has(c)) {
        used.add(c)
        return c
      }
    }
    return null
  }
  const imgOrigins = pick(portraitUrls[2], portraitUrls[0], portraitUrls[1])
  const imgMusic = pick(portraitUrls[5], portraitUrls[6], portraitUrls[3])
  const imgClosing = pick(portraitUrls[7], portraitUrls[4], portraitUrls[1])

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

      {/* ── 01. OPENING FRAGMENT ──────────────────────────────── */}
      <section className="relative border-b border-[var(--border-subtle)] pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="mx-auto w-full max-w-[720px] px-6 sm:px-10">
          <Reveal immediate stagger={0.06} y={16}>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
              Age Four · Hyde Park, Chicago
            </p>
            <p className="mt-4 max-w-lg font-display text-xl italic leading-relaxed text-[var(--text-secondary)] sm:text-2xl">
              A community-theatre production of <em>The Wizard of Oz</em>.
              She played a munchkin.
            </p>

            <div className="mt-14 border-t border-[var(--border-subtle)] pt-10 sm:mt-16">
              <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-medium leading-[0.98] tracking-tight text-[var(--text-primary)]">
                Sophie Bathsheba Thatcher
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
                Actor. Musician. Visual artist.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <span>
                  Born <span className="text-[var(--text-secondary)]">18 Oct 2000</span>
                </span>
                <span className="text-[var(--border-strong)]">/</span>
                <span className="text-[var(--text-secondary)]">Chicago, Illinois</span>
                <span className="text-[var(--border-strong)]">/</span>
                <span>
                  Age <span className="text-[var(--text-secondary)]">{age}</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 02. HYDE PARK → LAKE FOREST → EVANSTON ───────────── */}
      <section className="border-b border-[var(--border-subtle)] py-20 sm:py-28">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={20}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px] lg:gap-14">
              <div className="space-y-5 lg:order-1">
                <h2 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Hyde Park to Evanston
                </h2>
                <div className="space-y-5 text-base leading-[1.85] text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <p>
                    Not long after, her brother was bullied at school and the
                    family moved to Lake Forest. She landed in Evanston in
                    eighth grade — the place people mean when they call her a
                    Chicagoan.
                  </p>
                  <p>
                    The house was full of working artists. Her mother taught
                    piano and gave her voice lessons starting at nine. Her
                    sister Emma became a filmmaker; her brother Alexander
                    writes; her identical twin, Ellie, works as a visual
                    artist. Writing, drawing, home movies shot with Ellie —
                    everything creative doubled as an escape.
                  </p>
                  <p>
                    At eleven, she landed her first professional role, in{' '}
                    <em>The Secret Garden</em> at Music Theater Works — the
                    start of a decade of classical stage training before a
                    camera ever found her: <em>Oliver!</em>,{' '}
                    <em>Seussical</em>, <em>The Diary of Anne Frank</em>.
                  </p>
                </div>
              </div>
              {imgOrigins && (
                <div className="relative order-first mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden border border-[var(--border-subtle)] sm:max-w-[260px] lg:order-2 lg:mx-0 lg:mt-16 lg:max-w-[260px] lg:justify-self-end">
                  <Image
                    src={imgOrigins}
                    alt="Sophie Thatcher, portrait photograph"
                    fill
                    sizes="(max-width: 1024px) 60vw, 260px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 03. STAGE → SCREEN ────────────────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-10">
          <Reveal stagger={0.05} y={16}>
            <h2 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
              Stage to Screen
            </h2>
            <div className="mt-8 space-y-7">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[64px_1fr] sm:gap-8">
                <span className="font-mono text-xs text-[var(--accent-amber)] sm:pt-1">
                  2018
                </span>
                <p className="text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <span className="font-display text-[var(--text-primary)]">
                    Prospect.
                  </span>{' '}
                  A leading screen debut opposite Pedro Pascal, premiering at
                  SXSW — the first proof her stage instincts translated to
                  camera.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[64px_1fr] sm:gap-8">
                <span className="font-mono text-xs text-[var(--accent-amber)] sm:pt-1">
                  2019
                </span>
                <p className="text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <span className="font-display text-[var(--text-primary)]">
                    Chicago P.D.
                  </span>{' '}
                  Television work that sharpened those instincts further,
                  before the larger series roles arrived.
                </p>
              </div>
            </div>
            <p className="mt-8 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Not long after, she moved to Los Angeles.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 04. YELLOWJACKETS ─────────────────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] py-20 sm:py-28">
        <div className="mx-auto w-full max-w-[720px] px-6 sm:px-10">
          <Reveal stagger={0.06} y={20}>
            <p className="text-eyebrow">2021 — Present</p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Yellowjackets
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge variant="tv" size="sm">
                Breakthrough
              </Badge>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                29 Episodes · Teen Natalie Scatorccio
              </span>
            </div>
            <p className="mt-6 max-w-xl font-display text-xl italic leading-relaxed text-[var(--text-primary)] sm:text-2xl">
              A generation-defining performance anchoring the critically
              acclaimed Showtime drama.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 05. THE MUSIC INTERLUDE ───────────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-24 sm:py-32">
        <div className="mx-auto w-full max-w-[720px] px-6 sm:px-10">
          <Reveal stagger={0.06} y={20}>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
              Pivot &amp; Scrape · 2024
            </p>
            <blockquote className="mt-6 font-display text-2xl italic leading-[1.35] text-[var(--text-primary)] sm:text-3xl">
              &ldquo;Every character I play is to some extent an extension of
              myself, but music is closer to who I am. It&rsquo;s insane to
              have control and feel like you&rsquo;re a conductor in this
              crazy experiment.&rdquo;
            </blockquote>
            <p className="mt-8 text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
              She&rsquo;s been making music alone since fourteen — an
              omnichord, then Ableton, voice lessons since nine. For{' '}
              <em>Companion</em>, she built a playlist of German minimal synth
              to find Iris before a page of the script was shot. It&rsquo;s
              how she works through most roles: the character exists as a
              sound before it exists as a performance.
            </p>
            {imgMusic && (
              <div className="relative mt-12 ml-auto aspect-[3/4] w-full max-w-[190px] overflow-hidden border border-[var(--border-default)]">
                <Image
                  src={imgMusic}
                  alt="Sophie Thatcher, desaturated portrait"
                  fill
                  sizes="190px"
                  className="object-cover [filter:grayscale(1)_contrast(1.05)_brightness(0.82)]"
                />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── 06. HERETIC → COMPANION → NOW ─────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] py-20 sm:py-28">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={20}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
              {imgClosing && (
                <div className="relative order-first mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden border border-[var(--border-subtle)] sm:max-w-[260px] lg:order-1 lg:mx-0 lg:mt-8 lg:max-w-[260px]">
                  <Image
                    src={imgClosing}
                    alt="Sophie Thatcher, portrait, close crop"
                    fill
                    sizes="(max-width: 1024px) 60vw, 260px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="space-y-6 lg:order-2">
                <h2 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  Heretic, Companion, Now
                </h2>
                <blockquote className="border-l-2 border-[var(--accent-amber)] pl-6 font-display text-xl italic leading-relaxed text-[var(--text-primary)] sm:text-2xl">
                  &ldquo;It was hard growing up Mormon. I don&rsquo;t think
                  it&rsquo;s evil, I just don&rsquo;t think it&rsquo;s right
                  for me.&rdquo;
                </blockquote>
                <p className="text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                  Raised in the LDS faith before leaving in early
                  adolescence, that history informed her turn as Sister
                  Barnes in Scott Beck and Bryan Woods&rsquo;{' '}
                  <em>Heretic</em> (2024) — a nuanced portrayal of faith,
                  intellect, and resilience opposite Hugh Grant, for A24.
                </p>
                <p className="text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <em>Companion</em> (2025) followed: a subversive
                  performance chosen for its conceptual sharpness, and a
                  Critics&rsquo; Choice Super Award. Now she&rsquo;s based in
                  Los Angeles, splitting her time between screen work and the
                  music.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 07. IN PRINT ──────────────────────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-10">
          <Reveal stagger={0.04} y={12}>
            <p className="text-eyebrow">In Print</p>
            <div className="mt-6 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
              {RECOGNITION.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="grid grid-cols-[44px_1fr] items-baseline gap-x-4 gap-y-1 py-3.5 sm:grid-cols-[56px_1fr_auto] sm:gap-6"
                >
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {item.year}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] sm:text-base">
                    <span className="font-display text-[var(--text-primary)]">
                      {item.title}
                    </span>{' '}
                    — {item.note}
                  </span>
                  <span className="col-start-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--text-muted)] sm:col-start-3 sm:self-center">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 08. CODA ───────────────────────────────────────────── */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[720px] px-6 sm:px-10">
          <p className="text-eyebrow">Public Presence</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[var(--border-subtle)] pt-6 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
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
        </div>
      </section>
    </main>
  )
}
