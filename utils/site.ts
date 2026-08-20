export const SITE_NAME = 'SoapyFans Hub'
export const SITE_TAGLINE = 'Unofficial Sophie Thatcher Fan Archive & Community'

export const SITE_DESCRIPTION =
  'SoapyFans Hub is an unofficial fan archive dedicated to Sophie Thatcher, compiling her complete filmography, television credits, music releases, and fan reviews.'

export const SITE_OG_IMAGE = '/og.svg'

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export function absoluteUrl(path: string = '/'): string {
  const base = getSiteUrl()
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

// Truthful, stable "last modified" for pages with no per-row DB timestamp
// (home, films index, music index, about, contact, legal). Bump this only
// when those pages' actual content changes -- never replace with
// `new Date()`, which would falsely claim every sitemap regeneration is a
// content update.
export const STATIC_CONTENT_LAST_MODIFIED = new Date('2026-08-20T00:00:00.000Z')
