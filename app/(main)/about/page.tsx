import type { Metadata } from 'next'
import Image from 'next/image'
import {
  getPersonImages,
  getPortraitUrls,
  type TmdbPersonImages,
} from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, buildSophieThatcherPersonSchema, serializeJsonLd } from '@/utils/schema'
import PageContainer from '@/components/ui/PageContainer'
import Reveal from '@/components/ui/Reveal'
import Badge from '@/components/ui/Badge'

export const revalidate = 3600

const ABOUT_DESCRIPTION =
  'An editorial introduction to Sophie Thatcher — her life, artistic origins, craft, screen performances, and music.'

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

const EYEBROW = 'font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--accent-amber)]'
const MOVEMENT_TITLE =
  'mt-2 font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-medium leading-[1.12] tracking-tight text-[var(--text-primary)]'
const BODY_TEXT = 'max-w-[42rem] text-[1.02rem] leading-[1.85] text-[var(--text-secondary)] text-pretty'

export default async function AboutPage() {
  const imagesData = await getPersonImages().catch(
    (): TmdbPersonImages => ({ id: 0, profiles: [] }),
  )

  const portraitUrls = getPortraitUrls(imagesData.profiles, 4, 'w780')
  const evanstonPortrait = portraitUrls[0] ?? null
  const closingPortrait = portraitUrls[2] ?? portraitUrls[1] ?? null

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-24 sm:pt-28 pb-28 sm:pb-40">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildSophieThatcherPersonSchema()) }}
      />

      <PageContainer size="dossier">
        {/* ── 01. OPENING ────────────────────────────────────────── */}
        <section aria-label="Opening" className="space-y-3">
          <Reveal immediate stagger={0.06} y={14}>
            <div className="flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--accent-amber)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]" />
              <span>Born 2000 · Chicago, Illinois</span>
            </div>

            <h1
              id="sophie-thatcher"
              className="mt-4 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)]"
            >
              Sophie Thatcher
            </h1>

            <p className="mt-3 text-base text-[var(--text-secondary)]">
              Actor. Musician. Visual artist.
            </p>
          </Reveal>
        </section>

        {/* ── 02. ORIGINS ────────────────────────────────────────── */}
        <section aria-labelledby="origins-heading" className="mt-20 sm:mt-28">
          <Reveal stagger={0.06} y={18}>
            <p className={EYEBROW}>Origins</p>
            <h2 id="origins-heading" className={MOVEMENT_TITLE}>
              Hyde Park to Evanston
            </h2>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              {evanstonPortrait && (
                <figure className="mx-auto w-full max-w-[260px] shrink-0 sm:mx-0 sm:w-[260px]">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    <Image
                      src={evanstonPortrait}
                      alt="Sophie Thatcher, early portrait"
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Sophie Thatcher
                  </figcaption>
                </figure>
              )}
              <div className="space-y-6 sm:flex-1">
                <p className={BODY_TEXT}>
                  Sophie Thatcher was born in Chicago in 2000 and spent her early years in Hyde Park before her family later moved to Lake Forest and Evanston. She grew up in a musical and creatively minded household: her mother is a piano teacher, and her siblings have pursued creative work of their own, including writing, filmmaking, and visual art. From an early age, music, storytelling, and performance were already part of her everyday life.
                </p>
                <p className={BODY_TEXT}>
                  Thatcher began acting as a child and trained in the performing arts from a young age. By eleven, she was performing professionally in Chicago, taking on the role of Mary Lennox in <em>The Secret Garden</em>. She later appeared in productions including <em>Oliver!</em>, <em>Seussical</em>, and <em>The Diary of Anne Frank</em>. Those early years gave her a substantial foundation in theatre, with <em>The Secret Garden</em> standing out in her own recollections as an especially important early professional experience.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── 03. STAGE → SCREEN ────────────────────────────────── */}
        <section aria-labelledby="pivot-heading" className="mt-14 sm:mt-16">
          <Reveal stagger={0.06} y={14}>
            <p className={EYEBROW}>The Pivot</p>
            <h2
              id="pivot-heading"
              className="mt-2 font-display text-lg sm:text-xl font-medium tracking-tight text-[var(--text-primary)]"
            >
              Stage to Screen
            </h2>

            <p className="mt-4 max-w-[36rem] text-[0.98rem] leading-[1.75] text-[var(--text-secondary)] text-pretty">
              Her move into screen acting began with smaller television and film appearances before her feature-film debut in{' '}
              <em>Prospect</em> (<span className="font-mono text-[0.85em] text-[var(--text-muted)]">2018</span>), where she played Cee alongside Pedro Pascal. From there, she continued working across television and independent film, gradually taking on more substantial roles.
            </p>
          </Reveal>
        </section>

        {/* ── 04. YELLOWJACKETS ─────────────────────────────────── */}
        <section aria-labelledby="yellowjackets-heading" className="mt-20 sm:mt-32">
          <Reveal stagger={0.06} y={16}>
            <p className={EYEBROW}>The Breakthrough</p>
            <h2
              id="yellowjackets-heading"
              className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.1rem)] font-medium leading-[1.08] tracking-tight text-[var(--text-primary)]"
            >
              Natalie Scatorccio, <em className="italic">Yellowjackets</em>
            </h2>
            <div className="mt-4">
              <Badge variant="tv" size="sm">Showtime · 2021—Present</Badge>
            </div>
            <p className="mt-6 max-w-[42rem] text-[1.02rem] leading-[1.85] text-[var(--text-secondary)] text-pretty">
              Her breakthrough came with <em>Yellowjackets</em>, which premiered in 2021. As teenage Natalie Scatorccio, Thatcher became one of the show&rsquo;s central young performers, portraying a character defined by toughness, vulnerability, isolation, and a strong sense of right and wrong. The show&rsquo;s creators have described Natalie as its moral center, while Thatcher herself has spoken about recognizing parts of her own personality in the character, particularly her more solitary nature.
            </p>
          </Reveal>
        </section>
      </PageContainer>

      {/* ── 05. THE MUSIC INTERLUDE ─────────────────────────────── */}
      <section aria-labelledby="music-heading" className="mt-20 sm:mt-32 bg-[var(--bg-elevated)] py-20 sm:py-28">
        <PageContainer size="dossier">
          <Reveal stagger={0.06} y={16}>
            <p className={`${EYEBROW} text-center`}>Pivot &amp; Scrape · 2024</p>
            <h2 id="music-heading" className="sr-only">
              The Sound
            </h2>
            <p className="mx-auto mt-8 max-w-[38rem] text-center font-display italic text-[clamp(1.5rem,3.2vw,2.15rem)] leading-[1.45] text-[var(--text-primary)]">
              &ldquo;Every character I play is to some extent an extension of myself, but music is closer to who I am. It&rsquo;s insane to have control and feel like you&rsquo;re a conductor in this crazy experiment.&rdquo;
            </p>
            <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              — Sophie Thatcher
            </p>
            <p className="mx-auto mt-10 max-w-[34rem] text-center text-sm leading-[1.8] text-[var(--text-secondary)] text-pretty">
              Music has developed alongside acting as another major part of Thatcher&rsquo;s creative life. She grew up singing and studying music, and later began experimenting with songwriting and electronic production. During a period of isolation, she started working with Ableton and gradually developed a more personal music-making process. In October 2024, she released her debut EP, <em>Pivot &amp; Scrape</em>.
            </p>
          </Reveal>
        </PageContainer>
      </section>

      <PageContainer size="dossier">
        {/* ── 06. HERETIC → COMPANION → NOW ─────────────────────── */}
        <section aria-labelledby="present-heading" className="mt-20 sm:mt-28">
          <Reveal stagger={0.06} y={18}>
            <p className={EYEBROW}>Faith &amp; the Present</p>
            <h2 id="present-heading" className={MOVEMENT_TITLE}>
              Heretic, Companion, and Now
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_260px] sm:items-start sm:gap-8">
              <div className="space-y-6">
                <p className={BODY_TEXT}>
                  Her film work has continued to move between very different genres and characters. In <em>Heretic</em> (2024), she played Sister Barnes, drawing in part on her own upbringing within the Mormon community. Rather than simply studying the character from the outside, Thatcher incorporated mannerisms and habits she remembered from her own youth into the performance.
                </p>
                <p className={BODY_TEXT}>
                  In <em>Companion</em> (2025), she took on the role of Iris, continuing her progression into science fiction and psychological thriller territory. Across theatre, film, television, and music, Thatcher&rsquo;s career has developed through curiosity rather than a single fixed path — each stage opening the door to something different, while the same interest in storytelling and creative expression runs through all of it.
                </p>
              </div>

              {closingPortrait && (
                <figure className="mx-auto w-full max-w-[260px] sm:mx-0 sm:w-[260px]">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                    <Image
                      src={closingPortrait}
                      alt="Sophie Thatcher, recent portrait"
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Sophie Thatcher
                  </figcaption>
                </figure>
              )}
            </div>
          </Reveal>
        </section>

        <hr className="my-16 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 07. IN PRINT ───────────────────────────────────────── */}
        <section aria-labelledby="print-heading" className="max-w-[42rem]">
          <Reveal stagger={0.04} y={10}>
            <p id="print-heading" className={EYEBROW}>In Print</p>
            <div className="mt-4 divide-y divide-[var(--border-subtle)]">
              {RECOGNITION.map((item) => (
                <div
                  key={`${item.year}-${item.title}`}
                  className="grid grid-cols-[44px_1fr] items-baseline gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[56px_1fr_auto] sm:gap-6"
                >
                  <span className="font-mono text-[0.7rem] text-[var(--text-muted)]">
                    {item.year}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--text-primary)]">{item.title}</span>{' '}
                    — {item.note}
                  </span>
                  <span className="col-start-2 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)] sm:col-start-3 sm:self-center">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <hr className="mt-14 sm:mt-16 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 08. CODA ──────────────────────────────────────────── */}
        <section aria-label="Public presence" className="mt-6 space-y-3">
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
