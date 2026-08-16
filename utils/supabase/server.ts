import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
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

export type AuthUserWithProfile = {
  user: User | null
  profile: {
    username: string | null
    avatar_url: string | null
  } | null
  profileHref: string | null
}

export const getAuthUserWithProfile = cache(async (): Promise<AuthUserWithProfile> => {
  const user = await getUser()
  if (!user) {
    return { user: null, profile: null, profileHref: null }
  }

  try {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    const profileHref = `/profile/${profile?.username ?? user.id}`
    return { user, profile: profile ?? null, profileHref }
  } catch {
    return { user, profile: null, profileHref: `/profile/${user.id}` }
  }
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
