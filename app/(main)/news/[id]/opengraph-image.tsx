import { ImageResponse } from 'next/og'
import { createClient } from '@/utils/supabase/server'
import { decodeHtmlEntities, isValidNewsTag } from '@/utils/news'
import { NEWS_TAG_LABEL } from '@/utils/news-display'
import { absoluteUrl } from '@/utils/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Sophie Thatcher news on SoapyFans Hub'

const BG = '#0c0b08'
const TEXT = '#f2ede4'
const MUTED = '#a89f8e'
const AMBER = '#e8890c'

function fallback() {
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
  const supabase = await createClient()
  const { data: item } = await supabase
    .from('news_items')
    .select('id, title, description, source_name, tag, image_url')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()

  if (!item) return fallback()

  const title = decodeHtmlEntities(item.title)
  const description = item.description ? decodeHtmlEntities(item.description).slice(0, 160) : null
  const tagLabel = item.tag && isValidNewsTag(item.tag) ? NEWS_TAG_LABEL[item.tag] : item.tag
  // Same-origin proxy so satori fetches from our own domain rather than an
  // unpredictable third-party outlet host directly.
  const imageUrl = item.image_url ? absoluteUrl(`/api/news-image/${item.id}`) : null

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
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            width={480}
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
            SoapyFans Hub · News
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {tagLabel && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 22,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: MUTED,
                }}
              >
                {tagLabel}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                fontSize: 48,
                fontWeight: 600,
                lineHeight: 1.15,
                maxWidth: 640,
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  color: MUTED,
                  lineHeight: 1.45,
                  maxWidth: 640,
                }}
              >
                {description}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', fontSize: 22, color: MUTED }}>
            {item.source_name}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
