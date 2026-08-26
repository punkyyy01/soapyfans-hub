import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getUser } from '@/utils/supabase/server'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { isVisibleReview } from '@/utils/reviews'
import { buildBreadcrumbSchema, serializeJsonLd } from '@/utils/schema'
import { absoluteUrl } from '@/utils/site'
import { findReviewById, resolveEntry } from './review-lookup'
import ReviewCard from '@/components/social/ReviewCard'
import ShareButton from '@/components/social/ShareButton'
import Button from '@/components/ui/Button'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PageContainer from '@/components/ui/PageContainer'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const found = await findReviewById(id)
  if (!found) return {}

  const bannedUserIds = await getBannedUserIds()
  if (!isVisibleReview(found.review, bannedUserIds)) return {}

  const { title: entryTitle } = await resolveEntry(found)
  const author = found.review.profiles?.display_name ?? found.review.profiles?.username ?? 'Anonymous Fan'
  const stars = '★'.repeat(found.review.rating) + '☆'.repeat(5 - found.review.rating)
  const title = `${stars} — ${entryTitle}`
  const description = found.review.content
    ? `${found.review.content.slice(0, 155)}${found.review.content.length > 155 ? '…' : ''}`
    : `${author}'s ${found.review.rating}/5 review of ${entryTitle} on SoapyFans Hub.`
  const canonical = `/reviews/${id}`

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

export default async function ReviewDetailPage({ params }: Props) {
  const { id } = await params
  const [found, user, bannedUserIds] = await Promise.all([
    findReviewById(id),
    getUser(),
    getBannedUserIds(),
  ])

  if (!found || !isVisibleReview(found.review, bannedUserIds)) notFound()

  const { review, targetType } = found
  const { title: entryTitle, posterUrl, entryHref } = await resolveEntry(found)

  const likeCount = review.review_likes.filter((l) => !bannedUserIds.has(l.user_id)).length
  const likedByMe = Boolean(user && review.review_likes.some((l) => l.user_id === user.id))
  const replies = review.review_replies
    .filter((r) => r.deleted_at === null && !bannedUserIds.has(r.user_id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const redirectTo = `/reviews/${id}`
  const author = review.profiles?.display_name ?? review.profiles?.username ?? 'Anonymous Fan'
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: entryTitle, path: entryHref },
    { name: `Review by ${author}`, path: redirectTo },
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

        <div className="mb-8 flex items-start gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-5">
          {posterUrl && (
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)]">
              <Image src={posterUrl} alt={entryTitle} fill sizes="64px" className="object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-eyebrow">
              {targetType === 'review' ? 'Film Review' : 'Music Review'}
            </p>
            <Link
              href={entryHref}
              className="block font-display text-xl font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-amber)] focus-ring rounded-xs"
            >
              {entryTitle}
            </Link>
            <p className="font-mono text-sm text-[var(--accent-gold)]" aria-label={`${review.rating} out of 5 stars`}>
              {stars}
            </p>
          </div>
          <ShareButton
            url={absoluteUrl(redirectTo)}
            title={`${stars} — ${entryTitle}`}
            text={review.content ?? undefined}
            className="shrink-0"
          />
        </div>

        <ul className="space-y-4">
          <ReviewCard
            review={review}
            targetType={targetType}
            currentUserId={user?.id ?? null}
            isSignedIn={Boolean(user)}
            redirectTo={redirectTo}
            likeCount={likeCount}
            likedByMe={likedByMe}
            replies={replies}
            showPermalink={false}
          />
        </ul>

        <div className="mt-10">
          <Button href={entryHref} variant="secondary" size="sm">
            ← Back to {entryTitle}
          </Button>
        </div>
      </PageContainer>
    </main>
  )
}
