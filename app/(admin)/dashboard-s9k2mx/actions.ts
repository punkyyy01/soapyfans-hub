'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { ADMIN_EMAIL } from '@/utils/admin'

const DASHBOARD = '/dashboard-s9k2mx'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function adminSoftDeleteReview(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('review_id') as string
  if (!id) return
  await createAdminClient()
    .from('reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath(DASHBOARD)
}

export async function adminRestoreReview(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('review_id') as string
  if (!id) return
  await createAdminClient()
    .from('reviews')
    .update({ deleted_at: null })
    .eq('id', id)
  revalidatePath(DASHBOARD)
}

export async function adminSoftDeleteMusicReview(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('review_id') as string
  if (!id) return
  await createAdminClient()
    .from('music_reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath(DASHBOARD)
}

export async function adminRestoreMusicReview(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('review_id') as string
  if (!id) return
  await createAdminClient()
    .from('music_reviews')
    .update({ deleted_at: null })
    .eq('id', id)
  revalidatePath(DASHBOARD)
}

export async function adminBanUser(formData: FormData) {
  const adminUser = await verifyAdmin()
  const userId = formData.get('user_id') as string
  if (!userId) return
  const reason = ((formData.get('reason') as string) ?? '').trim().slice(0, 200) || null

  await createAdminClient()
    .from('banned_users')
    .upsert(
      { user_id: userId, banned_by: adminUser.id, reason },
      { onConflict: 'user_id' }
    )
  revalidatePath(DASHBOARD)
}

export async function adminUnbanUser(formData: FormData) {
  await verifyAdmin()
  const userId = formData.get('user_id') as string
  if (!userId) return
  await createAdminClient()
    .from('banned_users')
    .delete()
    .eq('user_id', userId)
  revalidatePath(DASHBOARD)
}
