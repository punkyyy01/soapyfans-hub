'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Props {
  backdropUrl: string
  portraitUrls: string[]
  featuredTitle: string
  featuredYear: string | null
  filmCount: number
}

export default function Hero({
  backdropUrl,
  portraitUrls,
  featuredTitle,
  featuredYear,
  filmCount,
}: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [currentPortrait, setCurrentPortrait] = useState(0)

  useEffect(() => {
    if (portraitUrls.length <= 1) return
    const interval = setInterval(() => {
      setCurrentPortrait((prev) => (prev + 1) % portraitUrls.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [portraitUrls.length])

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const split = (selector: string) => {
        const node = el.querySelector<HTMLElement>(selector)
        if (!node) return [] as HTMLSpanElement[]
        const text = node.textContent ?? ''
        node.textContent = ''
        const frag = document.createDocumentFragment()
        const spans: HTMLSpanElement[] = []
        for (const word of text.split(/(\s+)/)) {
          if (/^\s+$/.test(word)) {
            frag.appendChild(document.createTextNode(word))
            continue
          }
          const wrap = document.createElement('span')
          wrap.className = 'inline-block overflow-hidden align-baseline'
          const inner = document.createElement('span')
          inner.className = 'inline-block will-change-transform'
          inner.textContent = word
          wrap.appendChild(inner)
          frag.appendChild(wrap)
          spans.push(inner)
        }
        node.appendChild(frag)
        return spans
      }

      const eyebrow = split('[data-hero-eyebrow]')
      const titleA = split('[data-hero-title-a]')
      const titleB = split('[data-hero-title-b]')
      const titleC = split('[data-hero-title-c]')
      const tagline = split('[data-hero-tagline]')

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

      tl.from(eyebrow, { yPercent: 120, opacity: 0, duration: 0.9, stagger: 0.04 })
        .from(titleA, { yPercent: 120, opacity: 0, duration: 1.3, stagger: 0.07 }, '-=0.6')
        .from(titleB, { yPercent: 120, opacity: 0, duration: 1.3, stagger: 0.07 }, '-=1.05')
        .from(titleC, { yPercent: 120, opacity: 0, duration: 1.3, stagger: 0.07 }, '-=1.05')
        .from('[data-hero-portrait]', { opacity: 0, duration: 1.5 }, '+=0.2')
        .from(tagline, { yPercent: 120, opacity: 0, duration: 1.0, stagger: 0.03 }, '-=0.95')
        .from('[data-hero-meta]', { opacity: 0, y: 20, duration: 0.8, stagger: 0.08 }, '-=0.6')
        .from('[data-hero-cta]', { opacity: 0, y: 18, duration: 0.7, stagger: 0.08 }, '-=0.5')
        .from('[data-hero-scroll]', { opacity: 0, y: 12, duration: 0.6 }, '-=0.4')

      gsap.to('[data-hero-bg]', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })

      gsap.to('[data-hero-portrait]', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })

      gsap.to('[data-hero-content]', {
        yPercent: -6,
        opacity: 0.55,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      className="relative min-h-[100svh] w-full overflow-hidden sm:min-h-[760px]"
    >
      <div data-hero-bg className="absolute inset-0 -z-10 scale-[1.08]">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%] opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.6)] to-[rgba(8,7,4,0.25)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.4)] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_45%,transparent_0%,rgba(8,7,4,0.45)_70%)]" />
      </div>

      <div
        data-hero-content
        className="relative z-10 mx-auto grid h-full max-w-7xl grid-cols-12 gap-x-6 px-6 pb-16 pt-24 sm:px-10 sm:pb-20 sm:pt-32 lg:gap-x-10 lg:pt-40"
      >
        <div className="order-last col-span-12 flex flex-col justify-end lg:order-first lg:col-span-8 lg:justify-center">
          <p
            data-hero-eyebrow
            className="mb-8 text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-gold)] ember"
          >
            SoapyFans Hub · a fan-made index · est. 2026
          </p>

          <h1 className="font-display font-semibold leading-[0.86] tracking-[-0.02em] text-[var(--text-primary)]">
            <span
              data-hero-title-a
              className="block text-[clamp(3.2rem,10vw,9rem)]"
            >
              A living
            </span>
            <span
              data-hero-title-b
              className="block pl-[8%] text-[clamp(2.6rem,8vw,7rem)] italic text-[var(--accent-amber)]"
            >
              field guide
            </span>
            <span
              data-hero-title-c
              className="block text-[clamp(3.6rem,11vw,10.5rem)] tracking-[-0.035em]"
            >
              to Sophie Thatcher.
            </span>
          </h1>

          <p
            data-hero-tagline
            className="mt-10 max-w-md text-sm leading-[1.7] text-[var(--text-secondary)] text-pretty sm:text-base"
          >
            Credits for the curious. Reviews for the people who rewatch.
            <span className="text-[var(--text-primary)]"> A home tab for fans.</span>
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              data-hero-cta
              href="/films"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[var(--accent-amber)] px-7 py-3 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_40px_rgba(255,183,0,0.45)]"
            >
              <span>Browse the index</span>
              <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              data-hero-cta
              href="/login"
              className="text-[0.7rem] uppercase tracking-[0.32em] text-[var(--text-secondary)] underline-offset-8 transition-colors hover:text-[var(--accent-gold)] hover:underline"
            >
              Create a profile
            </Link>
          </div>

          <div className="mt-14 hidden flex-wrap items-center gap-x-10 gap-y-4 border-t border-[var(--border-subtle)] pt-6 text-[0.68rem] uppercase tracking-[0.34em] text-[var(--text-muted)] sm:flex">
            <span data-hero-meta>
              <span className="text-[var(--text-secondary)]">
                {filmCount.toString().padStart(2, '0')}
              </span>{' '}
              titles indexed
            </span>
            <span data-hero-meta>
              Featured today ·{' '}
              <span className="text-[var(--accent-gold)]">{featuredTitle}</span>
              {featuredYear ? ` · ${featuredYear}` : ''}
            </span>
          </div>
        </div>

        <div
          data-hero-portrait
          className="order-first col-span-12 lg:order-last lg:col-span-4 lg:mt-0 lg:self-center"
        >
          {portraitUrls.length > 0 && (
            <>
              <div className="relative h-72 w-full overflow-hidden lg:hidden">
                {portraitUrls.map((url, i) => (
                  <Image
                    key={url}
                    src={url}
                    alt="Sophie Thatcher"
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={`object-cover object-top transition-opacity duration-700 ${
                      i === currentPortrait ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-base)] to-transparent"
                />
              </div>

              {/* Desktop: side portrait figure with slideshow */}
              <figure className="relative ml-auto hidden aspect-[3/4] w-full max-w-[360px] overflow-hidden sm:max-w-[420px] lg:block lg:max-w-none">
                {/* Vertical decorative rule + caption — magazine touch */}
                <span className="absolute -left-6 top-0 h-full w-px bg-gradient-to-b from-transparent via-[var(--accent-amber)]/40 to-transparent" />
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-left whitespace-nowrap text-[0.62rem] uppercase tracking-[0.5em] text-[var(--text-muted)] inline-block">
                  Portrait — via TMDB
                </span>

                {portraitUrls.map((url, i) => (
                  <Image
                    key={url}
                    src={url}
                    alt="Sophie Thatcher"
                    fill
                    priority={i === 0}
                    sizes="420px"
                    className={`object-cover object-[center_10%] sm:object-[center_15%] [filter:grayscale(0.2)_contrast(1.05)_brightness(0.92)] transition-opacity duration-700 ${
                      i === currentPortrait ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}

                {/* Amber duotone wash — color from our palette pulled across the image */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[rgba(232,137,12,0.32)] via-[rgba(232,137,12,0.05)] to-[rgba(42,92,63,0.18)] mix-blend-color"
                />
                {/* Vignette tying it back to the base */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-base)]"
                />
                {/* Side fades — dissolve into dark background */}
                <span aria-hidden className="absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-[var(--bg-base)] to-transparent" />
                <span aria-hidden className="absolute inset-y-0 right-0 w-[22%] bg-gradient-to-l from-[var(--bg-base)] to-transparent" />
                {/* Inner edge to anchor the figure */}
                <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[var(--accent-amber)]/15" />
              </figure>
            </>
          )}
        </div>
      </div>

      <div
        data-hero-scroll
        className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.62rem] uppercase tracking-[0.5em] text-[var(--text-muted)]"
      >
        <span>Scroll</span>
        <span className="block h-10 w-px animate-pulse bg-[var(--accent-amber)]/60" />
      </div>
    </section>
  )
}
