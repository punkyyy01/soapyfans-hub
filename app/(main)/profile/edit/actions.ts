'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sanitizeCSS } from '@/utils/sanitize-css'

import {
  detectImageFormat,
  validateImageSize,
  validateCombinedImageSizes,
} from '@/utils/image-validation'

type Supabase = Awaited<ReturnType<typeof createClient>>

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

export type SaveProfileState = {
  error: string | null
  success: boolean
  username: string | null
}

type UploadedArtifact = {
  url: string
  bucket: string
  path: string
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
  const aboutMeRaw  = (formData.get('about_me')      as string) ?? ''
  if (aboutMeRaw.length > 2000) {
    return { error: 'About Me text must not exceed 2,000 characters.', success: false, username: null }
  }
  const aboutMe     = aboutMeRaw.trim().slice(0, 2000) || null
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

  // 1. Validate file sizes upfront before performing any network upload
  const avatarFile = formData.get('avatar') as File | null
  const bannerFile = formData.get('banner') as File | null
  const hasAvatar = !!(avatarFile && avatarFile.size > 0)
  const hasBanner = !!(bannerFile && bannerFile.size > 0)
  const avatarSize = hasAvatar ? avatarFile!.size : 0
  const bannerSize = hasBanner ? bannerFile!.size : 0

  if (hasAvatar) {
    const avatarValidation = validateImageSize(avatarSize, 'avatar')
    if (!avatarValidation.valid) {
      return { error: avatarValidation.error!, success: false, username: null }
    }
  }

  if (hasBanner) {
    const bannerValidation = validateImageSize(bannerSize, 'banner')
    if (!bannerValidation.valid) {
      return { error: bannerValidation.error!, success: false, username: null }
    }
  }

  if (hasAvatar && hasBanner) {
    const combinedValidation = validateCombinedImageSizes(avatarSize, bannerSize)
    if (!combinedValidation.valid) {
      return { error: combinedValidation.error!, success: false, username: null }
    }
  }

  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', user.id)
    .maybeSingle()
  if (taken) return { error: 'That username is already taken.', success: false, username: null }

  // Fetch current URLs for atomic cleanup after successful DB update
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('avatar_url, banner_url')
    .eq('id', user.id)
    .single()

  let uploadedAvatar: UploadedArtifact | undefined
  let uploadedBanner: UploadedArtifact | undefined

  // 2. Perform upload with atomic tracking
  if (hasAvatar) {
    const res = await uploadImage(supabase, avatarFile!, user.id, 'avatar')
    if ('error' in res) {
      return { error: res.error, success: false, username: null }
    }
    uploadedAvatar = res
  }

  if (hasBanner) {
    const res = await uploadImage(supabase, bannerFile!, user.id, 'banner')
    if ('error' in res) {
      // Roll back uploaded avatar if banner upload fails
      if (uploadedAvatar) {
        await supabase.storage.from(uploadedAvatar.bucket).remove([uploadedAvatar.path]).catch(() => {})
      }
      return { error: res.error, success: false, username: null }
    }
    uploadedBanner = res
  }

  // 3. Update profile record in database
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      username,
      pronouns,
      bio,
      about_me: aboutMe,
      location_text: locationText,
      website_url: websiteUrl,
      accent_color: accentColor,
      profile_css: profileCss,
      show_activity: showActivity,
      ...(uploadedAvatar !== undefined && { avatar_url: uploadedAvatar.url }),
      ...(uploadedBanner !== undefined && { banner_url: uploadedBanner.url }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    // Roll back uploaded files on DB update failure
    if (uploadedAvatar) {
      await supabase.storage.from(uploadedAvatar.bucket).remove([uploadedAvatar.path]).catch(() => {})
    }
    if (uploadedBanner) {
      await supabase.storage.from(uploadedBanner.bucket).remove([uploadedBanner.path]).catch(() => {})
    }
    return { error: 'Failed to update profile. Please try again.', success: false, username: null }
  }

  // 4. Safe post-update cleanup: delete previous images only after DB update confirmed
  if (uploadedAvatar && currentProfile?.avatar_url) {
    deleteOldImage(supabase, user.id, currentProfile.avatar_url).catch(() => {})
  }
  if (uploadedBanner && currentProfile?.banner_url) {
    deleteOldImage(supabase, user.id, currentProfile.banner_url).catch(() => {})
  }

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
): Promise<UploadedArtifact | { error: string }> {
  const sizeValidation = validateImageSize(file.size, type)
  if (!sizeValidation.valid) {
    return { error: sizeValidation.error! }
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const format = detectImageFormat(bytes)

  if (!format) {
    console.warn(`[uploadImage:rejected_format] Unsupported binary format for ${type}:`, {
      userId,
      fileSize: file.size,
      browserType: file.type,
      fileName: file.name,
      firstBytes: Array.from(bytes.slice(0, 16)).map((b) => b.toString(16).padStart(2, '0')).join(' '),
    })
    return { error: 'Unsupported image format. Please upload a valid JPEG, PNG, WebP, or GIF.' }
  }

  // Use Node Buffer to allow safe, reusable binary payloads without detached ArrayBuffer issues on retries
  const payload = Buffer.from(arrayBuffer)
  const filename = `${Date.now()}.${format.ext}`
  let targetBucket = type === 'banner' ? 'banners' : 'avatars'
  let targetPath = `${userId}/${filename}`

  console.log(`[uploadImage:attempt] Uploading ${type} (${format.isAnimated ? 'animated ' : ''}${format.ext}, ${file.size} bytes) to bucket '${targetBucket}':`, {
    targetPath,
    contentType: format.mime,
    isAnimated: Boolean(format.isAnimated),
  })

  let { error: uploadError } = await supabase.storage.from(targetBucket).upload(targetPath, payload, {
    contentType: format.mime,
    cacheControl: '3600',
    upsert: true,
  })

  // Resilient fallback for banners: if 'banners' bucket is not configured or fails, use 'avatars' with user-scoped banner path
  if (uploadError && type === 'banner') {
    console.warn(`[uploadImage:fallback] Primary bucket '${targetBucket}' failed for banner (${uploadError.message || uploadError}), attempting fallback to 'avatars'...`)
    targetBucket = 'avatars'
    targetPath = `${userId}/banner-${filename}`
    const fallbackRes = await supabase.storage.from(targetBucket).upload(targetPath, payload, {
      contentType: format.mime,
      cacheControl: '3600',
      upsert: true,
    })
    uploadError = fallbackRes.error
    if (uploadError) {
      console.error(`[uploadImage:fallback_failed] Fallback to 'avatars' bucket also failed:`, {
        message: uploadError.message,
        name: uploadError.name,
        statusCode: (uploadError as any)?.statusCode || (uploadError as any)?.status,
      })
    } else {
      console.log(`[uploadImage:fallback_success] Banner successfully stored in fallback bucket 'avatars' at ${targetPath}`)
    }
  }

  if (uploadError) {
    console.error(`[uploadImage:final_error] Storage error for ${type}:`, {
      type,
      bucket: targetBucket,
      path: targetPath,
      fileSize: file.size,
      browserType: file.type,
      detectedMime: format.mime,
      detectedExt: format.ext,
      isAnimated: Boolean(format.isAnimated),
      errorMessage: uploadError.message || String(uploadError),
      errorName: uploadError.name,
      statusCode: (uploadError as any)?.statusCode || (uploadError as any)?.status,
    })

    const isSizeError =
      (uploadError as any)?.statusCode === 413 ||
      uploadError.message?.toLowerCase().includes('size') ||
      uploadError.message?.toLowerCase().includes('large')

    if (isSizeError) {
      return { error: `${type === 'banner' ? 'Banner' : 'Avatar'} file exceeds storage limits. Please choose a smaller image.` }
    }

    return { error: `Failed to upload ${type}. Please try again.` }
  }

  const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(targetPath)
  return { url: publicUrl, bucket: targetBucket, path: targetPath }
}

async function deleteOldImage(
  supabase: Supabase,
  userId: string,
  oldUrl: string,
): Promise<void> {
  for (const b of ['avatars', 'banners'] as const) {
    const marker = `/storage/v1/object/public/${b}/`
    if (oldUrl.includes(marker)) {
      const oldPath = oldUrl.split(marker)[1]
      if (oldPath && !oldPath.includes('default') && oldPath.startsWith(userId)) {
        await supabase.storage.from(b).remove([oldPath]).catch(() => {})
      }
      break
    }
  }
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
