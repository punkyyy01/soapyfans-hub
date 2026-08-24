/**
 * Entertainment-news ingest: sources, the free keyword pre-filter that runs
 * before any item reaches the Groq classifier, and RSS image extraction.
 * Kept dependency-light and pure where possible so the filtering logic is
 * unit-testable without hitting a network or an LLM.
 */

export type NewsSource = {
  name: string
  url: string
}

// Google News' own targeted search feed is the widest net -- it surfaces
// any outlet, not just the ones listed below -- so it stays first. The
// named outlet feeds cover the trade press directly (useful even on days
// Google's index is slow to pick a story up) and go through the same
// keyword + LLM filter as everything else, since their feeds are NOT
// Sophie-specific.
export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'Google News',
    url: 'https://news.google.com/rss/search?q=%22Sophie%20Thatcher%22&hl=en-US&gl=US&ceid=US:en',
  },
  { name: 'Variety', url: 'https://variety.com/feed/' },
  { name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/' },
  { name: 'Deadline', url: 'https://deadline.com/feed/' },
  { name: 'IndieWire', url: 'https://www.indiewire.com/feed/' },
  { name: 'Collider', url: 'https://collider.com/feed/' },
  { name: '/Film', url: 'https://www.slashfilm.com/feed/' },
  { name: 'TheWrap', url: 'https://www.thewrap.com/feed/' },
  { name: 'Vogue', url: 'https://www.vogue.com/feed/rss' },
  { name: 'W Magazine', url: 'https://www.wmagazine.com/rss' },
  // People.com and Entertainment Weekly are deliberately absent: both
  // feeds 403 every request from Vercel's serverless IPs regardless of
  // User-Agent (confirmed live) -- looks like an IP/ASN-level bot block,
  // not something a header fixes. Vulture has no public RSS feed left
  // (every documented URL 404s). None of these are a real gap: their
  // stories already surface through the Google News search feed above.
]

// Requires the full "sophie thatcher" phrase (not just "sophie") so a
// general entertainment feed's unrelated stories don't slip past the free
// pre-filter and waste a paid-adjacent Groq call on them.
const REQUIRED_PHRASE = 'sophie thatcher'

export function passesKeywordFilter(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  return text.includes(REQUIRED_PHRASE)
}

/**
 * Normalizes a news title for duplicate detection: strips a trailing
 * " - <Outlet>" suffix (how Google News' search feed labels the same story
 * from different outlets, e.g. " - IMDb" / " - Variety"), lowercases, and
 * strips punctuation/extra whitespace.
 */
export function normalizeNewsTitle(title: string): string {
  return title
    .replace(/\s+-\s+[^-]+$/, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * True if two titles look like the same story. Exact match after
 * normalization covers Google News' outlet-suffix duplicates (the only
 * real-world case seen so far); the Jaccard word-overlap threshold gives a
 * little slack for minor rewording without needing real edit-distance math.
 */
export function areSimilarTitles(a: string, b: string): boolean {
  const normA = normalizeNewsTitle(a)
  const normB = normalizeNewsTitle(b)
  if (normA === normB) return true

  const wordsA = new Set(normA.split(' ').filter(Boolean))
  const wordsB = new Set(normB.split(' ').filter(Boolean))
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  return union > 0 && intersection / union >= 0.8
}

export const NEWS_TAGS = [
  'new-project',
  'interview',
  'red-carpet',
  'social-media',
  'awards',
  'streaming',
  'general',
] as const

export type NewsTag = (typeof NEWS_TAGS)[number]

export function isValidNewsTag(value: string | null): value is NewsTag {
  return value !== null && (NEWS_TAGS as readonly string[]).includes(value)
}

/**
 * Minimal structural shape of what rss-parser hands back per item, covering
 * only the fields extraction actually reads. Kept separate from the
 * library's own types so this stays testable with plain object literals.
 */
export type RssItemLike = {
  enclosure?: { url?: string; type?: string }
  'media:content'?: unknown
  'media:thumbnail'?: unknown
  'media:group'?: { 'media:content'?: unknown }
  'content:encoded'?: string
  content?: string
}

function firstMediaUrl(value: unknown): string | null {
  const arr = Array.isArray(value) ? value : value ? [value] : []
  for (const entry of arr) {
    const url = (entry as { $?: { url?: string; medium?: string } })?.$?.url
    const medium = (entry as { $?: { url?: string; medium?: string } })?.$?.medium
    if (url && (!medium || medium === 'image')) return url
  }
  return null
}

/**
 * Best-effort image URL for an RSS item: enclosure, then Media RSS
 * (media:content / media:thumbnail / media:group), then the first <img> in
 * inline HTML content. Only ever returns an absolute http(s) URL --
 * app/api/news-ingest/route.ts stores it verbatim and
 * app/api/news-image/[id]/route.ts later fetches exactly this URL server
 * side, so a relative or javascript:/data: value here would be a problem
 * downstream, not just cosmetic.
 */
export function extractImageFromRssItem(item: RssItemLike): string | null {
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url
  }

  const mediaContent = firstMediaUrl(item['media:content'])
  if (mediaContent) return mediaContent

  const mediaThumbnail = firstMediaUrl(item['media:thumbnail'])
  if (mediaThumbnail) return mediaThumbnail

  const groupContent = firstMediaUrl(item['media:group']?.['media:content'])
  if (groupContent) return groupContent

  const html = item['content:encoded'] ?? item.content ?? ''
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  const src = match?.[1] ?? null
  return src?.startsWith('http') ? src : null
}
