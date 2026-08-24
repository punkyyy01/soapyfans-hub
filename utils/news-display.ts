import { NEWS_TAGS, type NewsTag, areSimilarTitles, normalizeNewsTitle } from './news'

// Human-readable labels for the machine tags the Groq classifier assigns
// (see utils/news-classifier.ts). Kept separate from utils/news.ts so the
// ingest pipeline's pure logic has no UI-facing concerns mixed in.
export const NEWS_TAG_LABEL: Record<NewsTag, string> = {
  'new-project': 'New Project',
  interview: 'Interview',
  'red-carpet': 'Red Carpet',
  'social-media': 'Social',
  awards: 'Awards',
  streaming: 'Streaming',
  general: 'General',
}

export const NEWS_TAG_FILTERS = NEWS_TAGS.map((tag) => ({
  tag,
  label: NEWS_TAG_LABEL[tag],
}))

/**
 * Defensive deduplication for display in case uncleaned duplicate rows
 * exist in the database or across multiple syndications.
 */
export function dedupNewsForDisplay<
  T extends {
    title: string
    canonical_url?: string | null
    source_url: string
    image_url?: string | null
  },
>(items: T[]): T[] {
  const result: T[] = []
  const seenNorm = new Set<string>()
  const seenUrls = new Set<string>()

  for (const item of items) {
    const url = item.canonical_url || item.source_url
    if (url && seenUrls.has(url)) continue

    const norm = normalizeNewsTitle(item.title)
    if (norm && seenNorm.has(norm)) continue

    if (result.some((existing) => areSimilarTitles(existing.title, item.title))) {
      continue
    }

    if (url) seenUrls.add(url)
    if (norm) seenNorm.add(norm)
    result.push(item)
  }

  return result
}
