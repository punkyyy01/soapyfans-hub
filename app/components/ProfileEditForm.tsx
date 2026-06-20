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

// ─── Shared styles ───────────────────────────────────────────────────────────

const INPUT_CLS =
  'mt-1.5 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40'
const LABEL_CLS = 'block text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-secondary)]'
const SECTION_CLS = 'rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 p-6 space-y-5'
const FALLBACK_ACCENT = '#e8890c'

// ─── Main component ───────────────────────────────────────────────────────────

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

  // CSS
  const [profileCss, setProfileCss]     = useState(profile.profile_css ?? '')
  const [showPreview, setShowPreview]   = useState(false)

  // Privacy
  const [showActivity, setShowActivity] = useState(profile.show_activity)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Favorites
  const [favorites, setFavorites]         = useState<EnrichedFavorite[]>(initialFavorites)
  const [showSearch, setShowSearch]       = useState(false)
  const [dragIndex, setDragIndex]         = useState<number | null>(null)
  const [dragOver, setDragOver]           = useState<number | null>(null)

  // Save action
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
    if (isInitial.current) { isInitial.current = false; return }
    if (saveState.success) {
      setToast({ type: 'success', msg: 'Profile saved!' })
    } else if (saveState.error) {
      setToast({ type: 'error', msg: saveState.error })
    }
  }, [saveState])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
      if (bannerPreview?.startsWith('blob:')) URL.revokeObjectURL(bannerPreview)
    }
  }, [])

  // File handlers
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

  // Drag-and-drop favorites
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
    if (already) { setToast({ type: 'error', msg: 'Already in your favorites.' }); return }

    // Optimistic add
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
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-xl transition-all ${
            toast.type === 'success'
              ? 'bg-[var(--accent-forest)] text-white'
              : 'bg-red-900/90 text-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* CSS Preview Overlay */}
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

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          onAdd={handleAddFavorite}
          onClose={() => setShowSearch(false)}
          disabled={favorites.length >= 6}
        />
      )}

      {/* Page header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
            Settings
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Edit Profile
          </h1>
        </div>
        <Link
          href={`/profile/${profileSlug}`}
          className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-gold)]"
        >
          View profile ↗
        </Link>
      </div>

      {/* ── Main form ────────────────────────────────────────────────────── */}
      <form action={formAction} className="space-y-6">
        {/* Hidden controlled fields */}
        <input type="hidden" name="accent_color" value={accentColor} />
        <input type="hidden" name="profile_css"  value={profileCss} />
        <input type="hidden" name="show_activity" value={showActivity ? 'true' : 'false'} />

        {/* ── Identidad ── */}
        <section className={SECTION_CLS}>
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Identity
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS} htmlFor="display_name">Display name</label>
              <input
                id="display_name" name="display_name" type="text"
                maxLength={50} value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="username">Username</label>
              <input
                id="username" name="username" type="text"
                maxLength={30} value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS} htmlFor="pronouns">Pronouns</label>
              <input
                id="pronouns" name="pronouns" type="text"
                maxLength={30} value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="they/them, she/her, etc."
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS} htmlFor="location_text">Location</label>
              <input
                id="location_text" name="location_text" type="text"
                maxLength={60} value={locationText}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Somewhere, Earth"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS} htmlFor="bio">Bio</label>
            <textarea
              id="bio" name="bio" rows={3} maxLength={300}
              value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about yourself…"
              className={`${INPUT_CLS} resize-none`}
            />
            <p className="mt-1 text-right text-[0.65rem] text-[var(--text-muted)]">
              {bio.length}/300
            </p>
          </div>

          <div>
            <label className={LABEL_CLS} htmlFor="website_url">Website</label>
            <input
              id="website_url" name="website_url" type="url"
              value={websiteUrl} onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              className={INPUT_CLS}
            />
          </div>
        </section>

        {/* ── Apariencia ── */}
        <section className={SECTION_CLS}>
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Appearance
          </h2>

          {/* Avatar */}
          <div>
            <label className={LABEL_CLS}>Avatar</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="shrink-0">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                    unoptimized={avatarPreview.startsWith('blob:')}
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-[var(--bg-base)]"
                    style={{ background: accentColor }}
                  >
                    {(displayName || username || '?')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)]/60 hover:text-[var(--text-primary)]"
                >
                  Change avatar
                </button>
                <p className="text-[0.65rem] text-[var(--text-muted)]">
                  JPEG, PNG, WebP or GIF · max 2 MB
                </p>
              </div>
              <input
                ref={avatarInputRef} type="file" name="avatar"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only" onChange={onAvatarChange}
              />
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className={LABEL_CLS}>Banner</label>
            <div className="mt-2 space-y-3">
              {/* Preview */}
              <div
                className="relative h-24 w-full overflow-hidden rounded-lg border border-[var(--border-subtle)]"
                style={
                  !bannerPreview
                    ? { background: `linear-gradient(135deg, ${accentColor}2a 0%, transparent 100%)` }
                    : undefined
                }
              >
                {bannerPreview && (
                  <Image
                    src={bannerPreview}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                    unoptimized={bannerPreview.startsWith('blob:')}
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)]/60 hover:text-[var(--text-primary)]"
                >
                  Change banner
                </button>
                <p className="text-[0.65rem] text-[var(--text-muted)]">
                  JPEG, PNG, WebP or GIF · max 3 MB
                </p>
              </div>
              <input
                ref={bannerInputRef} type="file" name="banner"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only" onChange={onBannerChange}
              />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className={LABEL_CLS} htmlFor="accent_color_picker">Accent color</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="accent_color_picker"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-md border border-[var(--border-subtle)] bg-transparent p-0.5"
              />
              <span className="font-mono text-sm text-[var(--text-secondary)]">{accentColor}</span>
              <button
                type="button"
                onClick={() => setAccentColor(FALLBACK_ACCENT)}
                className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-gold)]"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* ── CSS personalizado ── */}
        <section className={SECTION_CLS}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Custom CSS
            </h2>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="rounded-full border border-[var(--accent-amber)]/40 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.22em] text-[var(--accent-amber)] transition-all hover:bg-[var(--accent-amber)]/10"
            >
              Preview
            </button>
          </div>

          <div className="relative">
            <textarea
              name="profile_css_display"
              rows={8}
              value={profileCss}
              onChange={(e) => setProfileCss(e.target.value)}
              maxLength={5000}
              spellCheck={false}
              placeholder={`/* Personaliza tu perfil con CSS */
/* Ejemplo: cambiar fondo */
/* background: #1a0a2e; */
/* No se permite: @import, position: fixed, javascript: */`}
              className={`${INPUT_CLS} font-mono text-xs leading-relaxed resize-y`}
            />
            <p
              className={`mt-1 text-right text-[0.65rem] ${
                cssCharCount > 4800
                  ? 'text-red-400'
                  : cssCharCount > 4000
                    ? 'text-[var(--accent-amber)]'
                    : 'text-[var(--text-muted)]'
              }`}
            >
              {cssCharCount.toLocaleString()} / 5,000
            </p>
          </div>
        </section>

        {/* ── Privacidad ── */}
        <section className={SECTION_CLS}>
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Privacy
          </h2>

          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm text-[var(--text-primary)]">Show activity on profile</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Your recent film and music reviews will appear publicly on your profile.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showActivity}
              onClick={() => setShowActivity((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                showActivity ? 'bg-[var(--accent-amber)]' : 'bg-[var(--bg-elevated)]'
              } border border-[var(--border-strong)]`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  showActivity ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ── Save button ── */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link
            href={`/profile/${profileSlug}`}
            className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-amber)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.22em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_24px_rgba(255,183,0,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {isPending ? 'Saving…' : 'Save changes'}
            {!isPending && <span aria-hidden>→</span>}
          </button>
        </div>
      </form>

      {/* ── Sophie Picks ─────────────────────────────────────────────────── */}
      <section className="mt-10 space-y-6">
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-10">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--accent-amber)]">
              Sophie Picks
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Your Favorites
            </h2>
          </div>
          <button
            type="button"
            disabled={favorites.length >= 6}
            onClick={() => setShowSearch(true)}
            className="rounded-full border border-[var(--accent-amber)]/50 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--accent-amber)] transition-all hover:bg-[var(--accent-amber)]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Drag to reorder · max 6 · only Sophie Thatcher titles
        </p>

        {favorites.length === 0 ? (
          <p className="text-sm italic text-[var(--text-muted)]">
            No favorites yet. Add up to 6 Sophie Thatcher films or shows.
          </p>
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
                  onDragOver={(e) => { e.preventDefault(); setDragOver(index) }}
                  onDrop={() => onDrop(index)}
                  className={`group relative aspect-[2/3] cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing ${
                    isDragging
                      ? 'scale-95 opacity-50 border-[var(--accent-amber)]/60'
                      : isOver
                        ? 'border-[var(--accent-amber)] scale-[1.02] shadow-[0_0_16px_rgba(232,137,12,0.4)]'
                        : 'border-[var(--border-subtle)]'
                  }`}
                >
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={fav.title ?? ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 15vw"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)]">
                      {fav.title ?? '?'}
                    </div>
                  )}

                  {/* Media type badge */}
                  {fav.media_type === 'tv' && (
                    <div className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[0.5rem] uppercase tracking-wider text-white/70">
                      TV
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(fav.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-900/80 hover:text-white"
                    aria-label={`Remove ${fav.title}`}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

// ─── CSS Preview Panel ────────────────────────────────────────────────────────

function CssPreviewPanel({
  displayName, username, pronouns, bio,
  avatarUrl, bannerUrl, accentColor, css, onClose,
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
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--accent-amber)]">
            CSS Preview
          </span>
          {!sanitized && css.trim() && (
            <span className="text-[0.65rem] text-red-400">
              CSS blocked — contains disallowed properties
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)]/60 hover:text-[var(--text-primary)]"
        >
          Close
        </button>
      </div>

      {/* Scoped style — updates live as css state changes */}
      {sanitized && <style>{`#profile-canvas-preview { ${sanitized} }`}</style>}

      {/* Preview canvas */}
      <div id="profile-canvas-preview" className="profile-canvas">
        {/* Banner */}
        <div
          className="relative h-[140px] w-full overflow-hidden sm:h-[200px]"
          style={
            !bannerUrl
              ? { background: `linear-gradient(135deg, ${accentColor}2a 0%, transparent 100%)` }
              : undefined
          }
        >
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized={bannerUrl.startsWith('blob:')}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-base)]/60" />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-6 pb-16 sm:px-10">
          <div className="-mt-12 flex flex-wrap items-end gap-4 sm:-mt-16">
            <div
              className="shrink-0 rounded-full"
              style={{
                padding: '3px',
                background: accentColor,
                boxShadow: `0 0 0 3px var(--bg-base)`,
              }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="rounded-full"
                  unoptimized={avatarUrl.startsWith('blob:')}
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-[var(--bg-base)]"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)` }}
                >
                  {initial}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {displayName || 'Your name'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {username && (
                <span className="text-sm text-[var(--text-muted)]">@{username}</span>
              )}
              {pronouns && (
                <>
                  <span className="text-[var(--border-strong)]" aria-hidden>·</span>
                  <span className="text-xs italic text-[var(--text-muted)]">{pronouns}</span>
                </>
              )}
            </div>
            {bio && (
              <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">{bio}</p>
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

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/tmdb-search?q=${encodeURIComponent(q.trim())}`)
      const { results: data } = await res.json() as { results: SearchResult[] }
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => search(query), 350)
    return () => clearTimeout(t)
  }, [query, search])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-20 sm:pt-32">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--accent-amber)]">
            Add to Sophie Picks
          </p>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-4">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Sophie Thatcher films & shows…"
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)]/60 focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-5 pb-5">
          {isSearching && (
            <p className="py-4 text-center text-xs text-[var(--text-muted)]">Searching…</p>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <p className="py-4 text-center text-xs text-[var(--text-muted)]">No results found.</p>
          )}

          {!isSearching && results.length > 0 && (
            <ul className="space-y-1">
              {results.map((r) => {
                const posterUrl = r.poster_url

                return (
                  <li key={`${r.tmdb_id}-${r.media_type}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(r)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="shrink-0">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={r.title}
                            width={36}
                            height={54}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-[54px] w-9 items-center justify-center rounded bg-[var(--bg-base)] text-[0.55rem] text-[var(--text-muted)]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {r.title}
                        </p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">
                          {r.year ?? '—'} · {r.media_type === 'movie' ? 'Film' : 'TV'}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {query.length < 2 && (
            <p className="py-4 text-center text-xs text-[var(--text-muted)]">
              Type at least 2 characters to search.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
