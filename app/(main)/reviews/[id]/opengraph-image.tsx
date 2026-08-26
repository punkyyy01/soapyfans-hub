import { ImageResponse } from 'next/og'
import { findReviewById, resolveEntry } from './review-lookup'
import { getBannedUserIds } from '@/utils/supabase/moderation'
import { isVisibleReview } from '@/utils/reviews'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'A fan review on SoapyFans Hub'

const BG = '#0c0b08'
const TEXT = '#f2ede4'
const MUTED = '#a89f8e'
const AMBER = '#e8890c'
const GOLD = '#d9b34c'

function FallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          color: AMBER,
          fontSize: 56,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        SoapyFans Hub
      </div>
    ),
    size,
  )
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [found, bannedUserIds] = await Promise.all([findReviewById(id), getBannedUserIds()])

  if (!found || !isVisibleReview(found.review, bannedUserIds)) {
    return FallbackImage()
  }

  const { review } = found
  const { title: entryTitle, posterUrl } = await resolveEntry(found)
  const author = review.profiles?.display_name ?? review.profiles?.username ?? 'Anonymous Fan'
  const rating = review.rating
  const snippet = review.content ? review.content.slice(0, 180) : null
  const snippetTruncated = Boolean(review.content && review.content.length > 180)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: BG,
          color: TEXT,
        }}
      >
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            width={420}
            height={630}
            style={{ objectFit: 'cover' }}
          />
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            padding: '56px 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            SoapyFans Hub · Fan Review
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', fontSize: 42, color: GOLD }}>
              {'★'.repeat(rating)}
              {'☆'.repeat(5 - rating)}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 52,
                fontWeight: 600,
                lineHeight: 1.15,
                maxWidth: 620,
              }}
            >
              {entryTitle}
            </div>
            {snippet && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 26,
                  color: MUTED,
                  lineHeight: 1.45,
                  maxWidth: 620,
                }}
              >
                &ldquo;{snippet}{snippetTruncated ? '…' : ''}&rdquo;
              </div>
            )}
          </div>

          <div style={{ display: 'flex', fontSize: 24, color: MUTED }}>
            Review by {author}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
