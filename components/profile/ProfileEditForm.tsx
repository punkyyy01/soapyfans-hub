'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { saveProfile, addFavorite, removeFavorite, reorderFavorites } from '@/app/(main)/profile/edit/actions'
import type { SaveProfileState } from '@/app/(main)/profile/edit/actions'
import type { EnrichedFavorite } from '@/app/(main)/profile/edit/page'
import { sanitizeCSS } from '@/utils/sanitize-css'
import { getTmdbImageUrl } from '@/utils/tmdb'

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

// ─── Constants & Styles ───────────────────────────────────────────────────────

const INPUT_CLS =
  'mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent-amber)]/70 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40'

const LABEL_CLS =
  'block text-[0.68rem] uppercase tracking-[0.28em] text-[var(--text-secondary)]'

const FALLBACK_ACCENT = '#e8890c'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileEditForm({ profile, initialFavorites }: Props) {
  // Identity
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [username, setUsername]       = useState(profile.username ?? '')
  const [pronouns, setPronouns]       = useState(profile.pronouns ?? '')
  const [bio, setBio]                 = useState(profile.bio ?? '')
  const [locationText, setLocation]   = useState(profile.location_text ?? '')
  const [websiteUrl, setWebsite]      = useState(profile.website_url ?? '')

  // Appearance
  const [accentColor, setAccentColor] = useState(profile.accent_color ?? FALLBACK_ACCENT)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Custom CSS
  const [profileCss, setProfileCss]     = useState(profile.profile_css ?? '')
  const [showPreview, setShowPreview]   = useState(false)

  // Privacy
  const [showActivity, setShowActivity] = useState(profile.show_activity)

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Favorites
  const [favorites, setFavorites]         = useState<EnrichedFavorite[]>(initialFavorites)
  const [showSearch, setShowSearch]       = useState(false)
  const [dragIndex, setDragIndex]         = useState<number | null>(null)
  const [dragOver, setDragOver]           = useState<number | null>(null)

  // Save action state
  const initState: SaveProfileState = { error: null, success: false, username: null }
  const [saveState, formAction, isPending] = useActionState(saveProfile, initState)

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
  }, [])

  // File change handlers
  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function onBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
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

  return (
    <>
      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border px-6 py-3 text-xs uppercase tracking-[0.24em] font-medium shadow-2xl backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'border-[var(--accent-forest)] bg-[var(--bg-elevated)]/95 text-emerald-300 shadow-[0_8px_32px_rgba(42,92,63,0.35)]'
              : 'border-red-800/80 bg-[var(--bg-elevated)]/95 text-red-300 shadow-[0_8px_32px_rgba(153,27,27,0.35)]'
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
      <div className="mb-14 border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]">
              Personal Archive · Atelier
            </p>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-semibold leading-[0.98] tracking-tight text-[var(--text-primary)]">
              Edit <span className="italic text-[var(--accent-gold)]">Profile</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
              Curate your public presence, customize your visual identity, and manage your Sophie Thatcher favorites.
            </p>
          </div>

          <Link
            href={`/profile/${profileSlug}`}
            className="group inline-flex items-center gap-2 self-start rounded-full border border-[var(--border-strong)] px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)] sm:self-end"
          >
            <span>View profile</span>
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </div>

      {/* ── Form Body ────────────────────────────────────────────────────── */}
      <form action={formAction} className="space-y-14">
        {/* Hidden controlled fields */}
        <input type="hidden" name="accent_color" value={accentColor} />
        <input type="hidden" name="profile_css"  value={profileCss} />
        <input type="hidden" name="show_activity" value={showActivity ? 'true' : 'false'} />

        {/* ── SECTION 01: IDENTITY ── */}
        <section className="space-y-6">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[var(--accent-amber)]">
                01 · Identity
              </p>
              <span className="text-[0.62rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                Public details
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              The Curator
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Your name, handle, bio, and external links displayed across the archive.
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
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-xs text-[var(--text-muted)]">
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
                  className={`${INPUT_CLS} mt-0 pl-8 font-mono text-sm`}
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

          <div>
            <div className="flex items-center justify-between">
              <label className={LABEL_CLS} htmlFor="bio">
                Biography
              </label>
              <span className={`text-[0.65rem] tabular-nums ${bio.length > 270 ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)]'}`}>
                {bio.length} / 300
              </span>
            </div>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words on your favorite Sophie Thatcher roles, musical releases, or reflections on the archive…"
              className={`${INPUT_CLS} resize-none leading-relaxed`}
            />
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
            <p className="mt-1.5 text-[0.65rem] text-[var(--text-muted)]">
              Must start with https:// (Instagram, Letterboxd, personal site, etc.)
            </p>
          </div>
        </section>

        {/* ── SECTION 02: APPEARANCE ── */}
        <section className="space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[var(--accent-amber)]">
                02 · Appearance
              </p>
              <span className="text-[0.62rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                Visual identity
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Visual Canvas
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Your portrait avatar, profile banner, and signature accent hue.
            </p>
          </div>

          {/* Avatar & Banner Row */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Avatar block */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-6 md:col-span-5 flex flex-col justify-between space-y-4">
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
                          className="flex h-full w-full items-center justify-center rounded-full text-2xl font-semibold text-[var(--bg-base)]"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)`,
                          }}
                        >
                          {(displayName || username || '?')[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
                    >
                      Upload portrait
                    </button>
                    <p className="text-[0.62rem] text-[var(--text-muted)] leading-tight">
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

            {/* Banner block */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-6 md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLS}>Header Banner</label>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="rounded-full border border-[var(--border-strong)] px-4 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
                  >
                    Upload banner
                  </button>
                </div>

                <div
                  className="relative z-0 mt-3.5 h-24 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)]"
                  style={
                    !bannerPreview
                      ? {
                          background: `linear-gradient(135deg, ${accentColor}2a 0%, ${accentColor}0f 55%, transparent 100%)`,
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
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-base)]/60"
                  />
                </div>
                <p className="mt-2 text-[0.62rem] text-[var(--text-muted)]">
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
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-6">
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
                    className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--accent-gold)]"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 03: SOPHIE PICKS ── */}
        <section className="space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex items-baseline gap-3">
                <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[var(--accent-amber)]">
                  03 · Curation
                </p>
                <span className="text-[0.65rem] tabular-nums text-[var(--text-muted)] uppercase tracking-wider">
                  {favorites.length} / 6 selected
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Sophie Picks
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Feature up to 6 of your favorite Sophie Thatcher films or series. Drag cards to reorder your top picks.
              </p>
            </div>

            <button
              type="button"
              disabled={favorites.length >= 6}
              onClick={() => setShowSearch(true)}
              className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--accent-amber)]/60 bg-[var(--accent-amber)]/10 px-5 py-2 text-xs uppercase tracking-[0.18em] text-[var(--accent-gold)] transition-all hover:bg-[var(--accent-amber)]/20 hover:border-[var(--accent-amber)] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
            >
              <span>+ Add title</span>
            </button>
          </div>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/20 py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">No favorites curated yet</p>
              <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
                Select your top Sophie Thatcher performances from Prospect, Yellowjackets, Heretic, Companion, and more.
              </p>
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="mt-4 rounded-full border border-[var(--border-strong)] px-5 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
              >
                Browse &amp; Add Favorites
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
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
                        ? 'scale-95 opacity-50 border-[var(--accent-amber)]/60'
                        : isOver
                          ? 'scale-[1.03] border-[var(--accent-amber)] shadow-[0_0_20px_rgba(232,137,12,0.4)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--accent-amber)]/50'
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
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)]">
                        {fav.title ?? '?'}
                      </div>
                    )}

                    {/* Rank pill */}
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[0.55rem] text-white/80 backdrop-blur-xs">
                      #{index + 1}
                    </div>

                    {/* Media type badge */}
                    {fav.media_type === 'tv' && (
                      <div className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-[0.5rem] uppercase tracking-wider text-white/70 backdrop-blur-xs">
                        TV
                      </div>
                    )}

                    {/* Remove button overlay */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white/80 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-900/90 hover:text-white"
                      aria-label={`Remove ${fav.title}`}
                    >
                      ×
                    </button>
                  </div>
                )
              })}

              {/* Empty placeholder slot if < 6 */}
              {favorites.length < 6 && (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="group flex aspect-[2/3] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/15 p-3 text-center transition-all hover:border-[var(--accent-amber)]/50 hover:bg-[var(--accent-amber)]/5"
                >
                  <span className="text-xl text-[var(--text-muted)] transition-transform group-hover:scale-125 group-hover:text-[var(--accent-amber)]">
                    +
                  </span>
                  <span className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                    Add slot
                  </span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── SECTION 04: PRIVACY ── */}
        <section className="space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[var(--accent-amber)]">
                04 · Visibility
              </p>
              <span className="text-[0.62rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                Privacy
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Archive Activity
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Control the visibility of your film and music reviews on your public profile.
            </p>
          </div>

          <div className="flex items-start justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-6">
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
              className={`relative mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
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
        <section className="space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-[var(--accent-amber)]">
                05 · Advanced
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Custom Canvas CSS
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Write custom CSS declarations scoped directly to your profile canvas container.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)]"
            >
              Preview canvas ↗
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/20 p-5 space-y-3">
            <div className="flex items-center justify-between text-[0.68rem] text-[var(--text-muted)]">
              <span>Scoped declarations: <code className="text-[var(--accent-amber)]">.profile-canvas &#123; ... &#125;</code></span>
              <span className={`tabular-nums ${cssCharCount > 1900 ? 'text-red-400 font-medium' : ''}`}>
                {cssCharCount.toLocaleString()} / 2,000
              </span>
            </div>

            <textarea
              name="profile_css_display"
              rows={6}
              value={profileCss}
              onChange={(e) => setProfileCss(e.target.value)}
              maxLength={2000}
              spellCheck={false}
              placeholder={`/* Example custom declarations */
/* background: #0e0d08; */
/* color: #f5f0e8; */`}
              className={`${INPUT_CLS} mt-0 font-mono text-xs leading-relaxed resize-y`}
            />

            <p className="text-[0.62rem] text-[var(--text-muted)] leading-relaxed">
              Rules are automatically sanitized. External fonts, @import rules, fixed/sticky positioning exploits, and javascript: protocols are disallowed.
            </p>
          </div>
        </section>

        {/* ── ACTION BAR: SAVE / CANCEL ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-subtle)] pt-8">
          <p className="text-xs text-[var(--text-muted)]">
            Changes will apply immediately across your public profile.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={`/profile/${profileSlug}`}
              className="rounded-full border border-transparent px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-amber)] px-8 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_28px_rgba(255,183,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {isPending ? 'Saving atelier…' : 'Save Changes'}
              {!isPending && <span aria-hidden="true">→</span>}
            </button>
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
  avatarUrl: string | null
  bannerUrl: string | null
  accentColor: string
  css: string
  onClose: () => void
}) {
  const sanitized = sanitizeCSS(css)
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[var(--bg-base)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="text-[0.68rem] uppercase tracking-[0.4em] text-[var(--accent-amber)]">
            Live Canvas Preview
          </span>
          {!sanitized && css.trim() && (
            <span className="text-xs text-red-400">
              CSS blocked — contains disallowed rules
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-[var(--border-strong)] px-5 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--text-primary)]"
        >
          Close preview
        </button>
      </div>

      {/* Scoped Custom CSS */}
      {sanitized && <style>{`#profile-canvas-preview { ${sanitized} }`}</style>}

      {/* Preview Canvas using 4-Layer Architecture */}
      <div id="profile-canvas-preview" className="profile-canvas">
        {/* Layer 1 & 2: Banner & Overlay */}
        <div
          className="relative z-0 h-[170px] w-full overflow-hidden sm:h-[230px]"
          style={
            !bannerUrl
              ? {
                  background: `linear-gradient(135deg, ${accentColor}2a 0%, ${accentColor}0f 55%, transparent 100%)`,
                }
              : undefined
          }
        >
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt="Banner preview"
              fill
              sizes="100vw"
              className="object-cover object-center"
              unoptimized={bannerUrl.startsWith('blob:')}
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-base)]/60"
          />
        </div>

        {/* Layer 3: Profile Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24 sm:px-10">
          <div className="relative z-20 -mt-10 flex flex-wrap items-end gap-4 sm:-mt-12">
            {/* Layer 4: Independent Avatar */}
            <div
              className="relative shrink-0 rounded-full isolate"
              style={{
                padding: '4px',
                background: accentColor,
                boxShadow: '0 0 0 4px var(--bg-base)',
              }}
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--bg-base)]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover object-center rounded-full"
                    unoptimized={avatarUrl.startsWith('blob:')}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center rounded-full text-3xl font-semibold text-[var(--bg-base)]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)`,
                    }}
                  >
                    {initial}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                {displayName || 'Your Name'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {username && (
                  <span className="text-sm text-[var(--text-muted)]">@{username}</span>
                )}
                {pronouns && (
                  <>
                    <span className="text-[var(--border-strong)]" aria-hidden="true">·</span>
                    <span className="text-xs italic text-[var(--text-muted)]">{pronouns}</span>
                  </>
                )}
              </div>
            </div>

            {bio && (
              <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] text-pretty">
                {bio}
              </p>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 pt-20 sm:pt-28 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <p className="text-[0.68rem] uppercase tracking-[0.35em] text-[var(--accent-amber)] font-medium">
            Add to Sophie Picks
          </p>
          <button
            onClick={onClose}
            className="text-lg text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Close"
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
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)] focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto px-6 py-4">
          {isSearching && (
            <p className="py-6 text-center text-xs text-[var(--text-muted)] uppercase tracking-widest">
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
                      className="flex w-full items-center gap-3.5 rounded-xl p-2.5 text-left transition-colors hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
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
                          <div className="flex h-full w-full items-center justify-center text-[0.6rem] text-[var(--text-muted)]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {r.title}
                        </p>
                        <p className="text-[0.68rem] text-[var(--text-muted)] uppercase tracking-wider">
                          {r.year ?? '—'} · {r.media_type === 'movie' ? 'Film' : 'Television'}
                        </p>
                      </div>
                      <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)]">
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
