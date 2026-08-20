export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export function getTotalDuration(tracks: { duration_ms: number | null }[]): string | null {
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration_ms ?? 0), 0)
  if (totalMs <= 0) return null
  const totalMinutes = Math.round(totalMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Assigns a stable, unique, URL-safe slug to each release. Order matters --
 * every caller must fetch releases in the same order (getReleasesWithSlugs
 * in utils/releases.ts is the only place that should call this) so the
 * same title always resolves to the same slug across /music, /music/[slug],
 * and the sitemap. A slug collision (two releases slugifying to the same
 * string) is disambiguated deterministically by appending -2, -3, ... in
 * fetch order -- this dataset is small and curated, so a real collision is
 * unlikely, but this keeps slugs unique without needing a stored column.
 */
export function assignReleaseSlugs<T extends { title: string }>(releases: T[]): (T & { slug: string })[] {
  const seen = new Map<string, number>()
  return releases.map((release) => {
    const base = slugify(release.title)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return { ...release, slug: count === 0 ? base : `${base}-${count + 1}` }
  })
}

export function findReleaseBySlug<T extends { slug: string }>(releases: T[], slug: string): T | null {
  return releases.find((r) => r.slug === slug) ?? null
}

export function safeExternalUrl(raw: string | null, allowedHosts: string[]): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!allowedHosts.includes(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

export const RELEASE_TYPE_LABEL: Record<string, string> = {
  ep: 'Debut EP',
  single: 'Single',
  soundtrack: 'Soundtrack',
  album: 'Album',
}

export const SOPHIE_MUSIC_QUOTES: Record<string, { quote: string; attribution: string }> = {
  'Pivot & Scrape': {
    quote:
      'The imagery and lyrics were inspired by dreams I kept having about throwing myself into glass. It felt guttural and like a strong juxtaposition with the dreaminess of the sound.',
    attribution: 'Sophie Thatcher, 2024',
  },
  "Knockin' on Heaven's Door": {
    quote: 'The cover feels very melancholic and feminine, more dreamy and atmospheric.',
    attribution: 'Sophie Thatcher (Heretic OST)',
  },
}
