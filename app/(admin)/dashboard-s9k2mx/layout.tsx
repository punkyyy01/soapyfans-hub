import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/utils/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/')

  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) redirect('/')

  return <>{children}</>
}
