import { NEWS_TAGS, type NewsTag } from './news'

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
