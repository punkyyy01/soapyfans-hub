import { redirect } from 'next/navigation'
import { getUser } from '@/utils/supabase/server'
import { ADMIN_EMAIL } from '@/utils/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')
  return <>{children}</>
}
