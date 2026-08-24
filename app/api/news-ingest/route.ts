// Cron entry point: pulls each configured RSS source, pre-filters by
// keyword, classifies survivors with Groq, and stores results in
// news_items via the service-role client (the only legitimate writer --
// see 20260824120100_add_news_items.sql). Triggered by
// .github/workflows/news-ingest-cron.yml, not Vercel Cron -- GitHub Actions
// has no Hobby-plan frequency cap, so this can run more often than once a day.

import Parser from 'rss-parser'
import { createAdminClient } from '@/utils/supabase/admin'
import { NEWS_SOURCES, passesKeywordFilter, extractImageFromRssItem } from '@/utils/news'
import { classifyNewsItem } from '@/utils/news-classifier'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'media:group', 'enclosure', 'content:encoded'],
  },
  // Some outlets (People.com confirmed) 403 a request with no User-Agent,
  // treating it as a bot -- this is a normal-looking browser UA, not a
  // spoof of any specific client.
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
        const imageUrl = extractImageFromRssItem(item)

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

        if (result.status === 'approved') approved++
        else rejected++

        // Stay well under Groq's free-tier rate limit.
        await new Promise((r) => setTimeout(r, 300))
      }
    } catch (err) {
      console.error(`[news-ingest] Error processing ${source.name}:`, err)
    }
  }

  return Response.json({
    ok: true,
    processed,
    approved,
    rejected,
    duplicates,
    timestamp: new Date().toISOString(),
  })
}
