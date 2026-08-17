interface DividerProps {
  variant?: 'horizontal' | 'vertical' | 'section'
  className?: string
}

export function Divider({
  variant = 'horizontal',
  className = '',
}: DividerProps) {
  if (variant === 'vertical') {
    return (
      <span
        aria-hidden="true"
        className={`inline-block h-3.5 w-px bg-[var(--border-default)] ${className}`}
      />
    )
  }

  if (variant === 'section') {
    return (
      <hr
        className={`my-16 border-0 border-t border-[var(--border-subtle)] sm:my-20 ${className}`}
      />
    )
  }

  return (
    <hr
      className={`my-8 border-0 border-t border-[var(--border-subtle)] ${className}`}
    />
  )
}

export default Divider
