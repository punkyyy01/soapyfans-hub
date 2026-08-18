'use client'

import { useActionState, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { saveProfile, addFavorite, removeFavorite, reorderFavorites } from '@/app/(main)/profile/edit/actions'
import type { SaveProfileState } from '@/app/(main)/profile/edit/actions'
import type { EnrichedFavorite } from '@/app/(main)/profile/edit/page'
import { sanitizeCSS } from '@/utils/sanitize-css'
import {
  ALLOWED_IMAGE_MIMES,
  validateImageSize,
  validateCombinedImageSizes,
} from '@/utils/image-validation'
import { getTmdbImageUrl } from '@/utils/tmdb'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchResult = {
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_url: string | null
  year: string | null
}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring'

const LABEL_CLS =
  'block text-eyebrow mb-1.5'

const FALLBACK_ACCENT = '#e8890c'

// ─── Main Component ───────────────────────────────────────────────────────────

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

  async function handleAddFavorite(result: SearchResult) {
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

  const profileSlug = username || profile.username || profile.id
  const cssCharCount = profileCss.length

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
          className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md transition-all ${
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
        <SearchModal
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

          <Button href={`/profile/${profileSlug}`} variant="secondary" size="sm">
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

        {/* ── SECTION 01: IDENTITY ── */}
        <section id="identity" className="scroll-mt-28 space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-eyebrow">
                01 · Identity
              </p>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Public details
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
              The Curator
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Your name, handle, bio, about me description, and external links displayed across the archive.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS} htmlFor="display_name">
                Display Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Natalie Scatorccio"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className={LABEL_CLS} htmlFor="username">
                Username <span className="text-[var(--accent-amber)]">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-mono text-xs text-[var(--text-muted)]">
                  @
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  maxLength={30}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className={`${INPUT_CLS} pl-9 font-mono`}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS} htmlFor="pronouns">
                Pronouns
              </label>
              <input
                id="pronouns"
                name="pronouns"
                type="text"
                maxLength={30}
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her, they/them, he/him"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className={LABEL_CLS} htmlFor="location_text">
                Location
              </label>
              <input
                id="location_text"
                name="location_text"
                type="text"
                maxLength={60}
                value={locationText}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Chicago, Los Angeles, etc."
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={LABEL_CLS} htmlFor="bio">
                Short Bio
              </label>
              <span className={`font-mono text-xs tabular-nums ${bio.length > 270 ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}>
                {bio.length} / 300
              </span>
            </div>
            <textarea
              id="bio"
              name="bio"
              rows={2}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words on your favorite Sophie Thatcher roles, musical releases, or reflections on the archive…"
              className={`${INPUT_CLS} resize-none leading-relaxed`}
            />
          </div>

          {/* About Me (Extended Free Text) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={LABEL_CLS} htmlFor="about_me">
                About Me
              </label>
              <span className={`font-mono text-xs tabular-nums ${aboutMe.length > 1900 ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}>
                {aboutMe.length.toLocaleString()} / 2,000
              </span>
            </div>
            <textarea
              id="about_me"
              name="about_me"
              rows={5}
              maxLength={2000}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Tell visitors a little more about you, your connection to Sophie, or what you like about the archive…"
              className={`${INPUT_CLS} resize-y leading-relaxed`}
            />
            <p className="mt-1.5 font-mono text-[0.68rem] text-[var(--text-muted)]">
              Tell visitors a little more about you, your connection to Sophie, or what you like about the archive. Line breaks and paragraphs are preserved.
            </p>
          </div>

          <div>
            <label className={LABEL_CLS} htmlFor="website_url">
              Website or Link
            </label>
            <input
              id="website_url"
              name="website_url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              className={INPUT_CLS}
            />
            <p className="mt-1.5 font-mono text-[0.68rem] text-[var(--text-muted)]">
              Must start with https:// (Instagram, Letterboxd, personal site, etc.)
            </p>
          </div>
        </section>

        {/* ── SECTION 02: APPEARANCE ── */}
        <section id="appearance" className="scroll-mt-28 space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-eyebrow">
                02 · Appearance
              </p>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Visual identity
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
              Visual Canvas
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Your portrait avatar, profile banner, and signature accent hue.
            </p>
          </div>

          {/* Avatar & Banner Row */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Avatar Block */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 md:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <label className={LABEL_CLS}>Portrait Avatar</label>
                <div className="mt-4 flex items-center gap-5">
                  {/* Avatar ring using 4-layer isolated architecture */}
                  <div
                    className="relative shrink-0 rounded-full isolate"
                    style={{
                      padding: '3px',
                      background: accentColor,
                      boxShadow: '0 0 0 3px var(--bg-base)',
                    }}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[var(--bg-base)]">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt="Avatar preview"
                          width={80}
                          height={80}
                          className="h-full w-full object-cover object-center rounded-full"
                          unoptimized={avatarPreview.startsWith('blob:')}
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center rounded-full font-display text-2xl font-medium text-[var(--bg-base)]"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)`,
                          }}
                        >
                          {(displayName || username || '?')[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Upload portrait
                    </Button>
                    <p className="font-mono text-[0.65rem] text-[var(--text-muted)] leading-tight">
                      JPEG, PNG, WebP or GIF · max 2 MB
                    </p>
                  </div>
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onAvatarChange}
              />
            </div>

            {/* Banner Block */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLS}>Header Banner</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    Upload banner
                  </Button>
                </div>

                <div
                  className="relative z-0 mt-3.5 h-24 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)]"
                  style={
                    !bannerPreview
                      ? {
                          background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}12 60%, transparent 100%)`,
                        }
                      : undefined
                  }
                >
                  {bannerPreview && (
                    <Image
                      src={bannerPreview}
                      alt="Banner preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover object-center"
                      unoptimized={bannerPreview.startsWith('blob:')}
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent opacity-80"
                  />
                </div>
                <p className="mt-2 font-mono text-[0.65rem] text-[var(--text-muted)]">
                  Wide landscape banner · max 3 MB · Fades seamlessly into profile background
                </p>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                name="banner"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onBannerChange}
              />
            </div>
          </div>

          {/* Accent Color Customization */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="accent_color_picker">
                  Profile Accent Tone
                </label>
                <p className="text-xs text-[var(--text-secondary)] text-pretty max-w-md">
                  Customizes your avatar portrait border, fallback header ambiance, and personal profile canvas highlights.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-base)]/80 px-3.5 py-1.5 shadow-inner">
                  <div
                    className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-black/30 shadow-xs"
                    style={{ background: accentColor }}
                  >
                    <input
                      id="accent_color_picker"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="absolute -inset-2 h-9 w-9 cursor-pointer opacity-0"
                      aria-label="Choose profile accent color"
                    />
                  </div>
                  <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                    {accentColor}
                  </span>
                </div>

                {accentColor.toLowerCase() !== FALLBACK_ACCENT.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => setAccentColor(FALLBACK_ACCENT)}
                    className="rounded-full border border-[var(--border-subtle)] px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer focus-ring"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 03: SOPHIE PICKS ── */}
        <section id="curation" className="scroll-mt-28 space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex items-baseline gap-3">
                <p className="text-eyebrow">
                  03 · Curation
                </p>
                <span className="font-mono text-xs tabular-nums text-[var(--text-muted)] uppercase tracking-wider">
                  {favorites.length} / 6 selected
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
                Sophie Picks
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Feature up to 6 of your favorite Sophie Thatcher films or series. Drag cards to reorder your top picks.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={favorites.length >= 6}
              onClick={() => setShowSearch(true)}
            >
              + Add Title
            </Button>
          </div>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">No favorites curated yet</p>
              <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
                Select your top Sophie Thatcher performances from Prospect, Yellowjackets, Heretic, Companion, and more.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                >
                  Browse &amp; Add Favorites
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-6 sm:gap-4">
              {favorites.map((fav, index) => {
                const posterUrl = getTmdbImageUrl(fav.posterPath, 'w342')
                const isDragging = dragIndex === index
                const isOver = dragOver === index && dragIndex !== index

                return (
                  <div
                    key={fav.id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(index)
                    }}
                    onDrop={() => onDrop(index)}
                    className={`group relative aspect-[2/3] cursor-grab overflow-hidden rounded-xl border transition-all active:cursor-grabbing ${
                      isDragging
                        ? 'scale-95 opacity-50 border-[var(--accent-amber)]'
                        : isOver
                          ? 'scale-[1.03] border-[var(--accent-amber)] shadow-lg'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={fav.title ?? ''}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, 15vw"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">
                        {fav.title ?? '?'}
                      </div>
                    )}

                    {/* Rank pill */}
                    <div className="absolute left-2 top-2 rounded-full border border-black/30 bg-black/75 px-2 py-0.5 font-mono text-[0.62rem] text-white/90 backdrop-blur-xs">
                      #{index + 1}
                    </div>

                    {/* Media type badge */}
                    {fav.media_type === 'tv' && (
                      <div className="absolute right-2 bottom-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/80 backdrop-blur-xs">
                        TV
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/85 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-900 focus-ring cursor-pointer"
                      aria-label={`Remove ${fav.title}`}
                    >
                      ×
                    </button>
                  </div>
                )
              })}

              {/* Placeholder slot if < 6 */}
              {favorites.length < 6 && (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="group flex aspect-[2/3] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 p-3 text-center transition-all hover:border-[var(--accent-amber)]/60 hover:bg-[var(--accent-amber)]/5 focus-ring cursor-pointer"
                >
                  <span className="text-xl text-[var(--text-muted)] transition-transform group-hover:scale-125 group-hover:text-[var(--accent-amber)]">
                    +
                  </span>
                  <span className="mt-1 font-mono text-[0.62rem] uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                    Add slot
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── SECTION 04: PRIVACY ── */}
        <section id="visibility" className="scroll-mt-28 space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-eyebrow">
                04 · Visibility
              </p>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Privacy
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
              Archive Activity
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Control the visibility of your film and music reviews on your public profile.
            </p>
          </div>

          <div className="flex items-start justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Show review activity on public profile
              </p>
              <p className="text-xs leading-relaxed text-[var(--text-muted)] text-pretty max-w-xl">
                When enabled, other visitors can explore your ratings and written reviews for Sophie Thatcher credits. When disabled, your activity feed remains completely private.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={showActivity}
              onClick={() => setShowActivity((v) => !v)}
              className={`relative mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-ring ${
                showActivity
                  ? 'border-[var(--accent-amber)] bg-[var(--accent-amber)]'
                  : 'border-[var(--border-strong)] bg-[var(--bg-elevated)]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
                  showActivity ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ── SECTION 05: ADVANCED / CUSTOM CSS ── */}
        <section id="advanced" className="scroll-mt-28 space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <p className="text-eyebrow">
                05 · Advanced
              </p>
              <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
                Custom Canvas CSS
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Write custom CSS declarations scoped directly to your profile canvas container (<code className="font-mono text-[var(--accent-amber)]">#profile-canvas</code>).
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              Preview Canvas ↗
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-6 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--text-muted)]">
              <span>Scoped declarations: <code className="text-[var(--accent-amber)]">#profile-canvas &#123; ... &#125;</code></span>
              <span className={`tabular-nums ${cssCharCount > 1900 ? 'text-red-400 font-medium' : ''}`}>
                {cssCharCount.toLocaleString()} / 2,000
              </span>
            </div>

            <textarea
              name="profile_css_display"
              rows={7}
              value={profileCss}
              onChange={(e) => setProfileCss(e.target.value)}
              maxLength={2000}
              spellCheck={false}
              placeholder={`/* Example custom declarations */
/* background: #0e0d08; */
/* color: #f5f0e8; */
/* border: 2px solid var(--accent-amber); */`}
              className={`${INPUT_CLS} font-mono text-xs leading-relaxed resize-y`}
            />

            <p className="font-mono text-[0.68rem] text-[var(--text-muted)] leading-relaxed">
              Rules are automatically sanitized on submission. External scripts, @import, @font-face, fixed/sticky layout breakaways, and javascript: protocols are disallowed.
            </p>
          </div>
        </section>

        {/* ── STICKY ACTION BAR: SAVE / CANCEL ── */}
        <div className="sticky bottom-6 z-30 flex flex-col gap-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 p-5 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
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
              href={`/profile/${profileSlug}`}
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

// ─── CSS Preview Modal Panel ──────────────────────────────────────────────────

function CssPreviewPanel({
  displayName,
  username,
  pronouns,
  bio,
  aboutMe,
  avatarUrl,
  bannerUrl,
  accentColor,
  css,
  onClose,
}: {
  displayName: string
  username: string
  pronouns: string
  bio: string
  aboutMe: string
  avatarUrl: string | null
  bannerUrl: string | null
  accentColor: string
  css: string
  onClose: () => void
}) {
  const sanitized = sanitizeCSS(css)
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[var(--bg-base)] p-4 sm:p-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 mx-auto mb-6 flex max-w-5xl items-center justify-between rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 px-6 py-3.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-amber)] font-medium">
            Live Canvas Preview
          </span>
          {!sanitized && css.trim() && (
            <span className="font-mono text-xs text-red-400">
              (CSS blocked: contains disallowed rules)
            </span>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close Preview ✕
        </Button>
      </div>

      {/* Scoped Custom CSS */}
      {sanitized && <style>{`#profile-canvas-preview { ${sanitized} }`}</style>}

      {/* Preview Canvas using 4-Layer Architecture */}
      <div
        id="profile-canvas-preview"
        className="profile-canvas mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 shadow-2xl"
      >
        {/* Layer 1: Banner & Overlay */}
        <div
          className="relative z-0 h-[180px] w-full overflow-hidden sm:h-[240px]"
          style={
            !bannerUrl
              ? {
                  background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}12 60%, transparent 100%)`,
                }
              : undefined
          }
        >
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt="Banner preview"
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-center"
              unoptimized={bannerUrl.startsWith('blob:')}
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent opacity-80"
          />
        </div>

        {/* Layer 2: Profile Content */}
        <div className="relative z-10 px-6 pb-16 pt-0 sm:px-10 sm:pb-20">
          <div className="relative z-20 -mt-12 flex flex-wrap items-end gap-4 sm:-mt-16">
            {/* Layer 3: Independent Avatar */}
            <div
              className="relative shrink-0 rounded-full isolate"
              style={{
                padding: '4px',
                background: accentColor,
                boxShadow: '0 0 0 4px var(--bg-surface)',
              }}
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--bg-base)] sm:h-28 sm:w-28">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover object-center rounded-full"
                    unoptimized={avatarUrl.startsWith('blob:')}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center rounded-full font-display text-3xl font-medium text-[var(--bg-base)] sm:text-4xl"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)`,
                    }}
                  >
                    {initial}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {displayName || 'Your Display Name'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {username && (
                  <span className="font-mono text-sm text-[var(--text-muted)]">@{username}</span>
                )}
                {pronouns && (
                  <>
                    <span className="text-[var(--border-subtle)]" aria-hidden="true">·</span>
                    <span className="text-xs italic text-[var(--text-muted)]">{pronouns}</span>
                  </>
                )}
              </div>
            </div>

            {bio && (
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty sm:text-base">
                {bio}
              </p>
            )}

            {aboutMe && (
              <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 space-y-3">
                <div>
                  <p className="text-eyebrow">About Me</p>
                  <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-[var(--text-primary)]">
                    A little more about me
                  </h2>
                </div>
                <div className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                  {aboutMe}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Search Modal ─────────────────────────────────────────────────────────────

function SearchModal({
  onAdd,
  onClose,
  disabled,
}: {
  onAdd: (r: SearchResult) => void
  onClose: () => void
  disabled: boolean
}) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<SearchResult[]>([])
  const [isSearching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/tmdb-search?q=${encodeURIComponent(q.trim())}`)
      const { results: data } = (await res.json()) as { results: SearchResult[] }
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-20 sm:pt-28 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <p className="text-eyebrow">
            Add to Sophie Picks
          </p>
          <button
            onClick={onClose}
            className="text-lg text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer focus-ring"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Sophie Thatcher films &amp; shows…"
            className={INPUT_CLS}
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto px-6 py-4">
          {isSearching && (
            <p className="py-6 text-center font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Searching credits…
            </p>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              No Sophie Thatcher credits found for &ldquo;{query}&rdquo;.
            </p>
          )}

          {!isSearching && results.length > 0 && (
            <ul className="space-y-2">
              {results.map((r) => {
                const posterUrl = r.poster_url

                return (
                  <li key={`${r.tmdb_id}-${r.media_type}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(r)}
                      className="flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-ring"
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={r.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[0.6rem] text-[var(--text-muted)]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {r.title}
                        </p>
                        <p className="font-mono text-[0.68rem] text-[var(--text-muted)] uppercase tracking-wider">
                          {r.year ?? '—'} · {r.media_type === 'movie' ? 'Film' : 'Television'}
                        </p>
                      </div>
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)]">
                        + Add
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {query.length < 2 && (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              Type at least 2 characters to search filmography.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

