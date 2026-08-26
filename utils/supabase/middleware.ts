import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS: string[] = ['/dashboard-s9k2mx']

const GUEST_ONLY_PATHS = ['/login', '/register']

// In-memory rate limiting for auth POST requests (per serverless instance)
const authAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = 60_000 // 1 minute
  const limit = 10

  const record = authAttempts.get(ip)
  if (!record || record.resetAt < now) {
    authAttempts.set(ip, { count: 1, resetAt: now + window })
    return false
  }
  record.count++
  return record.count > limit
}

export function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : 'tcskvcmtcsaxyfoselvb.supabase.co'

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://image.tmdb.org https://cdn.discordapp.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://${supabaseHost} https://*.supabase.co https://*.scdn.co https://*.spotifycdn.com https://*.bcbits.com https://*.mzstatic.com`,
    `connect-src 'self' https://${supabaseHost} https://*.supabase.co wss://${supabaseHost} wss://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
    `form-action 'self' https://${supabaseHost} https://*.supabase.co https://accounts.google.com https://discord.com https://*.discord.com`,
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ')
}

export async function updateSession(request: NextRequest, nonce: string = '') {
  if (request.method === 'POST') {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    const forwardedHost = request.headers.get('x-forwarded-host')

    if (origin && (host || forwardedHost)) {
      const allowed = new Set<string>([
        ...(host ? [`https://${host}`, `http://${host}`] : []),
        ...(forwardedHost ? [`https://${forwardedHost}`, `http://${forwardedHost}`] : []),
        ...(process.env.NEXT_PUBLIC_SITE_URL
          ? [process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')]
          : []),
      ])

      if (!allowed.has(origin)) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
  }

  const { pathname } = request.nextUrl

  // Rate limit auth POST requests
  if (
    GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p)) &&
    request.method === 'POST'
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith('sb-') &&
        Boolean(cookie.value) &&
        cookie.value.trim() !== '' &&
        cookie.value !== '""' &&
        cookie.value !== '[]'
    )

  // Forward nonce to Server Components via request headers
  const requestHeaders = new Headers(request.headers)
  if (nonce) requestHeaders.set('x-nonce', nonce)

  // Strip any client-supplied values before we possibly set our own below --
  // these headers carry the already-validated user across to the RSC render
  // (see utils/supabase/server.ts getUser()), so an inbound header from the
  // request itself must never survive into requestHeaders.
  requestHeaders.delete('x-sb-user-id')
  requestHeaders.delete('x-sb-user-email')

  // If there's no auth cookie, user is unauthenticated
  if (!hasAuthCookie) {
    if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?next=${encodeURIComponent(pathname + (request.nextUrl.search ?? ''))}`
      return NextResponse.redirect(url)
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (nonce) {
      response.headers.set('x-nonce', nonce)
      response.headers.set('Content-Security-Policy', buildCsp(nonce))
    }
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (nonce) {
      response.headers.set('x-nonce', nonce)
      response.headers.set('Content-Security-Policy', buildCsp(nonce))
    }
    return response
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: ban } = await supabase
      .from('banned_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (ban) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = '?banned=true'
      const redirectResponse = NextResponse.redirect(url)
      request.cookies
        .getAll()
        .filter((c) => c.name.startsWith('sb-'))
        .forEach((c) => redirectResponse.cookies.delete(c.name))
      return redirectResponse
    }
  }

  if (pathname.startsWith('/dashboard-s9k2mx')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  if (!user && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + (request.nextUrl.search ?? ''))}`
    return NextResponse.redirect(url)
  }

  if (user && GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Forward the already-validated user to the RSC render so getUser() there
  // (utils/supabase/server.ts) can skip its own /auth/v1/user round trip --
  // that duplicate call was showing up as a real chunk of navigation latency.
  // Rebuilt (rather than just requestHeaders.set(...) earlier) because
  // NextResponse.next({ request: { headers } }) snapshots headers at
  // construction time, and supabaseResponse may already have been built
  // (or rebuilt via the cookie setAll callback above) before `user` was
  // known -- so any cookies Supabase already queued are copied across.
  if (user) {
    requestHeaders.set('x-sb-user-id', user.id)
    if (user.email) requestHeaders.set('x-sb-user-email', user.email)
    const freshResponse = NextResponse.next({ request: { headers: requestHeaders } })
    supabaseResponse.cookies.getAll().forEach((c) => freshResponse.cookies.set(c))
    supabaseResponse = freshResponse
  }

  if (nonce) {
    supabaseResponse.headers.set('x-nonce', nonce)
    supabaseResponse.headers.set('Content-Security-Policy', buildCsp(nonce))
  }

  return supabaseResponse
}
