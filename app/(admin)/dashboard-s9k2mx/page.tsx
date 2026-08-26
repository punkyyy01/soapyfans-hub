import type { Metadata } from 'next'
import Link from 'next/link'
import OverviewSection from '@/components/admin/OverviewSection'
import ReviewsSection from '@/components/admin/ReviewsSection'
import ReportsSection from '@/components/admin/ReportsSection'
import UsersSection from '@/components/admin/UsersSection'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ section?: string }>
}

type Section = 'overview' | 'reviews' | 'reports' | 'users'

const VALID_SECTIONS: Section[] = ['overview', 'reviews', 'reports', 'users']

function parseSection(raw?: string): Section {
  return VALID_SECTIONS.includes(raw as Section) ? (raw as Section) : 'overview'
}

export default async function DashboardPage({ searchParams }: Props) {
  const { section } = await searchParams
  const active = parseSection(section)

  const tabs: { id: Section; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'reports', label: 'Reports' },
    { id: 'users', label: 'Users' },
  ]

  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-24 sm:px-10">
      <div className="mb-8 border-b border-[var(--border-subtle)] pb-6">
        <p className="text-[0.6rem] uppercase tracking-[0.32em] text-[var(--text-muted)]">Admin</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard
        </h1>
      </div>

      <nav className="mb-8 flex gap-1 border-b border-[var(--border-subtle)]">
        {tabs.map(({ id, label }) => (
          <Link
            key={id}
            href={`?section=${id}`}
            className={`px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-100 ${
              active === id
                ? 'border-b-2 border-[var(--accent-amber)] text-[var(--accent-gold)]'
                : 'border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {active === 'overview' && <OverviewSection />}
      {active === 'reviews' && <ReviewsSection />}
      {active === 'reports' && <ReportsSection />}
      {active === 'users' && <UsersSection />}
    </main>
  )
}
