import type { Metadata } from 'next'
import Image from 'next/image'
import {
  getPersonImages,
  getPortraitUrls,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, serializeJsonLd } from '@/utils/schema'
import Reveal from '@/components/ui/Reveal'

// ── Constants ────────────────────────────────────────────────

export const revalidate = 3600

const ABOUT_DESCRIPTION =
  "A digital portrait and personal artistic archive of Sophie Thatcher — Chicago stage roots, a family of working artists, Yellowjackets, Heretic, Companion, and analog music."

interface LedgerEntry {
  year: string
  title: string
  note: string
  category: string
}

const ARCHIVAL_NOTICES: LedgerEntry[] = [
  { year: '2025', title: "Critics' Choice Super Award", note: 'Best Actress in a Science Fiction / Horror Movie (Companion)', category: 'Honor' },
  { year: '2025', title: 'Dazed Magazine', note: 'Cover Story & Interview (March 2025 Issue)', category: 'Editorial' },
  { year: '2025', title: "Harper's Bazaar", note: 'The Possibility Issue Feature Profile', category: 'Editorial' },
  { year: '2024', title: 'Vanity Fair', note: '"All the Rage" Feature & Portrait', category: 'Press' },
  { year: '2022', title: 'Vogue', note: 'September Issue Profile & Cultural Editorial', category: 'Press' },
]

interface TrajectoryNode {
  number: string
  place: string
  coordinates: string
  period: string
  summary: string
}

const TRAJECTORY: TrajectoryNode[] = [
  {
    number: '01',
    place: 'Hyde Park, Chicago',
    coordinates: '41.7943° N, 87.5907° W',
    period: '2000 — Early Childhood',
    summary:
      'Born on the south side of Chicago. The first spark of performance ignited at age four in a community-theatre production of The Wizard of Oz.',
  },
  {
    number: '02',
    place: 'Lake Forest, IL',
    coordinates: '42.2586° N, 87.8406° W',
    period: 'Elementary Years',
    summary:
      'A family relocation following school bullying. The house doubled down as an artistic sanctuary: drawing, piano lessons, and bedroom tapes.',
  },
  {
    number: '03',
    place: 'Evanston, IL',
    coordinates: '42.0451° N, 87.6877° W',
    period: '8th Grade — High School',
    summary:
      'The true anchor. Evanston Township High School and the Lake Michigan wind — the place people mean when they call her a Chicagoan.',
  },
  {
    number: '04',
    place: 'The Chicago Stage',
    coordinates: 'Music Theater Works & Beyond',
    period: 'Ages 11 — 17',
    summary:
      'First professional role at eleven in The Secret Garden. A decade of intensive classical repertory: Oliver!, Seussical, The Diary of Anne Frank.',
  },
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

// ── Page Component ───────────────────────────────────────────

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

  const imgOpening = pick(portraitUrls[0], portraitUrls[1], portraitUrls[2])
  const imgStage = pick(portraitUrls[3], portraitUrls[2], portraitUrls[1])
  const imgMusic = pick(portraitUrls[5], portraitUrls[6], portraitUrls[4])
  const imgNow = pick(portraitUrls[7], portraitUrls[4], portraitUrls[1])

  const age = getAge()

  return (
    <main className="bg-[var(--bg-base)] text-[var(--text-primary)]">
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

      {/* ════════════════════════════════════════════════════════
          01 · DOSSIER LEDGER & OPENING COMPOSITION
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] pt-24 pb-16 sm:pt-32 sm:pb-24">
        {/* Top Archival Ledger Strip */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-[var(--border-subtle)] pb-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]" />
              ARCHIVE DOSSIER // ST-2000
            </span>
            <span>CHICAGO, IL ➔ LOS ANGELES, CA</span>
            <span className="text-[var(--accent-gold)]">STATUS: ACTIVE RECORD</span>
          </div>
        </div>

        {/* Main Opening Canvas */}
        <div className="mx-auto mt-12 max-w-6xl px-6 sm:mt-16 sm:px-10">
          <Reveal immediate stagger={0.06} y={16}>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
              {/* Left Column: Narrative Lead & Monumental Name */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                  <span>REF 001</span>
                  <span className="text-[var(--border-strong)]">/</span>
                  <span>HYDE PARK, CHICAGO · 2004</span>
                </div>

                <blockquote className="mt-5 font-display text-2xl italic leading-[1.35] text-[var(--text-primary)] sm:text-3xl sm:leading-[1.3] lg:text-4xl">
                  &ldquo;A community-theatre production of{' '}
                  <span className="not-italic text-[var(--accent-gold)]">
                    The Wizard of Oz
                  </span>
                  . She was four. She played a munchkin.&rdquo;
                </blockquote>

                <div className="mt-10 border-t border-[var(--border-subtle)] pt-8">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    SUBJECT RECORD
                  </p>
                  <h1 className="mt-2 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-medium leading-[0.95] tracking-tight text-[var(--text-primary)]">
                    Sophie Bathsheba Thatcher
                  </h1>
                  <p className="mt-4 font-display text-lg italic text-[var(--text-secondary)] sm:text-xl">
                    Actor. Musician. Visual Artist.
                  </p>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                    A decade of classical Chicago stage training before a camera
                    ever found her. From the toxic alien dunes of{' '}
                    <em>Prospect</em> to the haunted snowfields of{' '}
                    <em>Yellowjackets</em> and the intellectual duel of{' '}
                    <em>Heretic</em>, her work explores the feral border between
                    vulnerability and resilience.
                  </p>
                </div>

                {/* Archival Specification Strip */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-b border-[var(--border-subtle)] py-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--text-muted)] sm:grid-cols-4">
                  <div>
                    <span className="block text-[0.6rem] text-[var(--accent-amber)]">BORN</span>
                    <span className="text-[var(--text-primary)]">18 OCT 2000</span>
                  </div>
                  <div>
                    <span className="block text-[0.6rem] text-[var(--accent-amber)]">ORIGIN</span>
                    <span className="text-[var(--text-primary)]">CHICAGO, IL</span>
                  </div>
                  <div>
                    <span className="block text-[0.6rem] text-[var(--accent-amber)]">AGE</span>
                    <span className="text-[var(--text-primary)]">{age} YEARS</span>
                  </div>
                  <div>
                    <span className="block text-[0.6rem] text-[var(--accent-amber)]">BASE</span>
                    <span className="text-[var(--text-primary)]">LOS ANGELES</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Tactile Archival Portrait Stamp */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="relative mx-auto max-w-[340px] lg:max-w-none">
                  {imgOpening && (
                    <div className="group relative aspect-[3/4] w-full overflow-hidden border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
                      <Image
                        src={imgOpening}
                        alt="Sophie Thatcher, archival portrait"
                        fill
                        priority
                        sizes="(max-width: 1024px) 80vw, 360px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/80 via-transparent to-transparent" />
                      <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] backdrop-blur-xs">
                        <span>FIG. 01 // PORTRAIT</span>
                        <span className="text-[var(--accent-amber)]">TMDB ARCHIVE</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 border-l border-[var(--accent-amber)]/60 pl-3 font-mono text-[0.68rem] leading-relaxed text-[var(--text-muted)]">
                    &ldquo;The stage taught me stillness before the camera ever
                    arrived.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          02 · GEOGRAPHY // THE ILLINOIS ARC
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={18}>
            {/* Section Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                  02 // GEOGRAPHY
                </span>
                <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  The Illinois Arc
                </h2>
              </div>
              <p className="font-mono text-xs text-[var(--text-muted)] sm:text-right">
                41.79° N ➔ 42.04° N // SOUTH SHORE TO LAKE MICHIGAN
              </p>
            </div>

            {/* Trajectory Pathway Composition */}
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TRAJECTORY.map((item) => (
                <div
                  key={item.number}
                  className="relative flex flex-col justify-between border-t border-[var(--border-default)] pt-5 pb-2"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-semibold text-[var(--accent-amber)]">
                        {item.number}
                      </span>
                      <span className="text-[0.68rem] text-[var(--text-muted)]">
                        {item.period}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-medium text-[var(--text-primary)]">
                      {item.place}
                    </h3>
                    <p className="mt-1 font-mono text-[0.65rem] text-[var(--text-muted)]">
                      {item.coordinates}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                      {item.summary}
                    </p>
                  </div>
                  <div className="mt-6 h-[1px] w-8 bg-[var(--accent-amber)]/40" />
                </div>
              ))}
            </div>

            {/* The Creative Ecosystem — Family Dossier */}
            <div className="mt-16 border-t border-[var(--border-subtle)] pt-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                    ORIGINS // THE HOUSE OF ARTISTS
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                    A Sanctuary of Working Arts
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)] text-pretty">
                    The Thatcher household was defined by constant making.
                    Writing, drawing, piano chords drifting through hallways, and
                    home movies shot on handheld cameras — art was not a hobby,
                    it doubled as an everyday sanctuary and language.
                  </p>
                </div>

                <div className="space-y-4 lg:col-span-7">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
                      <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--accent-gold)]">
                        MOTHER
                      </span>
                      <h4 className="mt-1 font-display text-lg text-[var(--text-primary)]">
                        Piano Instructor &amp; Voice Coach
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        Taught Sophie classical vocal technique and piano
                        discipline starting at age nine, building the foundation
                        for her vocal power.
                      </p>
                    </div>

                    <div className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
                      <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--accent-gold)]">
                        EMMA THATCHER
                      </span>
                      <h4 className="mt-1 font-display text-lg text-[var(--text-primary)]">
                        Sister · Filmmaker
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        Independent director and screenwriter; an early sounding
                        board for visual narrative and independent cinematic
                        spirit.
                      </p>
                    </div>

                    <div className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
                      <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--accent-gold)]">
                        ALEXANDER THATCHER
                      </span>
                      <h4 className="mt-1 font-display text-lg text-[var(--text-primary)]">
                        Brother · Writer
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        Author and dramatist; contributing to the family&rsquo;s
                        deep respect for text, pacing, and theatrical rigor.
                      </p>
                    </div>

                    <div className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
                      <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--accent-gold)]">
                        ELLIE THATCHER
                      </span>
                      <h4 className="mt-1 font-display text-lg text-[var(--text-primary)]">
                        Identical Twin · Visual Artist
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        Fine artist and illustrator. Co-creator of early
                        experimental short films and sketchbooks in Evanston.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          03 · STAGE TO SCREEN // THE PIVOT (2018–2019)
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={18}>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Left Column: Stage/Screen Portrait */}
              <div className="lg:col-span-5">
                {imgStage && (
                  <div className="relative mx-auto max-w-[320px] lg:max-w-none">
                    <div className="aspect-[3/4] w-full overflow-hidden border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
                      <Image
                        src={imgStage}
                        alt="Sophie Thatcher in dramatic light"
                        fill
                        sizes="(max-width: 1024px) 80vw, 340px"
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <span>FIG. 02 // STAGE INSTINCTS</span>
                      <span>SXSW PREMIERE · 2018</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: The Screen Transformation */}
              <div className="space-y-6 lg:col-span-7">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                  03 // THE PIVOT
                </span>
                <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Stage Instincts, Translated to the Lens
                </h2>
                <div className="space-y-6 text-base leading-[1.8] text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <div className="border-l-2 border-[var(--accent-amber)] pl-5">
                    <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                      2018 · Prospect (SXSW)
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                      A leading screen debut opposite Pedro Pascal. Playing Cee
                      on a toxic alien moon, Thatcher held the camera through
                      spacesuit glass with an eerie stillness that announced a
                      major new cinematic presence.
                    </p>
                  </div>

                  <div className="border-l-2 border-[var(--border-strong)] pl-5">
                    <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                      2019 · Chicago P.D. &amp; The Television Pace
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                      Episodic television tested her speed and adaptability. Not
                      long after, she packed her instruments and notebooks for
                      Los Angeles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          04 · YELLOWJACKETS // THE GENERATIONAL ANCHOR
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] bg-[#070603] py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={20}>
            <div className="border border-[var(--border-default)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-base)] p-8 sm:p-14 lg:p-16">
              <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                <span>04 // BREAKTHROUGH ANCHOR</span>
                <span className="text-[var(--text-muted)]">
                  SHOWTIME · 2021 — PRESENT
                </span>
              </div>

              <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.2rem)] font-medium leading-[0.98] tracking-tight text-[var(--text-primary)]">
                Natalie Scatorccio
              </h2>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)]">
                29 EPISODES · THE WILDERNESS &amp; THE SCARS
              </p>

              <blockquote className="mt-8 border-l-2 border-[var(--accent-gold)] pl-6 font-display text-xl italic leading-relaxed text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                &ldquo;A generation-defining performance. Thatcher gives Teen
                Nat a ferocious, wounded dignity that turned a survival horror
                story into an indelible tragedy of youth.&rdquo;
              </blockquote>

              <div className="mt-10 grid grid-cols-1 gap-6 border-t border-[var(--border-subtle)] pt-8 sm:grid-cols-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                <p>
                  Bleached hair, chipped nail polish, a hunting rifle slung
                  across flannel. Thatcher built Nat as both the protector and
                  the outlaw of the wilderness — carrying the trauma of the 1996
                  crash with an electric, unpredictable physical gravity.
                </p>
                <p>
                  Sharing the role across time with Juliette Lewis, she
                  synchronized vocal rasp and guarded postures without ever
                  descending into imitation, cementing herself as one of the
                  most electrifying actors of her generation.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          05 · THE SONIC ARCHIVE // MUSIC AS SELF
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] bg-[#040402] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={20}>
            {/* Top Sonic Strip */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-[var(--border-subtle)] pb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
              <span>05 // THE SONIC ARCHIVE</span>
              <span className="text-[var(--text-muted)]">
                ANALOG SYNTHESIS · VOCALS · PIVOT &amp; SCRAPE (2024)
              </span>
            </div>

            {/* Central Musical Manifesto */}
            <div className="mt-12 text-center sm:mt-16">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                ARTIST STATEMENT
              </p>
              <blockquote className="mx-auto mt-4 max-w-3xl font-display text-2xl italic leading-[1.4] text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
                &ldquo;Every character I play is to some extent an extension of
                myself, but music is closer to who I am. It&rsquo;s insane to
                have control and feel like you&rsquo;re a conductor in this crazy
                experiment.&rdquo;
              </blockquote>
            </div>

            {/* Music Story & Visual Crop */}
            <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-6 lg:col-span-7">
                <div className="border-t border-[var(--border-subtle)] pt-6">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent-gold)]">
                    THE METHOD // SONIC BLUEPRINTS
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-medium text-[var(--text-primary)]">
                    Playlists as Physical Architecture
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)] text-pretty">
                    Before shooting a single page of script, Thatcher constructs
                    audio worlds for her characters. For <em>Companion</em>{' '}
                    (2025), she assembled German minimal synth and coldwave
                    tracks to locate the frequency of Iris. The character
                    exists as a rhythm before it exists on camera.
                  </p>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-6">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent-gold)]">
                    THE RECORD // PIVOT &amp; SCRAPE (2024)
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-medium text-[var(--text-primary)]">
                    Analog Darkwave &amp; Intimate Rooms
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)] text-pretty">
                    Writing alone since fourteen on an Omnichord and Ableton, her
                    debut EP combines industrial friction, hypnotic drum
                    machines, and ethereal vocal arrangements recorded in
                    transient hotel rooms between film sets.
                  </p>
                </div>
              </div>

              {/* Sonic Portrait Crop */}
              <div className="lg:col-span-5">
                {imgMusic && (
                  <div className="relative mx-auto max-w-[300px] lg:max-w-none">
                    <div className="aspect-[4/5] w-full overflow-hidden border border-[var(--border-strong)] bg-black shadow-[0_16px_36px_rgba(0,0,0,0.9)]">
                      <Image
                        src={imgMusic}
                        alt="Sophie Thatcher, high-contrast dark music portrait"
                        fill
                        sizes="(max-width: 1024px) 80vw, 320px"
                        className="object-cover [filter:grayscale(1)_contrast(1.15)_brightness(0.85)]"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <span>FIG. 03 // ANALOG SESSIONS</span>
                      <span className="text-[var(--accent-gold)]">REC 00:14:22</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          06 · HERETIC // FAITH, MEMORY & INTELLECT
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={18}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-4 lg:col-span-4">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                  06 // FAITH &amp; MEMORY
                </span>
                <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Sister Barnes &amp; Heretic
                </h2>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  A24 · 2024 · DIR. BECK &amp; WOODS
                </p>
              </div>

              <div className="space-y-6 lg:col-span-8">
                <blockquote className="border-l-2 border-[var(--accent-amber)] pl-6 font-display text-xl italic leading-relaxed text-[var(--text-primary)] sm:text-2xl">
                  &ldquo;It was hard growing up Mormon. I don&rsquo;t think
                  it&rsquo;s evil, I just don&rsquo;t think it&rsquo;s right for
                  me.&rdquo;
                </blockquote>
                <div className="space-y-4 text-base leading-[1.85] text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <p>
                    Raised in the Church of Jesus Christ of Latter-day Saints
                    before consciously leaving in early adolescence, that
                    theological literacy directly informed her portrayal of
                    Sister Barnes opposite Hugh Grant.
                  </p>
                  <p>
                    Rather than a passive victim, Thatcher crafted Barnes as an
                    intellectual counterweight — using debate, scripture, and
                    psychological tenacity to challenge theological dogmatism on
                    equal footing.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          07 · COMPANION ➔ THE HORIZON
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <Reveal stagger={0.06} y={18}>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="space-y-6 lg:col-span-7">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                  07 // THE PRESENT HORIZON
                </span>
                <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Companion &amp; Forward Momentum
                </h2>
                <p className="font-display text-xl italic text-[var(--text-secondary)] sm:text-2xl">
                  Subverting expectations with conceptual precision.
                </p>
                <div className="space-y-4 text-base leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-lg">
                  <p>
                    In Drew Hancock&rsquo;s <em>Companion</em> (2025), Thatcher
                    delivered a performance of startling wit and razor-sharp
                    subversion, earning the Critics&rsquo; Choice Super Award
                    for Best Actress in a Science Fiction / Horror Movie.
                  </p>
                  <p>
                    Now based in Los Angeles, she splits her time between
                    demanding screen roles, studio songwriting, and fine art — an
                    artist whose career is in continuous, restless evolution.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5">
                {imgNow && (
                  <div className="relative mx-auto max-w-[320px] lg:max-w-none">
                    <div className="aspect-[4/5] w-full overflow-hidden border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[0_16px_36px_rgba(0,0,0,0.7)]">
                      <Image
                        src={imgNow}
                        alt="Sophie Thatcher, contemporary portrait"
                        fill
                        sizes="(max-width: 1024px) 80vw, 340px"
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <span>FIG. 04 // CURRENT HORIZON</span>
                      <span className="text-[var(--accent-gold)]">LOS ANGELES · NOW</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          08 · IN PRINT & ARCHIVAL NOTICES
      ════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-[var(--border-subtle)] py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <Reveal stagger={0.04} y={12}>
            <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-4">
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                08 // IN PRINT &amp; RECOGNITION
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                ARCHIVAL LEDGER
              </span>
            </div>

            <div className="mt-6 divide-y divide-[var(--border-subtle)]">
              {ARCHIVAL_NOTICES.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="grid grid-cols-1 items-baseline gap-2 py-4 sm:grid-cols-[60px_1fr_auto] sm:gap-6"
                >
                  <span className="font-mono text-xs text-[var(--accent-amber)]">
                    {item.year}
                  </span>
                  <div className="text-sm text-[var(--text-secondary)] sm:text-base">
                    <span className="font-display font-medium text-[var(--text-primary)]">
                      {item.title}
                    </span>{' '}
                    <span className="text-[var(--text-muted)]">—</span> {item.note}
                  </div>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          09 · PUBLIC PRESENCE & CODA
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-subtle)] pt-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber)]">
                PUBLIC CHANNELS
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Official public media profiles and artistic channels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
              <a
                href="https://instagram.com/soapy.t"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] focus-ring rounded-xs"
              >
                <span>Instagram</span>
                <span className="text-[var(--accent-amber)]">@soapy.t ↗</span>
              </a>
              <a
                href="https://youtube.com/@SophieThatcher"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] focus-ring rounded-xs"
              >
                <span>YouTube</span>
                <span className="text-[var(--accent-amber)]">@SophieThatcher ↗</span>
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-[var(--border-subtle)]/50 pt-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            SOAPYFANS HUB ARCHIVE // CURATED BIOGRAPHICAL DOSSIER // INDEPENDENT NON-COMMERCIAL RECORD
          </div>
        </div>
      </section>
    </main>
  )
}

