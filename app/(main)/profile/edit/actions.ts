'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeCSS } from '@/utils/sanitize-css'

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

  let avatarUrl: string | undefined
  const avatarFile = formData.get('avatar') as File | null
  if (avatarFile && avatarFile.size > 0) {
    const res = await uploadImage(supabase, avatarFile, `${user.id}/${Date.now()}`, 2 * 1024 * 1024)
    if ('error' in res) return { error: res.error, success: false, username: null }
    avatarUrl = res.url
  }

  let bannerUrl: string | undefined
  const bannerFile = formData.get('banner') as File | null
  if (bannerFile && bannerFile.size > 0) {
    const res = await uploadImage(supabase, bannerFile, `banners/${user.id}/${Date.now()}`, 3 * 1024 * 1024)
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
  return { error: null, success: true, username }
}

async function uploadImage(
  supabase: Supabase,
  file: File,
  basePath: string,
  maxBytes: number,
): Promise<{ url: string } | { error: string }> {
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!ALLOWED.includes(file.type)) return { error: 'Image must be a JPEG, PNG, WebP, or GIF.' }
  if (file.size > maxBytes) {
    return { error: `Image must be under ${Math.round(maxBytes / 1024 / 1024)} MB.` }
  }
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const isValid =
    (bytes[0] === 0xff && bytes[1] === 0xd8) ||
    (bytes[0] === 0x89 && bytes[1] === 0x50) ||
    (bytes[0] === 0x47 && bytes[1] === 0x49) ||
    (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57 && bytes[9] === 0x45)
  if (!isValid) return { error: 'Image must be a JPEG, PNG, WebP, or GIF.' }

  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type]!
  const path = `${basePath}.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  })
  if (error) return { error: 'Failed to upload image. Please try again.' }

  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  return { url }
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
