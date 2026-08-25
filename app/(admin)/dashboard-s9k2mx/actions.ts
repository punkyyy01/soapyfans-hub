'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
const DASHBOARD = '/dashboard-s9k2mx'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: isAdmin } = await supabase.rpc('is_admin')

  if (!isAdmin) throw new Error('Unauthorized')

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

export async function adminSoftDeleteReply(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('reply_id') as string
  if (!id) return
  await createAdminClient()
    .from('review_replies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath(DASHBOARD)
}

export async function adminRestoreReply(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('reply_id') as string
  if (!id) return
  await createAdminClient()
    .from('review_replies')
    .update({ deleted_at: null })
    .eq('id', id)
  revalidatePath(DASHBOARD)
}

export async function adminApproveNewsItem(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('news_item_id') as string
  if (!id) return
  await createAdminClient()
    .from('news_items')
    .update({ status: 'approved' })
    .eq('id', id)
  revalidatePath(DASHBOARD)
  revalidatePath('/news')
}

export async function adminRejectNewsItem(formData: FormData) {
  await verifyAdmin()
  const id = formData.get('news_item_id') as string
  if (!id) return
  await createAdminClient()
    .from('news_items')
    .update({ status: 'rejected' })
    .eq('id', id)
  revalidatePath(DASHBOARD)
  revalidatePath('/news')
}

// A report's target lives in one of four tables depending on target_type.
// Resolving hides/removes the underlying content (soft-delete for
// review/music_review/review_reply, status='rejected' for news_item, same
// as the direct moderation actions above) and marks the report resolved.
// Dismissing only marks the report dismissed, leaving the content as-is.
export async function adminResolveReport(formData: FormData) {
  const adminUser = await verifyAdmin()
  const reportId = formData.get('report_id') as string
  const targetType = formData.get('target_type') as string
  const targetId = formData.get('target_id') as string
  if (!reportId || !targetType || !targetId) return

  const admin = createAdminClient()

  switch (targetType) {
    case 'review':
      await admin.from('reviews').update({ deleted_at: new Date().toISOString() }).eq('id', targetId)
      break
    case 'music_review':
      await admin.from('music_reviews').update({ deleted_at: new Date().toISOString() }).eq('id', targetId)
      break
    case 'review_reply':
      await admin.from('review_replies').update({ deleted_at: new Date().toISOString() }).eq('id', targetId)
      break
    case 'news_item':
      await admin.from('news_items').update({ status: 'rejected' }).eq('id', targetId)
      break
    default:
      return
  }

  await admin
    .from('reports')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: adminUser.id })
    .eq('id', reportId)

  revalidatePath(DASHBOARD)
  revalidatePath('/news')
}

export async function adminDismissReport(formData: FormData) {
  const adminUser = await verifyAdmin()
  const reportId = formData.get('report_id') as string
  if (!reportId) return

  await createAdminClient()
    .from('reports')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: adminUser.id })
    .eq('id', reportId)

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
