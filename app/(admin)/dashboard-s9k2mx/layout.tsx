import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/utils/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) redirect('/')

  return <>{children}</>
}
