// Same-origin image proxy for news thumbnails. News images live on
// unpredictable third-party domains (whatever outlet a story came from),
// so hotlinking them directly would mean growing the CSP img-src allowlist
// per source forever. Proxying keeps img-src untouched (this route is
// 'self') and, unlike a generic proxy, is not an open SSRF surface: the
// only URL ever fetched is the image_url our own ingest pipeline already
// chose and stored for an approved row -- callers can only pick a news
// item id, never a target URL.

import { createClient } from '@/utils/supabase/server'
import { decodeHtmlEntities } from '@/utils/news'

const MAX_BYTES = 5 * 1024 * 1024

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data } = await supabase
    .from('news_items')
    .select('image_url')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()

  if (!data?.image_url) {
    return new Response(null, { status: 404 })
  }

  const cleanUrl = decodeHtmlEntities(data.image_url).trim()

  let target: URL
  try {
    target = new URL(cleanUrl)
  } catch {
    return new Response(null, { status: 404 })
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return new Response(null, { status: 404 })
  }

  try {
    const upstream = await fetch(target, {
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: `${target.origin}/`,
      },
    })
    if (!upstream.ok) return new Response(null, { status: 404 })

    const contentType = upstream.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) return new Response(null, { status: 404 })

    const contentLength = Number(upstream.headers.get('content-length') ?? '0')
    if (contentLength > MAX_BYTES) return new Response(null, { status: 404 })

    const buffer = await upstream.arrayBuffer()
    if (buffer.byteLength > MAX_BYTES) return new Response(null, { status: 404 })

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
