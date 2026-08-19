import Link from 'next/link'

export const legalCls = {
  h2: 'font-display text-xl font-semibold text-[var(--text-primary)] mb-4',
  h3: 'mt-6 mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]',
  p: 'text-sm text-[var(--text-secondary)] leading-relaxed',
  ul: 'mt-3 list-disc pl-5 space-y-1.5',
  li: 'text-sm text-[var(--text-secondary)] leading-relaxed',
  a: 'text-[var(--accent-gold)] underline-offset-2 hover:underline',
  strong: 'font-semibold text-[var(--text-primary)]',
  code: 'font-mono text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded',
  section: 'border-t border-[var(--border-subtle)] pt-8 mt-8',
}

const LEGAL_PAGES = {
  contact: { href: '/contact', label: 'Copyright & Contact' },
  privacy: { href: '/privacy', label: 'Privacy Policy' },
  terms: { href: '/terms', label: 'Terms of Service' },
} as const

type LegalPageKey = keyof typeof LEGAL_PAGES

export function LegalHeader({ title, lastUpdated }: { title: string; lastUpdated: string }) {
  return (
    <header className="mb-10">
      <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        <strong className={legalCls.strong}>SoapyFans Hub</strong> — soapyhub.fans
      </p>
      <p className="mt-1 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Last updated: {lastUpdated}
      </p>
    </header>
  )
}

export function LegalFooterNav({ current }: { current: LegalPageKey }) {
  const others = (Object.keys(LEGAL_PAGES) as LegalPageKey[]).filter((key) => key !== current)

  return (
    <div className="mt-12 border-t border-[var(--border-subtle)] pt-6 flex gap-6 text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
      {others.map((key) => (
        <Link key={key} href={LEGAL_PAGES[key].href} className="hover:text-[var(--accent-gold)] transition-colors">
          {LEGAL_PAGES[key].label}
        </Link>
      ))}
    </div>
  )
}
