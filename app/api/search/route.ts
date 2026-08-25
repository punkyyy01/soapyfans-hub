import { NextRequest, NextResponse } from 'next/server'
import { runGlobalSearch } from '@/utils/search'

const CACHE_SECONDS = 30
const PALETTE_LIMIT = 5

// Same in-memory per-instance rate limiter as app/api/tmdb-search/route.ts.
const searchAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = 60_000
  const limit = 60 // live typing fires more requests than a one-shot search box

  if (searchAttempts.size > 500) {
    for (const [k, v] of searchAttempts) {
      if (v.resetAt < now) searchAttempts.delete(k)
    }
  }

  const record = searchAttempts.get(ip)
  if (!record || record.resetAt < now) {
    searchAttempts.set(ip, { count: 1, resetAt: now + window })
    return false
  }
  record.count++
  return record.count > limit
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const query = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100)

  if (query.length < 2) {
    return NextResponse.json({ profiles: [], titles: [], reviews: [], news: [] })
  }

  const results = await runGlobalSearch(query, PALETTE_LIMIT)

  return NextResponse.json(results, {
    headers: { 'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}` },
  })
}
