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

export default async function AboutPage() {
  const imagesData = await getPersonImages().catch(
    (): TmdbPersonImages => ({ id: 0, profiles: [] }),
  )

  const portraitUrls = getPortraitUrls(imagesData.profiles, 4, 'w780')
  const portraitUrl = portraitUrls[0] ?? null

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
        {/* ── 1. WELCOME ────────────────────────────────────────── */}
        <section aria-labelledby="welcome-heading" className="space-y-6 sm:space-y-8">
          <Reveal immediate stagger={0.06} y={14}>
            <div className="flex items-center gap-2.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--accent-amber)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]" />
              <span>Archive Profile · Welcome</span>
            </div>

            <h1
              id="welcome-heading"
              className="mt-3 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--text-primary)] text-balance"
            >
              The life and work of Sophie Thatcher.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-[1.8] text-[var(--text-secondary)] text-pretty sm:text-xl">
              Welcome to SoapyFans — a dedicated archival space documenting the life, career, and evolving artistry of Sophie Thatcher across stage, screen, and sound.
            </p>
          </Reveal>
        </section>

        {/* ── Subtle Editorial Divider ─────────────────────────── */}
        <hr className="my-14 sm:my-20 border-0 border-t border-[var(--border-subtle)]" />

        {/* ── 2. ABOUT SOPHIE (Her Life & Journey as Narrative) ── */}
        <section aria-labelledby="about-heading" className="space-y-10 sm:space-y-12">
          <Reveal stagger={0.06} y={18}>
            <div className="space-y-2">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--accent-amber)]">
                Biography &amp; Trajectory
              </p>
              <h2
                id="about-heading"
                className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text-primary)]"
              >
                About Sophie
              </h2>
            </div>

            {/* Editorial Narrative with Contained Portrait */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
              {/* Narrative Text */}
              <div className="lg:col-span-8 space-y-7 text-[1.02rem] leading-[1.88] text-[var(--text-secondary)] text-pretty sm:text-[1.06rem]">
                <p>
                  Born in Chicago’s Hyde Park and raised in Evanston, Illinois, Sophie Bathsheba Thatcher grew up inside a household deeply committed to artistic expression. Her mother, a pianist and vocal instructor, introduced classical training early; her twin sister Ellie is a visual artist and close creative companion; her sister Emma is an independent filmmaker; and her brother Alexander is a writer.
                </p>

                <p>
                  Her early foundation in the performing arts began on local stages at the age of four, progressing to a professional stage debut at eleven in <em>The Secret Garden</em>. Over the next six years across the Chicago repertory theatre scene — performing in productions of <em>Oliver!</em>, <em>Seussical</em>, and <em>The Diary of Anne Frank</em> — she developed the discipline, voice control, and stillness that would later define her screen presence.
                </p>

                <p>
                  Thatcher made her feature film debut in the sci-fi survival drama <em>Prospect</em> (2018) opposite Pedro Pascal, earning critical acclaim for an expressive, grounded performance delivered with remarkable restraint.
                </p>

                <p>
                  Her international breakthrough arrived with Showtime’s psychological drama <em>Yellowjackets</em> (2021–present), where her portrayal of teenage Natalie Scatorccio brought emotional vulnerability, intensity, and raw honesty to one of television&rsquo;s most celebrated ensemble casts.
                </p>

                <p>
                  Her screen trajectory has continued to expand with leading performances in A24’s theological thriller <em>Heretic</em> (2024), where her childhood familiarity with faith provided genuine depth to Sister Barnes, and the sci-fi thriller <em>Companion</em> (2025), showcasing her range across psychological tension and genre storytelling.
                </p>

                <p>
                  Parallel to her acting, Thatcher maintains a personal sonic practice composed in private since adolescence. Her 2024 debut EP, <em>Pivot &amp; Scrape</em>, reflects an intimate exploration of darkwave, analog textures, and atmosphere — a creative space that remains closely intertwined with how she envisions her characters and approaches the craft.
                </p>
              </div>

              {/* Contained, Restrained Portrait Plate */}
              {portraitUrl && (
                <div className="lg:col-span-4 flex flex-col items-center lg:items-end">
                  <figure className="w-full max-w-[260px] sm:max-w-[280px]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 shadow-md">
                      <div className="relative h-full w-full overflow-hidden rounded-[8px]">
                        <Image
                          src={portraitUrl}
                          alt="Sophie Thatcher"
                          fill
                          priority
                          sizes="(max-width: 640px) 260px, 280px"
                          className="object-cover object-[center_12%]"
                        />
                      </div>
                    </div>
                    <figcaption className="mt-2.5 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      <span>Sophie Thatcher</span>
                      <span>Archive Record</span>
                    </figcaption>
                  </figure>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      </PageContainer>
    </main>
  )
}
