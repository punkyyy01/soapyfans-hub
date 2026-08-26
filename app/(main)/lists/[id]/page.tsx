import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createClient, getUser } from '@/utils/supabase/server'
import { getMovieDetails, getTvDetails, getPersonCombinedCredits, normalizeCredit } from '@/utils/tmdb'
import { buildBreadcrumbSchema, buildWebPageSchema, serializeJsonLd } from '@/utils/schema'
import { profilePath } from '@/utils/profile'
import { absoluteUrl } from '@/utils/site'
import ListDetailManager from '@/components/lists/ListDetailManager'
import PageContainer from '@/components/ui/PageContainer'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface Props {
  params: Promise<{ id: string }>
}

type ListItemRow = {
  id: string
  tmdb_id: number
  media_type: string
  position: number
}

type ListRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  profiles: { username: string | null; display_name: string | null } | null
  list_items: ListItemRow[]
}

const LIST_SELECT = `
    id, user_id, name, description, is_public, created_at,
    profiles(username, display_name),
    list_items(id, tmdb_id, media_type, position)
  `

// RLS already restricts a private list to its owner -- a non-owner request
// for one simply gets no row back, same shape as a list that never existed.
const getListById = cache(async (id: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('lists').select(LIST_SELECT).eq('id', id).maybeSingle()
  return data as ListRow | null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const list = await getListById(id)
  if (!list) return {}

  const ownerName = list.profiles?.display_name ?? list.profiles?.username ?? 'A fan'
  const title = `${list.name} — a list by ${ownerName}`
  const description = list.description?.trim()
    ? list.description.slice(0, 155)
    : `A curated list of ${list.list_items.length} Sophie Thatcher title${list.list_items.length === 1 ? '' : 's'} on SoapyFans Hub.`
  const canonical = `/lists/${list.id}`

  return {
    title,
    description,
    alternates: { canonical },
    ...(list.is_public ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params
  const [list, user] = await Promise.all([getListById(id), getUser()])

  if (!list) notFound()

  const isOwner = user?.id === list.user_id
  const sortedItems = list.list_items.slice().sort((a, b) => a.position - b.position)

  const creditsPromise = sortedItems.length > 0
    ? getPersonCombinedCredits().catch(() => ({ id: 0, cast: [], crew: [] }))
    : Promise.resolve({ id: 0, cast: [], crew: [] })
  const combinedCredits = await creditsPromise

  const creditMap = new Map<string, { title: string; posterPath: string | null }>()
  for (const c of combinedCredits.cast) {
    const norm = normalizeCredit(c)
    creditMap.set(`${norm.mediaType}:${norm.id}`, { title: norm.title, posterPath: norm.posterPath })
  }

  const enrichedItems = await Promise.all(
    sortedItems.map(async (item) => {
      const fromCache = creditMap.get(`${item.media_type}:${item.tmdb_id}`)
      if (fromCache) {
        return { ...item, title: fromCache.title, posterPath: fromCache.posterPath }
      }
      try {
        if (item.media_type === 'movie') {
          const d = await getMovieDetails(item.tmdb_id)
          return { ...item, title: d.title, posterPath: d.poster_path }
        }
        const d = await getTvDetails(item.tmdb_id)
        return { ...item, title: d.name, posterPath: d.poster_path }
      } catch {
        return { ...item, title: null, posterPath: null }
      }
    }),
  )

  const ownerName = list.profiles?.display_name ?? list.profiles?.username ?? 'Anonymous'
  const ownerHref = list.profiles?.username ? profilePath(list.profiles.username) : null

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    ...(ownerHref ? [{ name: ownerName, path: ownerHref }] : []),
    { name: list.name, path: `/lists/${list.id}` },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbItems)) }}
      />
      {list.is_public && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              buildWebPageSchema({
                name: list.name,
                description: list.description ?? `A curated list by ${ownerName} on SoapyFans Hub.`,
                path: `/lists/${list.id}`,
              }),
            ),
          }}
        />
      )}

      <PageContainer size="narrow">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <ListDetailManager
          list={{
            id: list.id,
            name: list.name,
            description: list.description,
            isPublic: list.is_public,
          }}
          ownerName={ownerName}
          ownerHref={ownerHref}
          items={enrichedItems.map((item) => ({
            id: item.id,
            tmdbId: item.tmdb_id,
            mediaType: item.media_type as 'movie' | 'tv',
            title: item.title,
            posterPath: item.posterPath,
          }))}
          isOwner={isOwner}
          shareUrl={absoluteUrl(`/lists/${list.id}`)}
        />
      </PageContainer>
    </main>
  )
}
