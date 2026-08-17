import type { ElementType, ReactNode } from 'react'

export type ContainerSize = 'default' | 'narrow' | 'editorial' | 'dossier' | 'auth'

interface PageContainerProps {
  as?: ElementType
  size?: ContainerSize
  children: ReactNode
  className?: string
}

const SIZE_CLASSES: Record<ContainerSize, string> = {
  default: 'max-w-7xl',
  narrow: 'max-w-6xl',
  dossier: 'max-w-4xl',
  editorial: 'max-w-[720px]',
  auth: 'max-w-[420px]',
}

export function PageContainer({
  as: Component = 'div',
  size = 'default',
  children,
  className = '',
}: PageContainerProps) {
  return (
    <Component
      className={`mx-auto w-full px-6 sm:px-10 ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </Component>
  )
}

export default PageContainer
