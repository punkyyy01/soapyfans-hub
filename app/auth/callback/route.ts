import { createClient } from '@/utils/supabase/server'
import { getSiteUrl } from '@/utils/site'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  const host = request.headers.get('host')
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https'
    return `${proto}://${host}`
  }
  try {
    return new URL(request.url).origin
  } catch {
    return getSiteUrl()
  }
}

export async function GET(request: Request) {
  const origin = getOrigin(request)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Open redirect protection: validate that next is a relative path
  const nextRaw = searchParams.get('next') ?? '/'
  const next =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
      ? nextRaw
      : '/'

  // Handle provider-level error (e.g. user cancelled OAuth consent)
  if (error) {
    console.warn(`[OAuth Callback] Provider returned error: ${error} - ${errorDescription}`)
    const message = encodeURIComponent(
      errorDescription || error || 'Authentication was cancelled or failed'
    )
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  if (!code) {
    console.warn('[OAuth Callback] Missing authorization code in request')
    return NextResponse.redirect(`${origin}/login?error=Missing+authorization+code`)
  }

  try {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[OAuth Callback] Failed to exchange code for session:', exchangeError)
      const message = encodeURIComponent(
        exchangeError.message || 'Could not complete authentication'
      )
      return NextResponse.redirect(`${origin}/login?error=${message}`)
    }

    // Verify authenticated user & check if banned
    const user = data?.user ?? (await supabase.auth.getUser()).data.user
    if (user) {
      const { data: ban } = await supabase
        .from('banned_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (ban) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?banned=true`)
      }

      // Ensure profile exists in profiles table
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          const meta = (user.user_metadata ?? {}) as Record<string, any>
          const rawName =
            meta.full_name ||
            meta.name ||
            meta.preferred_username ||
            meta.user_name ||
            (user.email ? user.email.split('@')[0] : 'User')
          const avatarUrl = meta.avatar_url || meta.picture || null

          await supabase.from('profiles').upsert(
            {
              id: user.id,
              display_name: rawName,
              avatar_url: avatarUrl,
              show_activity: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id', ignoreDuplicates: true }
          )
        }
      } catch (profileErr) {
        console.warn('[OAuth Callback] Non-fatal profile check/upsert warning:', profileErr)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (err: any) {
    console.error('[OAuth Callback] Unexpected exception during authentication callback:', err)
    const message = encodeURIComponent(
      err?.message || 'An unexpected error occurred during authentication'
    )
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }
}
