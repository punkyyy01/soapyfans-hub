import { redirect } from 'next/navigation'
import { getUser } from '@/utils/supabase/server'

const ADMIN_EMAIL = 'aikodiaz45@gmail.com'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')
  return <>{children}</>
}
