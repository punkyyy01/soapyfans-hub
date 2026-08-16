'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeCSS } from '@/utils/sanitize-css'

import { detectImageFormat } from '@/utils/image-validation'

type Supabase = Awaited<ReturnType<typeof createClient>>

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

export type SaveProfileState = {
  error: string | null
  success: boolean
  username: string | null
}

export async function saveProfile(
  _prevState: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.', success: false, username: null }

  const displayName = ((formData.get('display_name') as string) ?? '').trim().slice(0, 50) || null
  const username    = ((formData.get('username')     as string) ?? '').trim()
  const pronouns    = ((formData.get('pronouns')     as string) ?? '').trim().slice(0, 30) || null
  const bio         = ((formData.get('bio')          as string) ?? '').trim().slice(0, 300) || null
  const locationText = ((formData.get('location_text') as string) ?? '').trim().slice(0, 60) || null
  const websiteUrlRaw = ((formData.get('website_url') as string) ?? '').trim()
  const accentColorRaw = ((formData.get('accent_color') as string) ?? '').trim()
  const profileCssRaw  = ((formData.get('profile_css')  as string) ?? '').trim()
  const showActivity = formData.get('show_activity') === 'true'

  if (!USERNAME_RE.test(username)) {
    return { error: 'Username must be 3–30 characters: letters, numbers, or underscores only.', success: false, username: null }
  }

  const websiteUrl = websiteUrlRaw || null
  if (websiteUrl && !websiteUrl.startsWith('https://')) {
    return { error: 'Website URL must start with https://', success: false, username: null }
  }

  const accentColor = accentColorRaw && HEX_RE.test(accentColorRaw) ? accentColorRaw : null
  const profileCss  = profileCssRaw ? (sanitizeCSS(profileCssRaw) || null) : null

  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', user.id)
    .maybeSingle()
  if (taken) return { error: 'That username is already taken.', success: false, username: null }

  // Fetch current URLs for old-image cleanup after successful uploads
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('avatar_url, banner_url')
    .eq('id', user.id)
    .single()

  let avatarUrl: string | undefined
  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    const res = await uploadImage(
      supabase,
      avatarFile,
      user.id,
      'avatar',
      2 * 1024 * 1024,
      currentProfile?.avatar_url,
    )
    if ('error' in res) return { error: res.error, success: false, username: null }
    avatarUrl = res.url
  }

  let bannerUrl: string | undefined
  const bannerFile = formData.get('banner') as File | null
  if (bannerFile && bannerFile.size > 0) {
    const res = await uploadImage(
      supabase,
      bannerFile,
      user.id,
      'banner',
      3 * 1024 * 1024,
      currentProfile?.banner_url,
    )
    if ('error' in res) return { error: res.error, success: false, username: null }
    bannerUrl = res.url
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      username,
      pronouns,
      bio,
      location_text: locationText,
      website_url: websiteUrl,
      accent_color: accentColor,
      profile_css: profileCss,
      show_activity: showActivity,
      ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      ...(bannerUrl !== undefined && { banner_url: bannerUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: 'Something went wrong. Please try again.', success: false, username: null }

  revalidatePath('/profile/edit')
  revalidatePath(`/profile/${username}`)
  revalidatePath('/', 'layout')
  return { error: null, success: true, username }
}

async function uploadImage(
  supabase: Supabase,
  file: File,
  userId: string,
  type: 'avatar' | 'banner',
  maxBytes: number,
  oldUrl?: string | null,
): Promise<{ url: string } | { error: string }> {
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024))
    return { error: `Image is too large. Maximum size is ${maxMB} MB.` }
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const format = detectImageFormat(bytes)

  if (!format) {
    return { error: 'Unsupported image format. Please upload a valid JPEG, PNG, WebP, or GIF.' }
  }

  const filename = `${Date.now()}.${format.ext}`
  let targetBucket = type === 'banner' ? 'banners' : 'avatars'
  let targetPath = `${userId}/${filename}`

  let { error: uploadError } = await supabase.storage.from(targetBucket).upload(targetPath, buffer, {
    contentType: format.mime,
    cacheControl: '3600',
    upsert: true,
  })

  // Resilient fallback for banners: if 'banners' bucket is not configured or fails, use 'avatars' with user-scoped banner path
  if (uploadError && type === 'banner') {
    targetBucket = 'avatars'
    targetPath = `${userId}/banner-${filename}`
    const fallbackRes = await supabase.storage.from(targetBucket).upload(targetPath, buffer, {
      contentType: format.mime,
      cacheControl: '3600',
      upsert: true,
    })
    uploadError = fallbackRes.error
  }

  if (uploadError) {
    console.error(`[uploadImage] Storage error for ${type}:`, uploadError.message || uploadError)
    return { error: 'Failed to upload image. Please try again.' }
  }

  // Fire-and-forget removal of the previous image
  if (oldUrl) {
    for (const b of ['avatars', 'banners'] as const) {
      const marker = `/storage/v1/object/public/${b}/`
      if (oldUrl.includes(marker)) {
        const oldPath = oldUrl.split(marker)[1]
        if (oldPath && !oldPath.includes('default') && oldPath.startsWith(userId)) {
          supabase.storage.from(b).remove([oldPath]).catch(() => {})
        }
        break
      }
    }
  }

  const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(targetPath)
  return { url: publicUrl }
}

export async function addFavorite(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
): Promise<{ error: string | null; id: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.', id: null }

  const { count } = await supabase
    .from('profile_favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 6) return { error: 'Maximum 6 favorites allowed.', id: null }

  const { data, error } = await supabase
    .from('profile_favorites')
    .insert({ user_id: user.id, tmdb_id: tmdbId, media_type: mediaType, position: count ?? 0 })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Already in your favorites.', id: null }
    return { error: 'Failed to add favorite.', id: null }
  }

  revalidatePath('/profile/edit')
  return { error: null, id: data.id }
}

export async function removeFavorite(favoriteId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profile_favorites')
    .delete()
    .eq('id', favoriteId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to remove favorite.' }

  revalidatePath('/profile/edit')
  return { error: null }
}

export async function reorderFavorites(orderedIds: string[]): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  await Promise.all(
    orderedIds.map((id, position) =>
      supabase
        .from('profile_favorites')
        .update({ position })
        .eq('id', id)
        .eq('user_id', user.id),
    ),
  )

  revalidatePath('/profile/edit')
  return { error: null }
}
