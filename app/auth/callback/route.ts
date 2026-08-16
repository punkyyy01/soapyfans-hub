import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
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
    const message = encodeURIComponent(
      errorDescription || error || 'Authentication was cancelled or failed'
    )
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    const message = encodeURIComponent(
      exchangeError.message || 'Could not complete authentication'
    )
    return NextResponse.redirect(`${origin}/login?error=${message}`)
  }

  return NextResponse.redirect(`${origin}/login?error=Missing+authorization+code`)
}
