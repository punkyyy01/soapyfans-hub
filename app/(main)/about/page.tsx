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
                  Sophie Thatcher was born in Chicago in 2000 and spent her early years in Hyde Park before her family later moved to Lake Forest and Evanston. She grew up in a musical and creatively minded household: her mother is a piano teacher, and her siblings have pursued creative work of their own, including writing, filmmaking, and visual art. From an early age, music, storytelling, and performance were already part of her everyday life.
                </p>

                <p>
                  Thatcher began acting as a child and trained in the performing arts from a young age. By eleven, she was performing professionally in Chicago, taking on the role of Mary Lennox in <em>The Secret Garden</em>. She later appeared in productions including <em>Oliver!</em>, <em>Seussical</em>, and <em>The Diary of Anne Frank</em>. Those early years gave her a substantial foundation in theatre, with <em>The Secret Garden</em> standing out in her own recollections as an especially important early professional experience.
                </p>

                <p>
                  Her move into screen acting began with smaller television and film appearances before her feature-film debut in <em>Prospect</em> (2018), where she played Cee alongside Pedro Pascal. From there, she continued working across television and independent film, gradually taking on more substantial roles.
                </p>

                <p>
                  Her breakthrough came with <em>Yellowjackets</em>, which premiered in 2021. As teenage Natalie Scatorccio, Thatcher became one of the show’s central young performers, portraying a character defined by toughness, vulnerability, isolation, and a strong sense of right and wrong. The show’s creators have described Natalie as its moral center, while Thatcher herself has spoken about recognizing parts of her own personality in the character, particularly her more solitary nature.
                </p>

                <p>
                  Her film work has continued to move between very different genres and characters. In <em>Heretic</em> (2024), she played Sister Barnes, drawing in part on her own upbringing within the Mormon community. Rather than simply studying the character from the outside, Thatcher incorporated mannerisms and habits she remembered from her own youth into the performance. In <em>Companion</em> (2025), she took on the role of Iris, continuing her progression into science fiction and psychological thriller territory.
                </p>

                <p>
                  Music has developed alongside acting as another major part of Thatcher’s creative life. She grew up singing and studying music, and later began experimenting with songwriting and electronic production. During a period of isolation, she started working with Ableton and gradually developed a more personal music-making process. In October 2024, she released her debut EP, <em>Pivot &amp; Scrape</em>. Thatcher has described music as a particularly direct form of creative expression, giving her a level of control over the work that acting cannot always provide.
                </p>

                <p>
                  Across theatre, film, television, and music, Thatcher’s career has developed through curiosity rather than a single fixed path. Each stage has opened the door to something different, but the same interest in storytelling, experimentation, and creative expression runs through all of it.
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
