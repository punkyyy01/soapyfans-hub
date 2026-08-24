// Cron entry point: pulls each configured RSS source, pre-filters by
// keyword, classifies survivors with Groq, and stores results in
// news_items via the service-role client (the only legitimate writer --
// see 20260824120100_add_news_items.sql). Triggered by
// .github/workflows/news-ingest-cron.yml, not Vercel Cron -- GitHub Actions
// has no Hobby-plan frequency cap, so this can run more often than once a day.

import Parser from 'rss-parser'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  NEWS_SOURCES,
  passesKeywordFilter,
  extractImageFromRssItem,
  extractImageFromArticlePage,
  decodeGoogleNewsUrl,
  extractOutletName,
  normalizeNewsTitle,
  areSimilarTitles,
  decodeHtmlEntities,
} from '@/utils/news'
import { classifyNewsItem } from '@/utils/news-classifier'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'media:group', 'enclosure', 'content:encoded'],
  },
  requestOptions: {
    timeout: 8000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    },
  },
})

export async function GET(req: Request) {
  // Fail-closed rule: in production require valid CRON_SECRET authorization.
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

  // Load existing items without a 30-day cutoff so historical stories
  // never get re-approved when resurfaced weeks or months later by feeds.
  const { data: existingRows } = await supabase
    .from('news_items')
    .select('title, normalized_title, source_url, canonical_url, status')

  const seenUrls = new Set<string>()
  const seenNormalizedTitles = new Set<string>()
  const allKnownTitles: string[] = []

  for (const row of existingRows ?? []) {
    if (row.source_url) seenUrls.add(row.source_url)
    if (row.canonical_url) seenUrls.add(row.canonical_url)
    if (row.normalized_title) seenNormalizedTitles.add(row.normalized_title)
    if (row.title) {
      allKnownTitles.push(row.title)
      const norm = normalizeNewsTitle(row.title)
      if (norm) seenNormalizedTitles.add(norm)
    }
  }

  for (const source of NEWS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items.slice(0, 20)) {
        const rawTitle = item.title ?? ''
        const rawDescription = item.contentSnippet ?? item.summary ?? ''
        const url = item.link ?? ''
        const pubDateRaw = new Date(item.pubDate ?? '')
        const publishedAt = Number.isNaN(pubDateRaw.getTime()) ? new Date() : pubDateRaw

        if (!url || !url.startsWith('http') || !rawTitle) continue

        const title = decodeHtmlEntities(rawTitle).trim()
        const description = decodeHtmlEntities(rawDescription).trim()

        if (!passesKeywordFilter(title, description)) continue

        let canonicalUrl = url
        let outletName = source.name

        // Google News RSS URLs are opaque redirects; decode to real destination URL
        if (url.includes('news.google.com')) {
          const decoded = await decodeGoogleNewsUrl(url)
          if (decoded) {
            canonicalUrl = decoded
            outletName = extractOutletName(title, decoded, source.name)
          } else {
            outletName = extractOutletName(title, null, source.name)
          }
        }

        // 1. Direct URL check
        if (seenUrls.has(url) || seenUrls.has(canonicalUrl)) {
          duplicates++
          continue
        }

        // 2. Normalized title exact check
        const normalizedTitle = normalizeNewsTitle(title)
        if (normalizedTitle && seenNormalizedTitles.has(normalizedTitle)) {
          duplicates++
          continue
        }

        // 3. Similar title fuzzy check against known history
        if (allKnownTitles.some((seen) => areSimilarTitles(seen, title))) {
          duplicates++
          continue
        }

        // 4. DB check by source_url or canonical_url
        const { data: existingInDb, error: checkError } = await supabase
          .from('news_items')
          .select('id')
          .or(`source_url.eq."${url}",canonical_url.eq."${canonicalUrl}"`)
          .maybeSingle()

        if (checkError) {
          console.error('[news-ingest] Error checking duplicate:', checkError.message)
          continue
        }
        if (existingInDb) {
          duplicates++
          seenUrls.add(url)
          seenUrls.add(canonicalUrl)
          continue
        }

        processed++

        const result = await classifyNewsItem(title, description, outletName)
        if (!result) {
          // Classification attempt failed (network, rate limit, etc.) --
          // skip so next cron can retry fresh instead of losing the story.
          await new Promise((r) => setTimeout(r, 2100))
          continue
        }

        // Image extraction: prefer RSS media, then scrape destination page
        const imageUrl =
          extractImageFromRssItem(item) ?? (await extractImageFromArticlePage(canonicalUrl))

        const { error: insertError } = await supabase.from('news_items').insert({
          source_name: outletName,
          source_url: url,
          canonical_url: canonicalUrl,
          title,
          normalized_title: normalizedTitle,
          description: description.slice(0, 500),
          image_url: imageUrl,
          tag: result.tag,
          status: result.status,
          confidence: result.confidence,
          published_at: publishedAt.toISOString(),
        })

        if (insertError) {
          if (insertError.code !== '23505') {
            console.error('[news-ingest] Error inserting:', insertError.message)
          }
          continue
        }

        seenUrls.add(url)
        seenUrls.add(canonicalUrl)
        if (normalizedTitle) seenNormalizedTitles.add(normalizedTitle)
        allKnownTitles.push(title)

        if (result.status === 'approved') approved++
        else rejected++

        // Rate limiting pause for Groq free-tier
        await new Promise((r) => setTimeout(r, 2100))
      }
    } catch (err) {
      console.error(`[news-ingest] Error processing ${source.name}:`, err)
    }
  }

  // Backfill: Reprocess approved items that have missing images, undecoded Google News URLs,
  // or missing normalized titles so historical records are repaired.
  let imagesBackfilled = 0
  try {
    const { data: rowsToRepair } = await supabase
      .from('news_items')
      .select('id, title, source_name, source_url, canonical_url, image_url, normalized_title')
      .eq('status', 'approved')
      .or('image_url.is.null,source_url.like.%news.google.com%,canonical_url.is.null,normalized_title.is.null')
      .limit(25)

    for (const row of rowsToRepair ?? []) {
      let targetUrl = row.canonical_url || row.source_url
      let newCanonical = row.canonical_url
      let newSourceName = row.source_name
      let newNormalized = row.normalized_title || normalizeNewsTitle(row.title)

      if (row.source_url.includes('news.google.com') && !row.canonical_url) {
        const decoded = await decodeGoogleNewsUrl(row.source_url)
        if (decoded) {
          newCanonical = decoded
          targetUrl = decoded
          if (row.source_name === 'Google News') {
            newSourceName = extractOutletName(row.title, decoded, 'Google News')
          }
        }
      }

      let newImage = row.image_url
      if (!newImage) {
        newImage = await extractImageFromArticlePage(targetUrl)
      }

      const updates: {
        image_url?: string | null
        canonical_url?: string | null
        source_name?: string
        normalized_title?: string | null
      } = {}

      if (newImage && newImage !== row.image_url) {
        updates.image_url = newImage
        imagesBackfilled++
      }
      if (newCanonical && newCanonical !== row.canonical_url) {
        updates.canonical_url = newCanonical
      }
      if (newSourceName && newSourceName !== row.source_name) {
        updates.source_name = newSourceName
      }
      if (newNormalized && newNormalized !== row.normalized_title) {
        updates.normalized_title = newNormalized
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('news_items').update(updates).eq('id', row.id)
      }
    }
  } catch (err) {
    console.error('[news-ingest] Error backfilling news items:', err)
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
