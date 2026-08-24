'use server'

import { createClient } from '@/utils/supabase/server'
import { isValidNewsTag } from '@/utils/news'
import { dedupNewsForDisplay } from '@/utils/news-display'
import type { NewsCardItem } from '@/components/news/NewsCard'

export interface FetchNewsParams {
  tag?: string | null
  query?: string | null
  offset: number
  limit?: number
}

export interface FetchNewsResult {
  items: NewsCardItem[]
  hasMore: boolean
}

export async function fetchNewsBatch({
  tag,
  query,
  offset,
  limit = 12,
}: FetchNewsParams): Promise<FetchNewsResult> {
  const supabase = await createClient()
  const activeTag = tag && isValidNewsTag(tag) ? tag : null
  const cleanQ = query?.trim() ? query.trim().replace(/[%_]/g, '') : null

  let q = supabase
    .from('news_items')
    .select('id, title, description, source_name, source_url, canonical_url, tag, published_at, image_url')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })

  if (activeTag) {
    q = q.eq('tag', activeTag)
  }

  if (cleanQ) {
    q = q.or(`title.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%,source_name.ilike.%${cleanQ}%`)
  }

  // Fetch limit + 1 items to determine hasMore without a separate COUNT query
  const { data, error } = await q.range(offset, offset + limit)

  if (error) {
    console.error('[fetchNewsBatch] Database query error:', error.message)
    return { items: [], hasMore: false }
  }

  const rawRows = (data ?? []) as NewsCardItem[]
  const hasMore = rawRows.length > limit
  const rowsToReturn = hasMore ? rawRows.slice(0, limit) : rawRows
  const items = dedupNewsForDisplay(rowsToReturn)

  return { items, hasMore }
}
