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

      // Profile creation happens in the public.handle_new_user() DB trigger
      // (fires on auth.users INSERT, SECURITY DEFINER, always assigns a
      // valid unique username). RLS has no INSERT policy on profiles, so a
      // client-side upsert here would always be silently rejected -- this
      // check exists only to surface that trigger having failed.
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          console.error('[OAuth Callback] No profile row after sign-in; handle_new_user() trigger may have failed:', { userId: user.id })
        }
      } catch (profileErr) {
        console.warn('[OAuth Callback] Non-fatal profile existence check warning:', profileErr)
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
