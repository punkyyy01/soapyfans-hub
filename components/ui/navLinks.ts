export const NAV_LINKS = [
  { href: '/films', label: 'Filmography' },
  { href: '/music', label: 'Music' },
  { href: '/about', label: 'About' },
] as const

export function isNavLinkActive(href: string, pathname: string) {
  if (href === '/films') {
    return pathname === '/films' || pathname.startsWith('/films/') || pathname.startsWith('/tv/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
