import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from './database.types'

export const getUser = cache(async () => {
  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))

  if (!hasAuthCookie) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )
}
