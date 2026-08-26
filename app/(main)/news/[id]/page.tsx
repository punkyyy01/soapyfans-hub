import type { Metadata } from 'next'
import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { decodeHtmlEntities, isValidNewsTag } from '@/utils/news'
import { NEWS_TAG_LABEL } from '@/utils/news-display'
import { buildBreadcrumbSchema, serializeJsonLd } from '@/utils/schema'
import { absoluteUrl } from '@/utils/site'
import ReportButton from '@/components/social/ReportButton'
import ShareButton from '@/components/social/ShareButton'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PageContainer from '@/components/ui/PageContainer'

export const revalidate = 900

interface Props {
  params: Promise<{ id: string }>
}

type NewsItemRow = {
  id: string
  title: string
  description: string | null
  source_name: string
  source_url: string
  canonical_url: string | null
  tag: string | null
  published_at: string
  image_url: string | null
}

const getNewsItemById = cache(async (id: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('news_items')
    .select('id, title, description, source_name, source_url, canonical_url, tag, published_at, image_url')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  return data as NewsItemRow | null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const item = await getNewsItemById(id)
  if (!item) return {}

  const title = decodeHtmlEntities(item.title)
  const description = item.description
    ? decodeHtmlEntities(item.description).slice(0, 155)
    : `Sophie Thatcher news from ${item.source_name}, via SoapyFans Hub.`
  const canonical = `/news/${id}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params
  const item = await getNewsItemById(id)
  if (!item) notFound()

  const displayTitle = decodeHtmlEntities(item.title)
  const displayDescription = item.description ? decodeHtmlEntities(item.description) : null
  const destinationUrl = item.canonical_url || item.source_url
  const publishedDate = new Date(item.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'News', path: '/news' },
    { name: displayTitle, path: `/news/${id}` },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbItems)) }}
      />

      <PageContainer size="editorial">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {item.image_url && (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            {/* Same-origin proxy -- see app/api/news-image/[id]/route.ts */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/news-image/${item.id}`}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {item.tag && (
              <Badge variant="neutral" size="sm">
                {isValidNewsTag(item.tag) ? NEWS_TAG_LABEL[item.tag] : item.tag}
              </Badge>
            )}
            <span className="font-mono text-xs text-[var(--text-muted)]">{publishedDate}</span>
          </div>

          <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-tight text-[var(--text-primary)] text-balance">
            {displayTitle}
          </h1>

          {displayDescription && (
            <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] text-pretty">
              {displayDescription}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border-subtle)] pt-6">
            <Button href={destinationUrl} external variant="primary" size="sm">
              Read full story at {item.source_name} ↗
            </Button>
            <ShareButton url={absoluteUrl(`/news/${id}`)} title={displayTitle} text={displayDescription ?? undefined} />
            <div className="ml-auto">
              <ReportButton targetType="news_item" targetId={item.id} redirectTo={`/news/${id}`} />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs py-1"
          >
            <span aria-hidden="true">←</span>
            <span>Back to news</span>
          </Link>
        </div>
      </PageContainer>
    </main>
  )
}
