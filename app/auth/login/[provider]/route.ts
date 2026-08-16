import { createClient } from '@/utils/supabase/server'
import { getSiteUrl } from '@/utils/site'
import { NextResponse } from 'next/server'
import type { Provider } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ALLOWED_PROVIDERS = ['discord', 'google'] as const
type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number]

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
  const origin = getOrigin(request)

  if (!ALLOWED_PROVIDERS.includes(provider as AllowedProvider)) {
    return NextResponse.redirect(`${origin}/login?error=Unsupported+OAuth+provider`)
  }

  const { searchParams } = new URL(request.url)
  const nextRaw = searchParams.get('next') ?? '/'
  const next =
    nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
      ? nextRaw
      : '/'

  try {
    const supabase = await createClient()
    const callbackUrl = new URL('/auth/callback', origin)
    if (next !== '/') {
      callbackUrl.searchParams.set('next', next)
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: callbackUrl.toString(),
        ...(provider === 'discord' && {
          scopes: 'identify email',
        }),
        ...(provider === 'google' && {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }),
      },
    })

    if (error || !data.url) {
      console.error(`[OAuth Init] Failed to initiate ${provider} auth:`, error)
      const errorMsg = encodeURIComponent(error?.message || `Could not initiate ${provider} sign in`)
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}`)
    }

    return NextResponse.redirect(data.url, { status: 303 })
  } catch (err: any) {
    console.error(`[OAuth Init] Unexpected exception for ${provider}:`, err)
    const errorMsg = encodeURIComponent(err?.message || `An unexpected error occurred during ${provider} sign in`)
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`)
  }
}
