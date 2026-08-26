'use client'

import { useActionState, useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { saveProfile, addFavorite, removeFavorite, reorderFavorites } from '@/app/(main)/profile/edit/actions'
import type { SaveProfileState } from '@/app/(main)/profile/edit/actions'
import type { EnrichedFavorite } from '@/app/(main)/profile/edit/page'
import {
  ALLOWED_IMAGE_MIMES,
  validateImageSize,
  validateCombinedImageSizes,
} from '@/utils/image-validation'
import Button from '@/components/ui/Button'
import CssPreviewPanel from './CssPreviewPanel'
import FavoritesSearchModal, { type FavoriteSearchResult } from './FavoritesSearchModal'
import IdentitySection from './edit-sections/IdentitySection'
import AppearanceSection from './edit-sections/AppearanceSection'
import SophiePicksSection from './edit-sections/SophiePicksSection'
import VisibilitySection from './edit-sections/VisibilitySection'
import AdvancedCssSection from './edit-sections/AdvancedCssSection'

interface ProfileData {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  about_me: string | null
  pronouns: string | null
  location_text: string | null
  website_url: string | null
  accent_color: string | null
  profile_css: string | null
  show_activity: boolean
}

interface Props {
  profile: ProfileData
  initialFavorites: EnrichedFavorite[]
}

const FALLBACK_ACCENT = '#e8890c'

export default function ProfileEditForm({ profile, initialFavorites }: Props) {
  // Identity state
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username, setUsername]       = useState(profile.username ?? '')
  const [pronouns, setPronouns]       = useState(profile.pronouns ?? '')
  const [bio, setBio]                 = useState(profile.bio ?? '')
  const [aboutMe, setAboutMe]         = useState(profile.about_me ?? '')
  const [locationText, setLocation]   = useState(profile.location_text ?? '')
  const [websiteUrl, setWebsite]      = useState(profile.website_url ?? '')

  // Appearance state
  const [accentColor, setAccentColor] = useState(profile.accent_color ?? FALLBACK_ACCENT)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Custom CSS state
  const [profileCss, setProfileCss]     = useState(profile.profile_css ?? '')
  const [showPreview, setShowPreview]   = useState(false)

  // Privacy state
  const [showActivity, setShowActivity] = useState(profile.show_activity)

  // Feedback Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Favorites state
  const [favorites, setFavorites]         = useState<EnrichedFavorite[]>(initialFavorites)
  const [showSearch, setShowSearch]       = useState(false)
  const [dragIndex, setDragIndex]         = useState<number | null>(null)
  const [dragOver, setDragOver]           = useState<number | null>(null)

  // Save action state
  const initState: SaveProfileState = { error: null, success: false, username: null }
  const [saveState, formAction, isPending] = useActionState(saveProfile, initState)

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return (
      displayName !== (profile.display_name ?? '') ||
      username !== (profile.username ?? '') ||
      pronouns !== (profile.pronouns ?? '') ||
      bio !== (profile.bio ?? '') ||
      aboutMe !== (profile.about_me ?? '') ||
      locationText !== (profile.location_text ?? '') ||
      websiteUrl !== (profile.website_url ?? '') ||
      accentColor.toLowerCase() !== (profile.accent_color ?? FALLBACK_ACCENT).toLowerCase() ||
      profileCss !== (profile.profile_css ?? '') ||
      showActivity !== profile.show_activity ||
      avatarPreview !== profile.avatar_url ||
      bannerPreview !== profile.banner_url
    )
  }, [
    displayName,
    username,
    pronouns,
    bio,
    aboutMe,
    locationText,
    websiteUrl,
    accentColor,
    profileCss,
    showActivity,
    avatarPreview,
    bannerPreview,
    profile,
  ])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // React to save result
  const isInitial = useRef(true)
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }
    if (saveState.success) {
      setToast({ type: 'success', msg: 'Profile atelier changes saved successfully.' })
    } else if (saveState.error) {
      setToast({ type: 'error', msg: saveState.error })
    }
  }, [saveState])

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
      if (bannerPreview?.startsWith('blob:')) URL.revokeObjectURL(bannerPreview)
    }
  }, [avatarPreview, bannerPreview])

  // File change handlers
  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isImageMime = ALLOWED_IMAGE_MIMES.includes(file.type as typeof ALLOWED_IMAGE_MIMES[number])
    const hasImageExt = /\.(jpe?g|png|webp|gif)$/i.test(file.name)
    if (!isImageMime && !hasImageExt) {
      setToast({ type: 'error', msg: 'Unsupported image format. Please select JPEG, PNG, WebP, or GIF.' })
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }

    const sizeValidation = validateImageSize(file.size, 'avatar')
    if (!sizeValidation.valid) {
      setToast({ type: 'error', msg: sizeValidation.error! })
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }

    const currentBannerFile = bannerInputRef.current?.files?.[0]
    if (currentBannerFile) {
      const combinedValidation = validateCombinedImageSizes(file.size, currentBannerFile.size)
      if (!combinedValidation.valid) {
        setToast({ type: 'error', msg: combinedValidation.error! })
        if (avatarInputRef.current) avatarInputRef.current.value = ''
        return
      }
    }

    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function onBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isImageMime = ALLOWED_IMAGE_MIMES.includes(file.type as typeof ALLOWED_IMAGE_MIMES[number])
    const hasImageExt = /\.(jpe?g|png|webp|gif)$/i.test(file.name)
    if (!isImageMime && !hasImageExt) {
      setToast({ type: 'error', msg: 'Unsupported image format. Please select JPEG, PNG, WebP, or GIF.' })
      if (bannerInputRef.current) bannerInputRef.current.value = ''
      return
    }

    const sizeValidation = validateImageSize(file.size, 'banner')
    if (!sizeValidation.valid) {
      setToast({ type: 'error', msg: sizeValidation.error! })
      if (bannerInputRef.current) bannerInputRef.current.value = ''
      return
    }

    const currentAvatarFile = avatarInputRef.current?.files?.[0]
    if (currentAvatarFile) {
      const combinedValidation = validateCombinedImageSizes(currentAvatarFile.size, file.size)
      if (!combinedValidation.valid) {
        setToast({ type: 'error', msg: combinedValidation.error! })
        if (bannerInputRef.current) bannerInputRef.current.value = ''
        return
      }
    }

    if (bannerPreview?.startsWith('blob:')) URL.revokeObjectURL(bannerPreview)
    setBannerPreview(URL.createObjectURL(file))
  }

  // Drag & drop handlers for favorites
  function onDragStart(index: number) {
    setDragIndex(index)
  }

  function onDragEnd() {
    setDragIndex(null)
    setDragOver(null)
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const next = [...favorites]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setFavorites(next)
    setDragIndex(null)
    setDragOver(null)
    reorderFavorites(next.map((f) => f.id))
  }

  async function handleRemoveFavorite(id: string) {
    setFavorites((prev) => prev.filter((f) => f.id !== id))
    const res = await removeFavorite(id)
    if (res.error) setToast({ type: 'error', msg: res.error })
  }

  async function handleAddFavorite(result: FavoriteSearchResult) {
    if (favorites.length >= 6) return
    const already = favorites.some(
      (f) => f.tmdb_id === result.tmdb_id && f.media_type === result.media_type,
    )
    if (already) {
      setToast({ type: 'error', msg: 'This title is already in your favorites.' })
      return
    }

    const optimistic: EnrichedFavorite = {
      id: `tmp-${Date.now()}`,
      tmdb_id: result.tmdb_id,
      media_type: result.media_type,
      position: favorites.length,
      title: result.title,
      posterPath: result.poster_url,
    }
    setFavorites((prev) => [...prev, optimistic])
    setShowSearch(false)

    const res = await addFavorite(result.tmdb_id, result.media_type)
    if (res.error) {
      setFavorites((prev) => prev.filter((f) => f.id !== optimistic.id))
      setToast({ type: 'error', msg: res.error })
    } else if (res.id) {
      setFavorites((prev) =>
        prev.map((f) => (f.id === optimistic.id ? { ...f, id: res.id! } : f)),
      )
    }
  }

  // Always link back to the committed database profile to prevent 404 on uncommitted inputs
  const savedProfileSlug = saveState.username || profile.username || profile.id

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const avatarFile = avatarInputRef.current?.files?.[0]
    const bannerFile = bannerInputRef.current?.files?.[0]
    const avatarSize = avatarFile?.size ?? 0
    const bannerSize = bannerFile?.size ?? 0

    if (avatarFile) {
      const val = validateImageSize(avatarSize, 'avatar')
      if (!val.valid) {
        e.preventDefault()
        setToast({ type: 'error', msg: val.error! })
        return
      }
    }

    if (bannerFile) {
      const val = validateImageSize(bannerSize, 'banner')
      if (!val.valid) {
        e.preventDefault()
        setToast({ type: 'error', msg: val.error! })
        return
      }
    }

    if (avatarFile && bannerFile) {
      const comb = validateCombinedImageSizes(avatarSize, bannerSize)
      if (!comb.valid) {
        e.preventDefault()
        setToast({ type: 'error', msg: comb.error! })
        return
      }
    }
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 rounded-full border px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'border-[var(--accent-forest)] bg-[var(--bg-elevated)]/95 text-emerald-300'
              : 'border-red-800/80 bg-[var(--bg-elevated)]/95 text-red-300'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Scoped CSS Preview Modal */}
      {showPreview && (
        <CssPreviewPanel
          displayName={displayName || profile.username || 'Anonymous'}
          username={username || profile.username || ''}
          pronouns={pronouns}
          bio={bio}
          aboutMe={aboutMe}
          avatarUrl={avatarPreview}
          bannerUrl={bannerPreview}
          accentColor={accentColor}
          css={profileCss}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Sophie Picks Search Modal */}
      {showSearch && (
        <FavoritesSearchModal
          onAdd={handleAddFavorite}
          onClose={() => setShowSearch(false)}
          disabled={favorites.length >= 6}
        />
      )}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <header className="mb-12 border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-eyebrow">
              Personal Archive · Atelier
            </p>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-[0.96] tracking-tight text-[var(--text-primary)]">
              Edit Profile
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              Curate your personal space, customize your visual identity, manage Sophie Thatcher favorites, and write scoped canvas CSS.
            </p>
          </div>

          <Button href={`/profile/${savedProfileSlug}`} variant="secondary" size="sm">
            View Public Profile ↗
          </Button>
        </div>

        {/* Atelier Section Navigation Anchors */}
        <nav aria-label="Atelier sections" className="mt-8 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)] font-mono text-xs">
          <a
            href="#identity"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
          >
            01 · Identity
          </a>
          <a
            href="#appearance"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
          >
            02 · Appearance
          </a>
          <a
            href="#curation"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
          >
            03 · Sophie Picks
          </a>
          <a
            href="#visibility"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
          >
            04 · Visibility
          </a>
          <a
            href="#advanced"
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-ring"
          >
            05 · Custom CSS
          </a>
        </nav>
      </header>

      {/* ── Form Body ────────────────────────────────────────────────────── */}
      <form action={formAction} onSubmit={handleSubmit} className="space-y-16">
        {/* Hidden controlled fields */}
        <input type="hidden" name="accent_color" value={accentColor} />
        <input type="hidden" name="profile_css"  value={profileCss} />
        <input type="hidden" name="show_activity" value={showActivity ? 'true' : 'false'} />

        <IdentitySection
          displayName={displayName}
          setDisplayName={setDisplayName}
          username={username}
          setUsername={setUsername}
          pronouns={pronouns}
          setPronouns={setPronouns}
          locationText={locationText}
          setLocation={setLocation}
          bio={bio}
          setBio={setBio}
          aboutMe={aboutMe}
          setAboutMe={setAboutMe}
          websiteUrl={websiteUrl}
          setWebsite={setWebsite}
        />

        <AppearanceSection
          displayName={displayName}
          username={username}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          fallbackAccent={FALLBACK_ACCENT}
          avatarPreview={avatarPreview}
          bannerPreview={bannerPreview}
          avatarInputRef={avatarInputRef}
          bannerInputRef={bannerInputRef}
          onAvatarChange={onAvatarChange}
          onBannerChange={onBannerChange}
        />

        <SophiePicksSection
          favorites={favorites}
          dragIndex={dragIndex}
          dragOver={dragOver}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={setDragOver}
          onDrop={onDrop}
          onRemove={handleRemoveFavorite}
          onOpenSearch={() => setShowSearch(true)}
        />

        <VisibilitySection showActivity={showActivity} setShowActivity={setShowActivity} />

        <AdvancedCssSection
          profileCss={profileCss}
          setProfileCss={setProfileCss}
          onPreview={() => setShowPreview(true)}
        />

        {/* ── STICKY ACTION BAR: SAVE / CANCEL ── */}
        <div className="sticky bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 p-5 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isDirty ? (
              <span className="flex items-center gap-2 font-mono text-xs text-[var(--accent-amber)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
                Unsaved changes in atelier
              </span>
            ) : (
              <span className="font-mono text-xs text-[var(--text-muted)]">
                All changes saved to archive profile.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href={`/profile/${savedProfileSlug}`}
              className="rounded-full border border-transparent px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              Cancel
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isPending}
            >
              {isPending ? 'Saving Atelier…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
