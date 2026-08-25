import { profilePath, resolveCanonicalProfileSlug } from '@/utils/profile'
import type { NormalizedCredit } from '@/utils/tmdb'

// Mirrors the shape /api/search returns (see utils/search.ts's SearchResults)
// without importing that module directly -- it pulls in next/headers via
// utils/supabase/server.ts, which can't be bundled into client code. This
// file has no server-only imports, so it's safe for CommandPalette.tsx
// ('use client') to import, and plain enough to unit test like any other
// utils/*.ts pure function.
export type PaletteResults = {
  profiles: { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]
  titles: NormalizedCredit[]
  reviews: { id: string; content: string; href: string; title: string; authorName: string; authorHref: string | null }[]
  news: { id: string; title: string; description: string | null; source_name: string }[]
}

export const EMPTY_PALETTE_RESULTS: PaletteResults = { profiles: [], titles: [], reviews: [], news: [] }

export type PaletteSection = 'Profiles' | 'Titles' | 'Reviews' | 'News'

export type PaletteItem = {
  key: string
  section: PaletteSection
  href: string
  primary: string
  secondary: string | null
}

/** Flattens the four grouped result arrays into one keyboard-navigable list, in display order. */
export function buildPaletteItems(results: PaletteResults): PaletteItem[] {
  const items: PaletteItem[] = []

  for (const p of results.profiles) {
    items.push({
      key: `profile-${p.id}`,
      section: 'Profiles',
      href: profilePath(resolveCanonicalProfileSlug(p)),
      primary: p.display_name ?? p.username ?? 'Anonymous',
      secondary: p.username ? `@${p.username}` : null,
    })
  }

  for (const t of results.titles) {
    const kind = t.mediaType === 'tv' ? 'TV' : 'Film'
    items.push({
      key: `title-${t.mediaType}-${t.id}`,
      section: 'Titles',
      href: `/${t.mediaType === 'tv' ? 'tv' : 'films'}/${t.id}`,
      primary: t.title,
      secondary: t.year ? `${kind} · ${t.year}` : kind,
    })
  }

  for (const r of results.reviews) {
    items.push({
      key: `review-${r.id}`,
      section: 'Reviews',
      href: r.href,
      primary: r.title,
      secondary: `${r.authorName} — ${r.content}`,
    })
  }

  for (const n of results.news) {
    items.push({
      key: `news-${n.id}`,
      section: 'News',
      href: '/news',
      primary: n.title,
      secondary: n.source_name,
    })
  }

  return items
}
