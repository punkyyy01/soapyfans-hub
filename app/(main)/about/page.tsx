import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getBestPersonPortrait, getTmdbImageUrl } from '@/utils/tmdb'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildWebPageSchema, serializeJsonLd } from '@/utils/schema'
import Reveal from '@/app/components/Reveal'

const ABOUT_DESCRIPTION =
  'An editorial profile of Sophie Thatcher — her Chicago roots, family of artists, breakout work, and the personal details that shape her creative world.'

export const metadata: Metadata = {
  title: 'About · Sophie Thatcher',
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About · Sophie Thatcher',
    description: ABOUT_DESCRIPTION,
    url: '/about',
    type: 'website',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'About · Sophie Thatcher',
      },
    ],
  },
  twitter: {
    title: 'About · Sophie Thatcher',
    description: ABOUT_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

const QUOTES = [
  {
    context: 'On growing up Mormon',
    quote:
      "It was hard growing up Mormon. I don't think it's evil, I just don't think it's right for me.",
  },
  {
    context: 'On being labeled a scream queen',
    quote:
      "People have called me a scream queen, but I'm so much more than that. Hopefully one day I'll be in a movie where I'm not being tortured.",
  },
  {
    context: 'On Companion',
    quote: "It feels like a blank slate. I just don't want to be put in a box.",
  },
  {
    context: 'On her music',
    quote: 'I felt like the conductor in this insane little experiment.',
  },
]

const TIMELINE = [
  {
    eyebrow: 'Age 11 · Theatre',
    title: 'Stage roots',
    detail:
      'Oliver!, Seussical, The Diary of Anne Frank, and The Secret Garden — the first chapter of her craft.',
    weight: 'lg',
  },
  {
    eyebrow: '2018 · Film debut',
    title: 'Prospect',
    detail:
      'Co-starring opposite Pedro Pascal, a billed debut for a newcomer; premiered at SXSW and landed 89% on Rotten Tomatoes.',
    weight: 'md',
  },
  {
    eyebrow: '2021–present · Breakthrough',
    title: 'Yellowjackets',
    detail: '29 episodes as Teen Natalie Scatorccio.',
    weight: 'lg',
  },
  {
    eyebrow: '2025 · Recognition',
    title: "Critics' Choice Super Award",
    detail: 'Honored for Companion.',
    weight: 'sm',
  },
]

export default async function AboutPage() {
  const portraitPath = await getBestPersonPortrait()
  const heroImage = getTmdbImageUrl(portraitPath, 'w1280')

  return (
    <main className="relative bg-[var(--bg-base)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildWebPageSchema({
              name: 'About · Sophie Thatcher',
              description: ABOUT_DESCRIPTION,
              path: '/about',
            })
          ),
        }}
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {heroImage && (
            <Image
              src={heroImage}
              alt="Sophie Thatcher"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_15%] opacity-70"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,7,4,0.55)] via-[rgba(8,7,4,0.75)] to-[var(--bg-base)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(232,137,12,0.18),transparent_55%)]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-20 pt-28 sm:px-10 sm:pb-28 sm:pt-36">
          <Reveal immediate stagger={0.1} y={24}>
            <p className="text-[0.72rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
              About
            </p>
            <h1 className="mt-6 font-display text-[clamp(3.2rem,9vw,7.6rem)] font-semibold leading-[0.92] tracking-[-0.02em] text-[var(--text-primary)]">
              Sophie Bathsheba Thatcher
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-[0.68rem] uppercase tracking-[0.4em] text-[var(--accent-amber)]">
              <span>18 October 2000</span>
              <span className="h-px w-10 bg-[var(--accent-amber)]/50" />
              <span>Chicago, Illinois</span>
              <span className="h-px w-10 bg-[var(--accent-amber)]/50" />
              <span>25 years</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
        <Reveal stagger={0.12} y={30}>
          <div className="grid grid-cols-1 gap-10 border-b border-[var(--border-subtle)] pb-14 lg:grid-cols-[0.6fr_1.4fr]">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                The person
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.3vw,3.6rem)] font-medium leading-[1.02] text-[var(--text-primary)]">
                A family of artists, a Chicago childhood, and a personal compass.
              </h2>
            </div>
            <div className="space-y-6 text-base leading-[1.9] text-[var(--text-secondary)] text-pretty">
              <p>
                Born in Chicago and raised in Evanston, Sophie Thatcher grew up inside a family
                that was constantly making things. Her mother is a pianist and piano teacher; her
                sister Emma is a filmmaker who directed Provo (2022), where Sophie served as an
                executive producer; her brother Alexander writes; and her identical twin Ellie is a
                visual artist.
              </p>
              <p>
                She was raised Mormon, a background she left in her early teens. That history
                stayed with her and made her role as Sister Barnes in Heretic feel personal. As she
                put it: &ldquo;It was hard growing up Mormon. I don&rsquo;t think it&rsquo;s evil,
                I just don&rsquo;t think it&rsquo;s right for me.&rdquo;
              </p>
              <p>
                Today she lives in Los Angeles, tucked into a discreet canyon, balancing screen
                work with music and the small rituals that keep her grounded.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28 sm:px-10">
        <Reveal stagger={0.12} y={30}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
                The career
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.3vw,3.6rem)] font-medium leading-[1.02] text-[var(--text-primary)]">
                A timeline with weight.
              </h2>
              <p className="mt-4 text-sm leading-[1.8] text-[var(--text-muted)] text-pretty">
                From early theatre to a breakout series and a major award, each chapter carries a
                different scale.
              </p>
            </div>
            <div className="relative pl-6">
              <span className="absolute left-1 top-2 h-full w-px bg-gradient-to-b from-[var(--accent-amber)]/60 via-[var(--border-strong)] to-transparent" />
              <div className="space-y-8">
                {TIMELINE.map((item) => (
                  <div key={item.title} className="relative">
                    <span className="absolute -left-[9px] top-2 h-3 w-3 rounded-full bg-[var(--accent-amber)] shadow-[0_0_16px_rgba(232,137,12,0.6)]" />
                    <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                      {item.eyebrow}
                    </p>
                    <h3
                      className={`mt-3 font-display italic text-[var(--text-primary)] ${
                        item.weight === 'lg'
                          ? 'text-3xl sm:text-4xl'
                          : item.weight === 'md'
                            ? 'text-2xl sm:text-3xl'
                            : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.8] text-[var(--text-secondary)] text-pretty">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28 sm:px-10">
        <Reveal stagger={0.1} y={26}>
          <div className="border-y border-[var(--border-subtle)] py-14">
            <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
              In her own words
            </p>
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {QUOTES.map((item) => (
                <figure
                  key={item.quote}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-8"
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                    {item.context}
                  </p>
                  <blockquote className="mt-5 font-display text-[clamp(1.4rem,3vw,2.2rem)] italic leading-[1.2] text-[var(--text-primary)]">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
        <Reveal stagger={0.12} y={26}>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
              The small details
            </p>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.3vw,3.6rem)] font-medium leading-[1.02] text-[var(--text-primary)]">
              The quiet specifics that make her feel close.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-8">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                Rituals
              </p>
              <p className="mt-4 font-display text-2xl italic text-[var(--text-primary)]">
                The Sims 3 and Gilmore Girls, watched with candles lit.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-8 lg:row-span-2">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                Sound
              </p>
              <p className="mt-4 font-display text-3xl italic leading-[1.15] text-[var(--text-primary)]">
                Voice, synthesizer, and guitar — with a label named after her middle name: Bathsheba
                Records.
              </p>
              <p className="mt-6 text-sm leading-[1.8] text-[var(--text-secondary)] text-pretty">
                She describes the process like a conductor shaping a small, intense experiment.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-8">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                Family mirror
              </p>
              <p className="mt-4 font-display text-2xl italic text-[var(--text-primary)]">
                Her identical twin, Ellie Thatcher, is a visual artist.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-8">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                Home base
              </p>
              <p className="mt-4 font-display text-2xl italic text-[var(--text-primary)]">
                Los Angeles, tucked into a discreet canyon.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-8">
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-[var(--text-muted)]">
                Heartline
              </p>
              <p className="mt-4 font-display text-2xl italic text-[var(--text-primary)]">
                Austin Feinstein, her partner since April 2022.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28 sm:px-10">
        <Reveal stagger={0.12} y={24}>
          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-[var(--border-subtle)] pt-10">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--text-muted)]">
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
                className="rounded-full bg-[var(--accent-amber)] px-7 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_40px_rgba(255,183,0,0.45)]"
              >
                Music
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
