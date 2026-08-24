/**
 * Entertainment-news ingest: sources, keyword pre-filter, title normalization,
 * title similarity dedup, Google News URL decoding, and image extraction.
 * Pure and dependency-light where possible for unit testability.
 */

export type NewsSource = {
  name: string
  url: string
}

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
]

const REQUIRED_PHRASE = 'sophie thatcher'

export function passesKeywordFilter(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  return text.includes(REQUIRED_PHRASE)
}

/**
 * Decodes HTML entities commonly found in RSS titles and HTML meta tags
 * (e.g. &amp;, &#038;, &quot;, &#039;, &apos;, &#8217;, &nbsp;, etc.).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;|&#8217;|&#8216;|’|‘/g, "'")
    .replace(/&ldquo;|&rdquo;|“|”/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&#8212;|—|–/g, '-')
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code))
      } catch {
        return ''
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 16))
      } catch {
        return ''
      }
    })
}

/**
 * Normalizes a news title for duplicate detection:
 * - Decodes HTML entities
 * - Strips editorial prefixes like "EXCLUSIVE: ", "INTERVIEW: "
 * - Strips trailing outlet suffixes (e.g. " - Variety", " | Collider", " — THR")
 * - Normalizes unicode diacritics
 * - Lowercases and strips punctuation/extra whitespace
 */
export function normalizeNewsTitle(title: string): string {
  let decoded = decodeHtmlEntities(title)

  // Strip common editorial prefixes
  decoded = decoded.replace(/^(exclusive|interview|watch|review|update|first look):\s*/i, '')

  // Strip trailing outlet suffix: " - <Outlet>", " | <Outlet>", " — <Outlet>", " – <Outlet>", " · <Outlet>"
  decoded = decoded.replace(/\s+[-|—–·]\s+[^-|—–·]+$/, '')

  return decoded
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'is',
  'it',
  'as',
  'that',
  'from',
  'about',
  'her',
  'his',
  'their',
  'its',
  'sophie',
  'thatcher',
])

function getSubstantiveWords(normalizedTitle: string): string[] {
  return normalizedTitle
    .split(' ')
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w))
}

/**
 * True if two titles represent the same real-world story.
 * Uses exact normalized matching, substantive word overlap (Jaccard / Dice),
 * and substring containment while avoiding false positives on distinct stories
 * that merely share the entity name or common words.
 */
export function areSimilarTitles(a: string, b: string): boolean {
  const normA = normalizeNewsTitle(a)
  const normB = normalizeNewsTitle(b)
  if (normA === normB) return true

  const wordsA = new Set(getSubstantiveWords(normA))
  const wordsB = new Set(getSubstantiveWords(normB))

  if (wordsA.size === 0 || wordsB.size === 0) {
    return normA === normB
  }

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  const jaccard = intersection / union
  const dice = (2 * intersection) / (wordsA.size + wordsB.size)

  if (jaccard >= 0.7 || dice >= 0.8) return true

  // Containment check for titles with >= 4 content words where one is largely a subset of the other
  const minSize = Math.min(wordsA.size, wordsB.size)
  if (minSize >= 4 && intersection / minSize >= 0.85) return true

  return false
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
 * Minimal structural shape of what rss-parser hands back per item.
 */
export type RssItemLike = {
  enclosure?: { url?: string; type?: string }
  'media:content'?: unknown
  'media:thumbnail'?: unknown
  'media:group'?: { 'media:content'?: unknown }
  'content:encoded'?: string
  content?: string
}

const NON_IMAGE_EXT_RE = /\.(mov|mp4|webm|avi|m4v|mp3|wav|ogg|m4a)(\?.*)?$/i

function firstMediaUrl(value: unknown): string | null {
  const arr = Array.isArray(value) ? value : value ? [value] : []
  for (const entry of arr) {
    const rawUrl = (entry as { $?: { url?: string; medium?: string } })?.$?.url
    const medium = (entry as { $?: { url?: string; medium?: string } })?.$?.medium
    if (!rawUrl) continue
    if (medium && medium !== 'image') continue
    if (NON_IMAGE_EXT_RE.test(rawUrl)) continue

    const cleanUrl = decodeHtmlEntities(rawUrl)
    if (cleanUrl.startsWith('http')) return cleanUrl
  }
  return null
}

/**
 * Best-effort image URL from RSS metadata: enclosure, then Media RSS,
 * then the first <img> in inline HTML content.
 */
export function extractImageFromRssItem(item: RssItemLike): string | null {
  if (item.enclosure?.url && (item.enclosure.type?.startsWith('image/') || !item.enclosure.type)) {
    if (!NON_IMAGE_EXT_RE.test(item.enclosure.url)) {
      const cleanUrl = decodeHtmlEntities(item.enclosure.url)
      if (cleanUrl.startsWith('http')) return cleanUrl
    }
  }

  const mediaContent = firstMediaUrl(item['media:content'])
  if (mediaContent) return mediaContent

  const mediaThumbnail = firstMediaUrl(item['media:thumbnail'])
  if (mediaThumbnail) return mediaThumbnail

  const groupContent = firstMediaUrl(item['media:group']?.['media:content'])
  if (groupContent) return groupContent

  const html = item['content:encoded'] ?? item.content ?? ''
  const match = html.match(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i)
  const src = match?.[1] ? decodeHtmlEntities(match[1]) : null
  if (src && src.startsWith('http') && !NON_IMAGE_EXT_RE.test(src)) {
    return src
  }

  return null
}

/**
 * Decodes an opaque Google News redirect URL (news.google.com/rss/articles/... or /read/...)
 * into the real publisher destination URL by calling Google's batchexecute RPC endpoint.
 */
export async function decodeGoogleNewsUrl(googleNewsUrl: string): Promise<string | null> {
  try {
    const parsed = new URL(googleNewsUrl)
    if (!parsed.hostname.includes('news.google.com')) return googleNewsUrl

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    const base64Str = pathParts[pathParts.length - 1]
    if (!base64Str) return null

    const pageRes = await fetch(`https://news.google.com/rss/articles/${base64Str}`, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      },
    })
    if (!pageRes.ok) return null

    const html = await pageRes.text()
    const matchSig = html.match(/data-n-a-sg="([^"]+)"/)
    const matchTs = html.match(/data-n-a-ts="([^"]+)"/)
    if (!matchSig || !matchTs) return null

    const payload = [
      'Fbv4je',
      JSON.stringify([
        'garturlreq',
        [
          ['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
          'X',
          'X',
          1,
          [1, 1, 1],
          1,
          1,
          null,
          0,
          0,
          null,
          0,
        ],
        base64Str,
        Number(matchTs[1]),
        matchSig[1],
      ]),
    ]
    const reqData = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`

    const batchRes = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
      method: 'POST',
      signal: AbortSignal.timeout(6000),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      },
      body: reqData,
    })
    if (!batchRes.ok) return null

    const text = await batchRes.text()
    const splitParts = text.split('\n\n')
    if (splitParts.length < 2) return null

    const parsedData = JSON.parse(splitParts[1])
    const batchResponses = parsedData.filter(
      (d: [string, string]) => (d[0] === 'wrb.fr' || d[0] === 'w779db') && d[1] === 'Fbv4je',
    )
    if (!batchResponses.length) return null

    const innerData = JSON.parse(batchResponses[0][2])
    const decodedUrl = innerData[1]
    return typeof decodedUrl === 'string' && decodedUrl.startsWith('http') ? decodedUrl : null
  } catch {
    return null
  }
}

/**
 * Extracts a friendly outlet name from a title suffix or decoded URL hostname
 * when a story comes from Google News RSS.
 */
export function extractOutletName(title: string, decodedUrl?: string | null, originalSourceName = 'Google News'): string {
  if (originalSourceName !== 'Google News') return originalSourceName

  const suffixMatch = title.match(/\s+[-|—–·]\s+([^-|—–·]+)$/)
  if (suffixMatch && suffixMatch[1].trim()) {
    return suffixMatch[1].trim()
  }

  if (decodedUrl) {
    try {
      const hostname = new URL(decodedUrl).hostname.replace(/^www\./, '')
      if (hostname) return hostname
    } catch {
      // fallback below
    }
  }

  return originalSourceName
}

const META_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  /<meta[^>]+name=["'](?:twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["'](?:twitter:image|twitter:image:src)["']/i,
  /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
]

/**
 * Scrapes og:image / twitter:image from an article page.
 * Handles Google News redirect URLs by decoding them to the target article page,
 * decodes HTML entities in attributes, resolves relative URLs, and validates protocols.
 */
export async function extractImageFromArticlePage(url: string): Promise<string | null> {
  try {
    let targetUrl = url
    if (url.includes('news.google.com')) {
      const decoded = await decodeGoogleNewsUrl(url)
      if (decoded) targetUrl = decoded
    }

    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return null

    const html = await res.text()
    // Read up to 512KB to cover long <head> scripts
    const head = html.slice(0, 524288)

    let rawImage: string | null = null
    for (const pattern of META_IMAGE_PATTERNS) {
      const match = head.match(pattern)
      if (match?.[1]) {
        rawImage = match[1]
        break
      }
    }

    if (!rawImage) return null

    const cleanRaw = decodeHtmlEntities(rawImage).trim()
    if (!cleanRaw || NON_IMAGE_EXT_RE.test(cleanRaw)) return null

    try {
      const parsed = new URL(cleanRaw, res.url || targetUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
      return parsed.toString()
    } catch {
      return null
    }
  } catch {
    return null
  }
}
