import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const getUser = cache(async () => {
  // middleware.ts already calls supabase.auth.getUser() for every request
  // and forwards the validated id/email here -- reusing it skips a second
  // /auth/v1/user round trip on every navigation. Only id/email are ever
  // read off the result elsewhere (grepped: components/ui/Navbar.tsx is the
  // only other `.email` access), so a minimal reconstruction is enough; the
  // real auth check still happened in middleware moments earlier.
  const headerList = await headers()
  const headerUserId = headerList.get('x-sb-user-id')
  if (headerUserId) {
    const headerUserEmail = headerList.get('x-sb-user-email')
    return {
      id: headerUserId,
      email: headerUserEmail ?? undefined,
    } as unknown as User
  }

  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith('sb-') &&
        Boolean(cookie.value) &&
        cookie.value.trim() !== '' &&
        cookie.value !== '""' &&
        cookie.value !== '[]'
    )

  if (!hasAuthCookie) return null

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[getUser] Supabase auth.getUser() failed:', error)
      return null
    }
    return user
  } catch (err) {
    console.error('[getUser] Unexpected exception:', err)
    return null
  }
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[getAuthUserWithProfile] Failed to fetch profile:', error)
    }

    const profileHref = `/profile/${profile?.username ?? user.id}`
    return { user, profile: profile ?? null, profileHref }
  } catch (err) {
    console.error('[getAuthUserWithProfile] Unexpected exception:', err)
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
