export const SITE_NAME = 'SoapyFans Hub'
export const SITE_TAGLINE = 'A luminous fan archive of Sophie Thatcher'

export const SITE_DESCRIPTION =
  'A luminous fan archive of Sophie Thatcher, spanning filmography, TV credits, music releases, and fan reviews. Unofficial and unaffiliated.'

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
