'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Props {
  children: ReactNode
  selector?: string
  stagger?: number
  delay?: number
  y?: number
  duration?: number
  immediate?: boolean
  className?: string
}

export default function Reveal({
  children,
  selector,
  stagger = 0.08,
  delay = 0,
  y = 32,
  duration = 0.7,
  immediate = false,
  className,
}: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const targets = selector
      ? Array.from(el.querySelectorAll<HTMLElement>(selector))
      : (Array.from(el.children) as HTMLElement[])

    if (targets.length === 0) return

    const rect = el.getBoundingClientRect()
    const isAboveFold = rect.top < window.innerHeight && rect.bottom > 0

    if (immediate || isAboveFold) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          targets,
          { opacity: 0.3, y: Math.min(y, 16) },
          {
            opacity: 1,
            y: 0,
            duration: Math.min(duration, 0.5),
            delay: Math.min(delay, 0.05),
            stagger: Math.min(stagger, 0.04),
            ease: 'power2.out',
            clearProps: 'all',
          }
        )
      }, root)
      return () => ctx.revert()
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: Math.min(duration, 0.6),
          delay,
          stagger,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
        }
      )
    }, root)

    return () => ctx.revert()
  }, [selector, stagger, delay, y, duration, immediate])

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  )
}
