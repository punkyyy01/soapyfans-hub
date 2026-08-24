import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildCollectionPageSchema, buildBreadcrumbSchema, serializeJsonLd } from '@/utils/schema'
import { isValidNewsTag } from '@/utils/news'
import { dedupNewsForDisplay } from '@/utils/news-display'
import type { NewsCardItem } from '@/components/news/NewsCard'
import NewsFeed from '@/components/news/NewsFeed'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const NEWS_DESCRIPTION =
  'A live feed of Sophie Thatcher news from entertainment outlets — new projects, interviews, red carpet moments, and more, verified and tagged automatically. Every story links straight to its original source.'

export const revalidate = 900

export const metadata: Metadata = {
  title: 'News',
  description: NEWS_DESCRIPTION,
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'News · Sophie Thatcher',
    description: NEWS_DESCRIPTION,
    url: '/news',
    type: 'website',
    images: [
      {
        url: absoluteUrl(SITE_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'News · Sophie Thatcher',
      },
    ],
  },
  twitter: {
    title: 'News · Sophie Thatcher',
    description: NEWS_DESCRIPTION,
    images: [absoluteUrl(SITE_OG_IMAGE)],
  },
}

interface Props {
  searchParams: Promise<{ tag?: string; q?: string }>
}

const PAGE_SIZE = 12

export default async function NewsPage({ searchParams }: Props) {
  const { tag: rawTag, q: rawQ } = await searchParams
  const activeTag = rawTag && isValidNewsTag(rawTag) ? rawTag : null
  const query = rawQ?.trim() ? rawQ.trim() : ''
  const cleanQ = query ? query.replace(/[%_]/g, '') : ''

  const supabase = await createClient()
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

  // Fetch PAGE_SIZE + 1 to detect if more pages exist without a separate count query
  const { data, error } = await q.range(0, PAGE_SIZE)

  if (error) {
    console.error('[NewsPage] Database query error:', error.message)
  }

  const rawRows = (data ?? []) as NewsCardItem[]
  const initialHasMore = rawRows.length > PAGE_SIZE
  const initialRows = initialHasMore ? rawRows.slice(0, PAGE_SIZE) : rawRows
  const initialItems = dedupNewsForDisplay(initialRows)

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pt-24 sm:pt-28">
      {/* ── Structured Data (SEO JSON-LD) ────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildCollectionPageSchema({
              name: 'News · Sophie Thatcher',
              description: NEWS_DESCRIPTION,
              path: '/news',
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbItems)) }}
      />

      <PageContainer size="default">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <PageHeader
          eyebrow="Archive Feed · Live"
          title="News"
          description="Pulled automatically from entertainment outlets and verified for relevance before it lands here. Click through to read the full story at its original source."
        />

        <NewsFeed
          initialItems={initialItems}
          initialHasMore={initialHasMore}
          activeTag={activeTag}
          initialQuery={query}
        />
      </PageContainer>
    </main>
  )
}
