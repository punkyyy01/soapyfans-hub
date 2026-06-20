import { redirect } from 'next/navigation'
import { getUser } from '@/utils/supabase/server'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/')
  return <>{children}</>
}
