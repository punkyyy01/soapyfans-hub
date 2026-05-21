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
  duration = 0.9,
  immediate = false,
  className,
}: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const targets = selector
      ? Array.from(el.querySelectorAll<HTMLElement>(selector))
      : (Array.from(el.children) as HTMLElement[])

    if (targets.length === 0) return

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y })
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'expo.out',
        scrollTrigger: immediate
          ? undefined
          : {
              trigger: el,
              start: 'top 85%',
              once: true,
            },
      })
    }, root)

    return () => ctx.revert()
  }, [selector, stagger, delay, y, duration, immediate])

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  )
}
