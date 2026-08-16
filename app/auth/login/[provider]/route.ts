import { createClient } from '@/utils/supabase/server'
import { getSiteUrl } from '@/utils/site'
import { NextResponse } from 'next/server'
import type { Provider } from '@supabase/supabase-js'

const ALLOWED_PROVIDERS = ['discord', 'google'] as const
type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number]

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  return handleOAuth(request, await params)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  return handleOAuth(request, await params)
}

async function handleOAuth(
  request: Request,
  { provider }: { provider: string }
) {
  if (!ALLOWED_PROVIDERS.includes(provider as AllowedProvider)) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=Unsupported+OAuth+provider`)
  }

  const { searchParams } = new URL(request.url)
  const nextRaw = searchParams.get('next') ?? '/'
  const next =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
      ? nextRaw
      : '/'

  const supabase = await createClient()
  const callbackUrl = new URL('/auth/callback', getSiteUrl())
  if (next !== '/') {
    callbackUrl.searchParams.set('next', next)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: callbackUrl.toString(),
      ...(provider === 'google' && {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }),
    },
  })

  if (error || !data.url) {
    const errorMsg = encodeURIComponent(error?.message || `Could not initiate ${provider} sign in`)
    return NextResponse.redirect(`${getSiteUrl()}/login?error=${errorMsg}`)
  }

  return NextResponse.redirect(data.url, { status: 303 })
}
