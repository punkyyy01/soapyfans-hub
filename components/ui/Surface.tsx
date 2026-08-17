import type { ElementType, ReactNode } from 'react'

export type SurfaceVariant = 'flat' | 'base' | 'elevated' | 'card' | 'feature'

interface SurfaceProps {
  as?: ElementType
  variant?: SurfaceVariant
  children: ReactNode
  className?: string
}

const VARIANT_CLASSES: Record<SurfaceVariant, string> = {
  flat: 'surface-flat',
  base: 'surface-base p-6 sm:p-8',
  elevated: 'surface-elevated p-6 sm:p-8',
  card: 'surface-card p-6',
  feature: 'surface-feature p-8 sm:p-10',
}

export function Surface({
  as: Component = 'div',
  variant = 'base',
  children,
  className = '',
}: SurfaceProps) {
  return (
    <Component className={`${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </Component>
  )
}

export default Surface
