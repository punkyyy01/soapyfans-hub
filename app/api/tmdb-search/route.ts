import { NextRequest, NextResponse } from 'next/server'
import { getPersonCombinedCredits, getTmdbImageUrl } from '@/utils/tmdb'

const SOPHIE_ID = 1981044
const CACHE_SECONDS = 3600

// In-memory rate limiting (per serverless instance)
const searchAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = 60_000 // 1 minute
  const limit = 30

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
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = req.nextUrl
  const q    = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? 'all'

  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters.' },
      { status: 400 },
    )
  }

  const qLower = q.toLowerCase()

  let credits
  try {
    credits = await getPersonCombinedCredits(SOPHIE_ID)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch credits from TMDB. Please try again.' },
      { status: 502 },
    )
  }

  const seen = new Set<string>()
  const matched: {
    tmdb_id: number
    media_type: 'movie' | 'tv'
    title: string
    year: string | null
    poster_url: string | null
    _date: string
  }[] = []

  for (const credit of [...credits.cast, ...credits.crew]) {
    // Type filter
    if (type === 'movie' && credit.media_type !== 'movie') continue
    if (type === 'tv'    && credit.media_type !== 'tv')    continue

    // Deduplicate by (id, media_type)
    const key = `${credit.id}-${credit.media_type}`
    if (seen.has(key)) continue
    seen.add(key)

    const title = credit.media_type === 'movie' ? credit.title : credit.name
    if (!title.toLowerCase().includes(qLower)) continue

    const date =
      credit.media_type === 'movie'
        ? (credit.release_date ?? '')
        : (credit.first_air_date ?? '')

    matched.push({
      tmdb_id:    credit.id,
      media_type: credit.media_type,
      title,
      year:       date ? date.slice(0, 4) : null,
      poster_url: getTmdbImageUrl(credit.poster_path, 'w185'),
      _date:      date,
    })
  }

  // Sort by date descending, unknowns last
  matched.sort((a, b) => {
    if (!a._date && !b._date) return 0
    if (!a._date) return 1
    if (!b._date) return -1
    return b._date.localeCompare(a._date)
  })

  const results = matched.slice(0, 12).map(({ _date: _, ...r }) => r)

  return NextResponse.json(
    { results },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
      },
    },
  )
}
