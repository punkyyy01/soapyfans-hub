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
  { name: 'People', url: 'https://people.com/feed/' },
]

// Requires the full "sophie thatcher" phrase (not just "sophie") so a
// general entertainment feed's unrelated stories don't slip past the free
// pre-filter and waste a paid-adjacent Groq call on them.
const REQUIRED_PHRASE = 'sophie thatcher'

export function passesKeywordFilter(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  return text.includes(REQUIRED_PHRASE)
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
