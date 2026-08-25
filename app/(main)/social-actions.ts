'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { setFlash } from '@/utils/flash'

type ReviewTargetType = 'review' | 'music_review'
type ReportTargetType = 'review' | 'music_review' | 'review_reply' | 'news_item'

function isReviewTargetType(value: unknown): value is ReviewTargetType {
  return value === 'review' || value === 'music_review'
}

function isReportTargetType(value: unknown): value is ReportTargetType {
  return value === 'review' || value === 'music_review' || value === 'review_reply' || value === 'news_item'
}

// ── Follows ──────────────────────────────────────────────────────────────

export async function toggleFollow(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const targetUserId = formData.get('target_user_id') as string
  const profileSlug = (formData.get('profile_slug') as string) || targetUserId
  const targetPath = `/profile/${encodeURIComponent(profileSlug)}`

  if (!targetUserId) redirect(targetPath)

  const { error } = await supabase.rpc('toggle_follow', { p_target_user_id: targetUserId })

  if (error) {
    console.error('[toggleFollow] RPC failed:', error)
    const message = error.message.includes('cannot follow yourself')
      ? 'You cannot follow yourself.'
      : 'Could not update follow status. Please try again.'
    redirect(`${targetPath}?error=${encodeURIComponent(message)}`)
  }

  redirect(targetPath)
}

// ── Likes ────────────────────────────────────────────────────────────────

export async function toggleReviewLike(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const targetType = formData.get('target_type')
  const targetId = formData.get('target_id') as string
  const redirectTo = (formData.get('redirect_to') as string) || '/'

  if (!isReviewTargetType(targetType) || !targetId) redirect(redirectTo)

  const { error } = await supabase.rpc('toggle_review_like', {
    p_target_type: targetType,
    p_target_id: targetId,
  })

  if (error) {
    console.error('[toggleReviewLike] RPC failed:', error)
    redirect(`${redirectTo}?error=${encodeURIComponent('Could not update like. Please try again.')}`)
  }

  revalidatePath(redirectTo)
  redirect(redirectTo)
}

// ── Replies ──────────────────────────────────────────────────────────────

export async function submitReply(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const targetType = formData.get('target_type')
  const targetId = formData.get('target_id') as string
  const content = ((formData.get('content') as string) ?? '').trim()
  const redirectTo = (formData.get('redirect_to') as string) || '/'

  if (!isReviewTargetType(targetType) || !targetId) redirect(redirectTo)

  if (content.length < 1 || content.length > 2000) {
    redirect(`${redirectTo}?error=${encodeURIComponent('Reply must be between 1 and 2000 characters.')}`)
  }

  const { error } = await supabase.rpc('submit_review_reply', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_content: content,
  })

  if (error) {
    console.error('[submitReply] RPC failed:', error)
    redirect(`${redirectTo}?error=${encodeURIComponent('Could not post your reply. Please try again.')}`)
  }

  revalidatePath(redirectTo)
  redirect(redirectTo)
}

export async function deleteReply(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const replyId = formData.get('reply_id') as string
  const redirectTo = (formData.get('redirect_to') as string) || '/'

  if (!replyId) redirect(redirectTo)

  const { error } = await supabase
    .from('review_replies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', replyId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[deleteReply] Failed to soft-delete reply:', error)
    redirect(`${redirectTo}?error=${encodeURIComponent('Could not delete your reply. Please try again.')}`)
  }

  revalidatePath(redirectTo)
  redirect(redirectTo)
}

// ── Reports ──────────────────────────────────────────────────────────────

export async function submitReport(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const targetType = formData.get('target_type')
  const targetId = formData.get('target_id') as string
  const reason = ((formData.get('reason') as string) ?? '').trim()
  const redirectTo = (formData.get('redirect_to') as string) || '/'

  if (!isReportTargetType(targetType) || !targetId) redirect(redirectTo)

  if (reason.length < 1 || reason.length > 500) {
    redirect(`${redirectTo}?error=${encodeURIComponent('Please describe why you are reporting this (max 500 characters).')}`)
  }

  const { error } = await supabase.rpc('submit_report', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
  })

  if (error) {
    console.error('[submitReport] RPC failed:', error)
    const message = error.message.includes('already reported')
      ? 'You already reported this.'
      : 'Could not submit your report. Please try again.'
    await setFlash(message, 'error')
    redirect(redirectTo)
  }

  await setFlash('Report submitted — thank you for helping keep the archive clean.', 'message')
  redirect(redirectTo)
}
