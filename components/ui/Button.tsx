import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  external?: boolean
  isPending?: boolean
  children: ReactNode
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent-amber)] text-[var(--text-inverse)] font-medium hover:bg-[var(--accent-amber-hover)] active:brightness-95 shadow-[0_2px_12px_rgba(232,137,12,0.25)] hover:shadow-[0_4px_20px_rgba(232,137,12,0.4)]',
  secondary:
    'border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-amber)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-amber-dim)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
  danger:
    'border border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-950/50 hover:border-red-700/80',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[0.7rem] uppercase tracking-[0.14em]',
  md: 'px-5 py-2.5 text-xs uppercase tracking-[0.16em]',
  lg: 'px-7 py-3.5 text-xs uppercase tracking-[0.18em]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    href,
    external = false,
    isPending = false,
    disabled = false,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const baseClasses = `group inline-flex items-center justify-center gap-2.5 rounded-full transition-all duration-200 focus-ring cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
        >
          {children}
        </a>
      )
    }

    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isPending}
      className={baseClasses}
      {...rest}
    >
      {isPending ? (
        <>
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
})

export default Button
