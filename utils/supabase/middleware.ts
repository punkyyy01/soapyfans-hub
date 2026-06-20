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

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://image.tmdb.org https://cdn.discordapp.com https://tcskvcmtcsaxyfoselvb.supabase.co",
    "connect-src 'self' https://tcskvcmtcsaxyfoselvb.supabase.co wss://tcskvcmtcsaxyfoselvb.supabase.co",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ')
}

export async function updateSession(request: NextRequest, nonce: string = '') {
  if (request.method === 'POST') {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin && host) {
      const allowed = new Set<string>([
        `https://${host}`,
        `http://${host}`,
        ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
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

  const needsAuthCheck =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) ||
    GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p))

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))

  // Forward nonce to Server Components via request headers
  const requestHeaders = new Headers(request.headers)
  if (nonce) requestHeaders.set('x-nonce', nonce)

  if (!hasAuthCookie && !needsAuthCheck) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (nonce) {
      response.headers.set('x-nonce', nonce)
      response.headers.set('Content-Security-Policy', buildCsp(nonce))
    }
    return response
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  if (nonce) {
    supabaseResponse.headers.set('x-nonce', nonce)
    supabaseResponse.headers.set('Content-Security-Policy', buildCsp(nonce))
  }

  return supabaseResponse
}
