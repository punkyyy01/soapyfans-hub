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
    }, 4000)
    return () => clearInterval(interval)
  }, [portraitUrls.length])

  useEffect(() => {
    const el = root.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      tl.fromTo(
        '[data-hero-eyebrow]',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35 }
      )
        .fromTo(
          '[data-hero-title]',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45 },
          '-=0.2'
        )
        .fromTo(
          '[data-hero-portrait]',
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.35'
        )
        .fromTo(
          '[data-hero-tagline]',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35 },
          '-=0.3'
        )
        .fromTo(
          '[data-hero-cta]',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 },
          '-=0.25'
        )
        .fromTo(
          '[data-hero-meta]',
          { opacity: 0 },
          { opacity: 1, duration: 0.35, stagger: 0.04 },
          '-=0.2'
        )

      // Parallax scroll triggers on desktop
      if (window.innerWidth >= 1024) {
        gsap.to('[data-hero-bg]', {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        })

        gsap.to('[data-hero-portrait]', {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        })
      }
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      className="relative min-h-[90vh] w-full overflow-hidden sm:min-h-[720px] flex items-center"
    >
      <div data-hero-bg className="absolute inset-0 -z-10 scale-[1.05]">
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%] opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.7)] to-[rgba(8,7,4,0.3)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(8,7,4,0.5)] to-transparent" />
      </div>

      <div
        data-hero-content
        className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-12 gap-x-6 px-6 pb-16 pt-24 sm:px-10 sm:pb-20 sm:pt-28 lg:gap-x-10 lg:pt-32"
      >
        <div className="order-last col-span-12 flex flex-col justify-end lg:order-first lg:col-span-8 lg:justify-center">
          <p
            data-hero-eyebrow
            className="mb-4 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]"
          >
            <span>SoapyFans Hub</span>
            <span className="text-[var(--border-default)]">/</span>
            <span>Sophie Thatcher Fan Archive</span>
          </p>

          <div data-hero-title className="space-y-2">
            <h1 className="font-display text-[clamp(2.8rem,7vw,5.4rem)] font-medium leading-[0.96] tracking-tight text-[var(--text-primary)]">
              The Sophie Thatcher Archive
            </h1>
          </div>

          <p
            data-hero-tagline
            className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base"
          >
            A dedicated community database cataloging the complete work of actress and musician Sophie Thatcher across film, television, and original recordings.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              data-hero-cta
              href="/films"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-amber)] px-5 py-2.5 text-xs uppercase tracking-[0.14em] font-medium text-[var(--text-inverse)] transition-all hover:bg-[var(--accent-amber-hover)] focus-ring"
            >
              <span>Browse filmography</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              data-hero-cta
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-xs uppercase tracking-[0.14em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:bg-[var(--accent-amber-dim)] focus-ring"
            >
              Sign in / Register
            </Link>
          </div>

          <div className="mt-10 hidden flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border-subtle)] pt-5 font-mono text-xs text-[var(--text-muted)] sm:flex">
            <span data-hero-meta>
              <strong className="font-medium text-[var(--text-primary)]">{filmCount.toString().padStart(2, '0')}</strong> indexed titles
            </span>
            <span className="text-[var(--border-default)]">·</span>
            <span data-hero-meta>
              Featured today: <span className="text-[var(--text-secondary)]">{featuredTitle}</span>
              {featuredYear ? ` (${featuredYear})` : ''}
            </span>
            <span className="text-[var(--border-default)]">·</span>
            <span data-hero-meta>
              Community archive
            </span>
          </div>
        </div>

        <div
          data-hero-portrait
          className="order-first col-span-12 lg:order-last lg:col-span-4 lg:mt-0 lg:self-center"
        >
          {portraitUrls.length > 0 && (
            <>
              <div className="relative h-64 w-full overflow-hidden rounded-xl lg:hidden">
                {portraitUrls.map((url, i) => {
                  const isActive = i === currentPortrait
                  const isNext = i === (currentPortrait + 1) % portraitUrls.length
                  if (!isActive && !isNext) return null
                  return (
                    <Image
                      key={url}
                      src={url}
                      alt="Sophie Thatcher"
                      fill
                      sizes="100vw"
                      className={`object-cover object-top transition-opacity duration-700 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )
                })}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-base)] to-transparent"
                />
              </div>

              <figure className="relative ml-auto hidden aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] sm:max-w-[400px] lg:block lg:max-w-none shadow-2xl">
                {portraitUrls.map((url, i) => {
                  const isActive = i === currentPortrait
                  const isNext = i === (currentPortrait + 1) % portraitUrls.length
                  if (!isActive && !isNext) return null
                  return (
                    <Image
                      key={url}
                      src={url}
                      alt="Sophie Thatcher"
                      fill
                      sizes="400px"
                      className={`object-cover object-[center_12%] transition-opacity duration-700 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )
                })}

                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-base)] via-[rgba(8,7,4,0.4)] to-transparent"
                />
              </figure>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

