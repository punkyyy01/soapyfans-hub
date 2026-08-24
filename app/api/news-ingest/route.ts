// Cron entry point: pulls each configured RSS source, pre-filters by
// keyword, classifies survivors with Groq, and stores results in
// news_items via the service-role client (the only legitimate writer --
// see 20260824120100_add_news_items.sql). Triggered by
// .github/workflows/news-ingest-cron.yml, not Vercel Cron -- GitHub Actions
// has no Hobby-plan frequency cap, so this can run more often than once a day.

import Parser from 'rss-parser'
import { createAdminClient } from '@/utils/supabase/admin'
import { NEWS_SOURCES, passesKeywordFilter, extractImageFromRssItem, areSimilarTitles } from '@/utils/news'
import { classifyNewsItem } from '@/utils/news-classifier'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const OG_IMAGE_RE =
  /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i

/**
 * Fallback when the RSS item itself carries no image -- true for every
 * Google News search-feed item (that feed format has no media fields at
 * all, confirmed live: 100% of currently-approved items came from it and
 * all had image_url null). Scrapes the article's own og:image/twitter:image
 * meta tag instead. Only ever returns an absolute http(s) URL, same
 * contract as extractImageFromRssItem -- this becomes what
 * app/api/news-image/[id]/route.ts fetches later.
 */
async function extractImageFromArticlePage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SoapyFansHubBot/1.0; +https://soapyhub.fans)' },
    })
    if (!res.ok) {
      // TEMP diagnostic: every Google News item is coming back null here
      // with no thrown error, and this codepath had no logging at all --
      // this line exists to find out which case it actually is before
      // deciding on a real fix.
      console.log('[news-ingest] og:image fetch not ok:', res.status, res.url)
      return null
    }
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      console.log('[news-ingest] og:image fetch wrong content-type:', contentType, res.url)
      return null
    }

    const html = await res.text()
    // og:image/twitter:image live in <head>; stop at 64KB so a multi-MB
    // article body is never regex-scanned.
    const head = html.slice(0, 65536)
    const match = head.match(OG_IMAGE_RE)
    const src = match?.[1] ?? match?.[2] ?? null
    if (!src) {
      console.log('[news-ingest] og:image no meta tag found, final url:', res.url)
      return null
    }

    try {
      const parsed = new URL(src, url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
      return parsed.toString()
    } catch {
      return null
    }
  } catch (err) {
    console.log('[news-ingest] og:image fetch threw:', err)
    return null
  }
}

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'media:group', 'enclosure', 'content:encoded'],
  },
  // A normal-looking browser UA, not a spoof of any specific client --
  // some feed servers reject Node's unidentified default request outright.
  // (Doesn't help against People.com specifically; see utils/news.ts for
  // why that source is dropped instead.)
  requestOptions: {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SoapyFansHubBot/1.0; +https://soapyhub.fans)' },
  },
})

export async function GET(req: Request) {
  // Same fail-closed rule as films' write path and vzla-sismo-feed's
  // ingest route: if CRON_SECRET is unset in production, `authHeader !==
  // "Bearer undefined"` would otherwise let anyone trigger this by sending
  // that literal header value.
  if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
    return new Response('Server misconfiguration', { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  let processed = 0
  let approved = 0
  let rejected = 0
  let duplicates = 0

  // The Google News search feed returns the same real-world story multiple
  // times -- once per outlet it links to, each with its own opaque
  // redirect URL -- so the source_url dedup below never catches them. Load
  // recent titles once per run and check title similarity before spending
  // a Groq call on an item; anything inserted during this same run is
  // appended below so duplicates within one run (the common case) are also
  // caught, not just across runs.
  //
  // Filtered by created_at (when WE ingested it), not published_at (the
  // story's own original date) -- confirmed live: Google News resurfaced a
  // July 22 Variety story via IMDb on August 23, 33 days later. A
  // published_at filter had already aged the Variety row out of the
  // window by then, so the IMDb duplicate found nothing to match against
  // and was approved a second time. created_at reflects our own dedup
  // history and can't have that gap.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentItems } = await supabase
    .from('news_items')
    .select('title')
    .gte('created_at', thirtyDaysAgo)
  const recentTitles: string[] = (recentItems ?? []).map((r) => r.title)

  for (const source of NEWS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 20)) {
        const title = item.title ?? ''
        const description = item.contentSnippet ?? item.summary ?? ''
        const url = item.link ?? ''
        const pubDateRaw = new Date(item.pubDate ?? '')
        const publishedAt = Number.isNaN(pubDateRaw.getTime()) ? new Date() : pubDateRaw

        // Only ever store an http(s) link: it becomes both the public
        // "read the article" href and the dedup key below.
        if (!url || !url.startsWith('http') || !title) continue

        if (!passesKeywordFilter(title, description)) continue

        if (recentTitles.some((seen) => areSimilarTitles(seen, title))) {
          duplicates++
          continue
        }

        // maybeSingle() returns null (no error) when there are no rows;
        // single() throws for both "no rows" AND a real DB failure, which
        // would make a silent error look identical to "not seen yet" and
        // insert a duplicate.
        const { data: existing, error: checkError } = await supabase
          .from('news_items')
          .select('id')
          .eq('source_url', url)
          .maybeSingle()

        if (checkError) {
          console.error('[news-ingest] Error checking duplicate:', checkError.message)
          continue
        }
        if (existing) {
          duplicates++
          continue
        }

        processed++

        const result = await classifyNewsItem(title, description, source.name)
        if (!result) {
          // Classification attempt itself failed (network, rate limit,
          // malformed response) -- skip without inserting anything, so
          // source_url isn't marked "seen" and the next cron tick retries
          // this exact story fresh instead of it being stuck forever.
          await new Promise((r) => setTimeout(r, 2100))
          continue
        }
        const imageUrl = extractImageFromRssItem(item) ?? (await extractImageFromArticlePage(url))

        const { error: insertError } = await supabase.from('news_items').insert({
          source_name: source.name,
          source_url: url,
          title,
          description: description.slice(0, 500),
          image_url: imageUrl,
          tag: result.tag,
          status: result.status,
          confidence: result.confidence,
          published_at: publishedAt.toISOString(),
        })

        if (insertError) {
          // A concurrent run (or a second feed carrying the same story in
          // the same pass) can race this insert past the maybeSingle()
          // check above -- the unique index on source_url is the real
          // guard, this is just a duplicate losing the race, not a bug.
          if (insertError.code !== '23505') {
            console.error('[news-ingest] Error inserting:', insertError.message)
          }
          continue
        }

        recentTitles.push(title)

        if (result.status === 'approved') approved++
        else rejected++

        // openai/gpt-oss-120b's free tier is capped at 30 requests/minute
        // (confirmed via Groq's published limits) -- 300ms allowed up to
        // 200/min and was producing live 429s. 2.1s keeps every run
        // comfortably under ~28/min.
        await new Promise((r) => setTimeout(r, 2100))
      }
    } catch (err) {
      console.error(`[news-ingest] Error processing ${source.name}:`, err)
    }
  }

  // Backfill: approved rows that were inserted before this endpoint knew
  // how to scrape og:image (or whose source page failed transiently at
  // insert time) never get revisited otherwise -- news_items has no
  // per-run signal telling this route "try their image again", since
  // dedup is keyed on source_url. Capped at 5/run to keep this well
  // within maxDuration even on a cold run with many backlogged rows.
  let imagesBackfilled = 0
  try {
    const { data: missingImages } = await supabase
      .from('news_items')
      .select('id, source_url')
      .eq('status', 'approved')
      .is('image_url', null)
      .limit(5)

    for (const row of missingImages ?? []) {
      const image = await extractImageFromArticlePage(row.source_url)
      if (!image) continue
      const { error } = await supabase.from('news_items').update({ image_url: image }).eq('id', row.id)
      if (!error) imagesBackfilled++
    }
  } catch (err) {
    console.error('[news-ingest] Error backfilling images:', err)
  }

  return Response.json({
    ok: true,
    processed,
    approved,
    rejected,
    duplicates,
    imagesBackfilled,
    timestamp: new Date().toISOString(),
  })
}
