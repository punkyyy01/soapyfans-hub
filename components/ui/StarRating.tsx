'use client'

import { useState } from 'react'

interface Props {
  value: number
  max?: number
  onChange?: (value: number) => void
  size?: 'sm' | 'lg'
  label?: string
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-xs gap-0.5',
  lg: 'text-2xl gap-1.5',
}

export default function StarRating({ value, max = 5, onChange, size = 'sm', label = 'Rating', className = '' }: Props) {
  const [hovered, setHovered] = useState(0)
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  if (!onChange) {
    return (
      <span
        className={`inline-flex items-center font-mono leading-none text-[var(--accent-gold)] ${SIZE_CLASSES[size]} ${className}`}
        aria-label={`${value} out of ${max} stars`}
      >
        {stars.map((star) => (
          <span key={star} aria-hidden="true" className={star > value ? 'text-[var(--text-muted)]' : undefined}>
            {star <= value ? '★' : '☆'}
          </span>
        ))}
      </span>
    )
  }

  const active = hovered || value

  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center leading-none ${SIZE_CLASSES[size]} ${className}`}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} out of ${max} stars`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`transition-all duration-150 focus-ring rounded-xs cursor-pointer p-0.5 ${
            star <= active
              ? 'text-[var(--accent-gold)] scale-110'
              : 'text-[var(--text-muted)] hover:text-[var(--accent-amber)]'
          }`}
        >
          {star <= active ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
