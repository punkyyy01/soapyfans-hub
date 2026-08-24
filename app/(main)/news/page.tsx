import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { SITE_OG_IMAGE, absoluteUrl } from '@/utils/site'
import { buildCollectionPageSchema, buildBreadcrumbSchema, serializeJsonLd } from '@/utils/schema'
import { isValidNewsTag } from '@/utils/news'
import { NEWS_TAG_FILTERS, NEWS_TAG_LABEL, dedupNewsForDisplay } from '@/utils/news-display'
import NewsCard, { type NewsCardItem } from '@/components/news/NewsCard'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'

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
  searchParams: Promise<{ tag?: string }>
}

export default async function NewsPage({ searchParams }: Props) {
  const { tag: rawTag } = await searchParams
  const activeTag = rawTag && isValidNewsTag(rawTag) ? rawTag : null

  const supabase = await createClient()
  let query = supabase
    .from('news_items')
    .select('id, title, description, source_name, source_url, canonical_url, tag, published_at, image_url')
    .eq('status', 'approved')
    .order('published_at', { ascending: false })
    .limit(60)

  if (activeTag) query = query.eq('tag', activeTag)

  const { data, error } = await query

  if (error) {
    console.error('[NewsPage] Database query error:', error)
  }

  const rawItems = (data ?? []) as NewsCardItem[]
  const items = dedupNewsForDisplay(rawItems)

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

        {/* Tag filters */}
        <div className="mb-10 flex flex-wrap items-center gap-2">
          <Link
            href="/news"
            className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-all focus-ring ${
              !activeTag
                ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </Link>
          {NEWS_TAG_FILTERS.map(({ tag, label }) => (
            <Link
              key={tag}
              href={`/news?tag=${tag}`}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-all focus-ring ${
                activeTag === tag
                  ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="pb-32">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={activeTag ? `No ${NEWS_TAG_LABEL[activeTag] ?? activeTag} stories yet` : 'No news yet'}
              description="The feed refreshes automatically as new, verified stories come in."
            />
          )}
        </div>
      </PageContainer>
    </main>
  )
}
