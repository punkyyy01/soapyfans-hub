import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS: string[] = ['/dashboard-s9k2mx']

const GUEST_ONLY_PATHS = ['/login', '/register']

const ADMIN_EMAIL = 'aikodiaz45@gmail.com'

export async function updateSession(request: NextRequest) {
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

  const needsAuthCheck =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) ||
    GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p))

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))

  if (!hasAuthCookie && !needsAuthCheck) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user && user.email !== ADMIN_EMAIL) {
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
    if (!user || user.email !== ADMIN_EMAIL) {
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

  return supabaseResponse
}
