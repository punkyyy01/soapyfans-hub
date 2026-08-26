import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/utils/supabase/server'
import ListsDashboard from '@/components/lists/ListsDashboard'
import PageContainer from '@/components/ui/PageContainer'
import PageHeader from '@/components/ui/PageHeader'

export const metadata: Metadata = {
  title: 'My Lists',
  robots: { index: false, follow: false },
}

type ListRow = {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  list_items: { id: string }[]
}

export default async function ListsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data } = await supabase
    .from('lists')
    .select('id, name, description, is_public, created_at, list_items(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const lists = (data ?? []) as ListRow[]

  return (
    <main className="min-h-screen bg-[var(--bg-base)] pb-32 pt-24 sm:pt-28">
      <PageContainer size="narrow">
        <PageHeader
          eyebrow="Personal Archive · Curation"
          title="My Lists"
          description="Build named collections of films and TV credits — a marathon, a ranking, a mood. Public lists appear on your profile; private ones stay visible only to you."
        />

        <ListsDashboard
          initialLists={lists.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.description,
            isPublic: l.is_public,
            itemCount: l.list_items.length,
          }))}
        />
      </PageContainer>
    </main>
  )
}
