import type { Metadata } from 'next'
import Image from 'next/image'
import {
  getPersonImages,
  getPortraitUrls,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, serializeJsonLd } from '@/utils/schema'
import PageContainer from '@/components/ui/PageContainer'
import Reveal from '@/components/ui/Reveal'
import Badge from '@/components/ui/Badge'

export const revalidate = 3600

const ABOUT_DESCRIPTION =
  'An editorial introduction to Sophie Thatcher — her life, artistic origins, craft, screen performances, and music.'

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

interface RecognitionEntry {
  year: string
  title: string
  note: string
  type: string
}

const RECOGNITION: RecognitionEntry[] = [
  { year: '2025', title: "Critics' Choice Super Award", note: 'Best Actress in a Science Fiction / Horror Movie (Companion)', type: 'Honor' },
  { year: '2025', title: 'Dazed Magazine', note: 'Cover story & interview', type: 'Editorial' },
  { year: '2025', title: "Harper's Bazaar", note: 'The Possibility Issue feature profile', type: 'Editorial' },
  { year: '2024', title: 'Vanity Fair', note: '"All the Rage" feature & portrait', type: 'Press' },
  { year: '2022', title: 'Vogue', note: 'September issue profile & cultural editorial', type: 'Press' },
]

export default async function AboutPage() {
  const imagesData = await getPersonImages().catch(
    (): TmdbPersonImages => ({ id: 0, profiles: [] }),
  )

  const portraitUrls = getPortraitUrls(imagesData.profiles, 4, 'w780')
  const evanstonPortrait = portraitUrls[0] ?? null
  const closingPortrait = portraitUrls[2] ?? portraitUrls[1] ?? null

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-28 sm:pt-36 pb-28 sm:pb-40">
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

      <PageContainer size="dossier">
        {/* ── 01. OPENING FRAGMENT ──────────────────────────────── */}
        <section aria-label="Opening" className="space-y-6">
          <Reveal immediate stagger={0.06} y={14}>
            <div className="flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--accent-amber)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]" />
              <span>Age Four · Hyde Park, Chicago</span>
            </div>

            <p className="mt-4 max-w-xl font-display text-xl italic leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-2xl">
              A community-theatre production of <em className="not-italic text-[var(--text-primary)]">The Wizard of Oz</em>. She was four. She played a munchkin.
            </p>

            <h1 className="mt-8 font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--text-primary)]">
              Sophie Thatcher
            </h1>

            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Actor. Musician. Visual artist.
            </p>
          </Reveal>
        </section>

        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 02. HYDE PARK → LAKE FOREST → EVANSTON ───────────── */}
        <section aria-labelledby="origins-heading" className="space-y-6">
          <Reveal stagger={0.06} y={18}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
              Origins
            </p>
            <h2
              id="origins-heading"
              className="mt-2 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text-primary)]"
            >
              Hyde Park to Evanston
            </h2>

            <div className="mt-8 clear-both text-[1.02rem] leading-[1.88] text-[var(--text-secondary)] text-pretty sm:text-[1.06rem]">
              {evanstonPortrait && (
                <figure className="float-none mb-6 w-full max-w-[280px] sm:float-right sm:mb-4 sm:ml-8">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    <Image
                      src={evanstonPortrait}
                      alt="Sophie Thatcher, early portrait"
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Sophie Thatcher
                  </figcaption>
                </figure>
              )}

              <p>
                Sophie Thatcher was born in Chicago in 2000 and spent her early years in Hyde Park, on the city&rsquo;s South Side. Her family later moved to Lake Forest, and she landed in Evanston by eighth grade — the place people mean when they call her a Chicagoan. It was a household of working artists: her mother is a piano teacher, her sister Emma is a filmmaker, her brother Alexander is a writer, and her identical twin Ellie is a visual artist. Music, storytelling, and performance were part of everyday life long before any of it became a career.
              </p>
              <p className="mt-6">
                She began performing as a child, training in theatre from a young age. By eleven she was working professionally, playing Mary Lennox in <em>The Secret Garden</em> at Music Theater Works — a role she has singled out as her most formative early experience. Productions of <em>Oliver!</em>, <em>Seussical</em>, and <em>The Diary of Anne Frank</em> followed, a decade of classical stage training before a camera ever found her.
              </p>
            </div>
          </Reveal>
        </section>

        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 03. STAGE → SCREEN ────────────────────────────────── */}
        <section aria-labelledby="pivot-heading" className="space-y-6">
          <Reveal stagger={0.06} y={16}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
              The Pivot
            </p>
            <h2
              id="pivot-heading"
              className="mt-2 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text-primary)]"
            >
              Stage to Screen
            </h2>

            <div className="mt-8 space-y-5">
              <div className="grid grid-cols-[3.5rem_1fr] gap-4 sm:grid-cols-[4rem_1fr] sm:gap-6">
                <span className="pt-0.5 font-mono text-xs text-[var(--text-muted)]">2018</span>
                <p className="text-[1.02rem] leading-[1.88] text-[var(--text-secondary)] text-pretty sm:text-[1.06rem]">
                  Her feature-film debut came in <em>Prospect</em>, opposite Pedro Pascal, which premiered at SXSW. Playing Cee across a toxic alien moon, she held the screen with a stillness that read as a genuine arrival, not a first outing.
                </p>
              </div>
              <div className="grid grid-cols-[3.5rem_1fr] gap-4 sm:grid-cols-[4rem_1fr] sm:gap-6">
                <span className="pt-0.5 font-mono text-xs text-[var(--text-muted)]">2019</span>
                <p className="text-[1.02rem] leading-[1.88] text-[var(--text-secondary)] text-pretty sm:text-[1.06rem]">
                  A run on <em>Chicago P.D.</em> tested her pace on episodic television. Not long after, she packed for Los Angeles.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 04. YELLOWJACKETS ─────────────────────────────────── */}
        <section aria-labelledby="yellowjackets-heading" className="space-y-5">
          <Reveal stagger={0.06} y={16}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
              The Breakthrough
            </p>
            <h2
              id="yellowjackets-heading"
              className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.1] tracking-tight text-[var(--text-primary)]"
            >
              Natalie Scatorccio, <span className="italic text-[var(--text-secondary)]">Yellowjackets</span>
            </h2>
            <div className="mt-3">
              <Badge variant="tv">Showtime · 2021—Present</Badge>
            </div>
            <p className="mt-5 max-w-2xl text-[1.02rem] leading-[1.88] text-[var(--text-secondary)] text-pretty sm:text-[1.06rem]">
              29 episodes as teenage Natalie Scatorccio — a generation-defining performance anchoring the critically acclaimed drama.
            </p>
          </Reveal>
        </section>

        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />
      </PageContainer>

      {/* ── 05. THE MUSIC INTERLUDE ─────────────────────────────── */}
      <section aria-labelledby="music-heading" className="bg-[var(--bg-elevated)] py-16 sm:py-20">
        <PageContainer size="dossier">
          <Reveal stagger={0.06} y={16}>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Pivot &amp; Scrape · 2024
            </p>
            <blockquote
              id="music-heading"
              className="mt-5 max-w-2xl font-display text-2xl italic leading-[1.4] text-[var(--text-primary)] text-pretty sm:text-3xl"
            >
              &ldquo;Every character I play is to some extent an extension of myself, but music is closer to who I am. It&rsquo;s insane to have control and feel like you&rsquo;re a conductor in this crazy experiment.&rdquo;
            </blockquote>
            <p className="mt-8 max-w-2xl text-[0.98rem] leading-[1.85] text-[var(--text-secondary)] text-pretty">
              She has been making music alone since fourteen, moving from an omnichord to Ableton, and has taken voice lessons since nine. Before playing a role, she builds a full playlist to find its character — for <em>Companion</em>&rsquo;s Iris, that meant leaning into synth-heavy &rsquo;80s sound and German minimal synth.
            </p>
          </Reveal>
        </PageContainer>
      </section>

      <PageContainer size="dossier">
        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 06. HERETIC → COMPANION → NOW ─────────────────────── */}
        <section aria-labelledby="present-heading" className="space-y-6">
          <Reveal stagger={0.06} y={18}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
              Faith &amp; the Present
            </p>
            <h2
              id="present-heading"
              className="mt-2 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text-primary)]"
            >
              Heretic, Companion, and Now
            </h2>

            <div className="mt-8 clear-both text-[1.02rem] leading-[1.88] text-[var(--text-secondary)] text-pretty sm:text-[1.06rem]">
              {closingPortrait && (
                <figure className="float-none mb-6 w-full max-w-[280px] sm:float-right sm:mb-4 sm:ml-8">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    <Image
                      src={closingPortrait}
                      alt="Sophie Thatcher, recent portrait"
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Sophie Thatcher
                  </figcaption>
                </figure>
              )}

              <blockquote className="border-l-2 border-[var(--accent-amber)] pl-5 font-display text-lg italic leading-relaxed text-[var(--text-primary)] sm:text-xl">
                &ldquo;It was hard growing up Mormon. I don&rsquo;t think it&rsquo;s evil, I just don&rsquo;t think it&rsquo;s right for me.&rdquo;
              </blockquote>
              <p className="mt-6">
                Raised in the Church of Jesus Christ of Latter-day Saints before leaving in early adolescence, that upbringing found direct expression in Sister Barnes, her role opposite Hugh Grant in <em>Heretic</em> (2024) — drawing on mannerisms and habits she remembered from her own youth rather than studying the character from the outside.
              </p>
              <p className="mt-6">
                In <em>Companion</em> (2025), she played Iris in a subversive performance chosen for its sharp conceptual complexity, earning the Critics&rsquo; Choice Super Award for Best Actress in a Science Fiction / Horror Movie. She is now based in Los Angeles, working across screen and music.
              </p>
            </div>
          </Reveal>
        </section>

        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 07. IN PRINT ──────────────────────────────────────── */}
        <section aria-labelledby="press-heading" className="space-y-5">
          <Reveal stagger={0.04} y={12}>
            <h2
              id="press-heading"
              className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]"
            >
              In Print
            </h2>

            <div className="mt-4 divide-y divide-[var(--border-subtle)]">
              {RECOGNITION.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="grid grid-cols-1 items-baseline gap-1.5 py-3 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-6 sm:py-3.5"
                >
                  <span className="font-mono text-xs text-[var(--text-muted)]">{item.year}</span>
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">{item.title}</span>{' '}
                    <span className="text-[var(--text-muted)]">—</span> {item.note}
                  </p>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 08. CODA ──────────────────────────────────────────── */}
        <section aria-label="Public presence" className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-[0.14em]">
            <a
              href="https://instagram.com/soapy.t"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
            >
              Instagram @soapy.t ↗
            </a>
            <a
              href="https://youtube.com/@SophieThatcher"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
            >
              YouTube @SophieThatcher ↗
            </a>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
            An unofficial fan archive celebrating the work and artistry of actress and musician Sophie Thatcher across film, television, and music.
          </p>
        </section>
      </PageContainer>
    </main>
  )
}
