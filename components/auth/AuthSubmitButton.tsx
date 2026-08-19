'use client'

import { useFormStatus } from 'react-dom'
import Button from '@/components/ui/Button'
import type { ReactNode } from 'react'

export default function AuthSubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" isPending={pending}>
      {children}
      <span aria-hidden className="transition-transform duration-150 ease-out group-hover:translate-x-1">
        →
      </span>
    </Button>
  )
}
