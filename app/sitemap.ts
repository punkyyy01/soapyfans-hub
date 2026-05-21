import type { MetadataRoute } from 'next'
import {
  getPersonCombinedCredits,
  normalizeCredit,
  type NormalizedCredit,
} from '@/utils/tmdb'
import { getSiteUrl } from '@/utils/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/films`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/music`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  let credits: NormalizedCredit[] = []
  try {
    const combined = await getPersonCombinedCredits()
    const seen = new Set<string>()
    for (const c of combined.cast) {
      const key = `${c.media_type}:${c.id}`
      if (seen.has(key)) continue
      seen.add(key)
      credits.push(normalizeCredit(c))
    }
  } catch {
    return staticRoutes
  }

  const filmRoutes: MetadataRoute.Sitemap = credits
    .filter((c) => c.mediaType === 'movie')
    .map((c) => ({
      url: `${siteUrl}/films/${c.id}`,
      lastModified: c.date ? new Date(c.date) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  const tvRoutes: MetadataRoute.Sitemap = credits
    .filter((c) => c.mediaType === 'tv')
    .map((c) => ({
      url: `${siteUrl}/tv/${c.id}`,
      lastModified: c.date ? new Date(c.date) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  return [...staticRoutes, ...filmRoutes, ...tvRoutes]
}
