'use client'

import { useActionState, useRef, useState } from 'react'
import { updateProfile } from '@/app/(auth)/actions'
import type { ProfileUpdateState } from '@/app/(auth)/actions'

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

const INPUT_CLS =
  'mt-2 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-amber)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-amber)]/40'

const LABEL_CLS = 'block text-[0.65rem] uppercase tracking-[0.32em] text-[var(--text-secondary)]'

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<ProfileUpdateState, FormData>(
    updateProfile,
    { error: null },
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const avatarInitial =
    (profile.display_name ?? profile.username ?? '')[0]?.toUpperCase() ?? '?'

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setFileError('Must be JPEG, PNG, WebP, or GIF.')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('Must be under 2 MB.')
      e.target.value = ''
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleDiscard() {
    setPreviewUrl(profile.avatar_url)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-[var(--border-strong)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)] hover:text-[var(--accent-gold)] sm:w-auto sm:py-1.5"
      >
        Edit profile
      </button>
    )
  }

  return (
    <form
      action={formAction}
      className="w-full space-y-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-4 backdrop-blur sm:p-6"
    >
      <input type="hidden" name="profile_id" value={profile.id} />

      <p className="text-[0.65rem] uppercase tracking-[0.32em] text-[var(--accent-amber)]">
        Edit profile
      </p>

      {(state.error || fileError) && (
        <p className="rounded-md border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {state.error ?? fileError}
        </p>
      )}

      <div>
        <p className={LABEL_CLS}>Avatar</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <button
            type="button"
            aria-label="Change avatar"
            onClick={() => fileRef.current?.click()}
            className="group relative shrink-0 overflow-hidden rounded-full"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--accent-amber)]/30"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent-amber)]/40 bg-gradient-to-br from-[var(--accent-amber)] to-[#7a4108] text-xl font-semibold text-[var(--bg-base)]">
                {avatarInitial}
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--bg-base)]/70 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-[var(--text-primary)]">
                Change
              </span>
            </span>
          </button>
          <p className="text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
            Click to upload
            <br />
            JPEG, PNG, WebP or GIF · max 2 MB
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="sr-only"
        />
      </div>

      <div>
        <label className={LABEL_CLS}>Display name</label>
        <input
          name="display_name"
          defaultValue={profile.display_name ?? ''}
          maxLength={80}
          placeholder="Your name"
          className={INPUT_CLS}
        />
      </div>

      <div>
        <label className={LABEL_CLS}>
          Username <span className="text-red-400">*</span>
        </label>
        <input
          name="username"
          defaultValue={profile.username ?? ''}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          className={INPUT_CLS}
        />
        <p className="mt-1 text-[0.62rem] text-[var(--text-muted)]">
          3–30 chars · letters, numbers, underscore
        </p>
      </div>

      <div>
        <label className={LABEL_CLS}>Bio</label>
        <textarea
          name="bio"
          defaultValue={profile.bio ?? ''}
          maxLength={500}
          rows={3}
          placeholder="A few words about you…"
          className={`${INPUT_CLS} resize-none`}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={handleDiscard}
          disabled={isPending}
          className="rounded-full border border-[var(--border-strong)] px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[var(--accent-amber)]/60 hover:text-[var(--text-primary)] disabled:opacity-40"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="group inline-flex items-center gap-3 rounded-full bg-[var(--accent-amber)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.22em] text-[var(--bg-base)] transition-all hover:bg-[var(--accent-gold)] hover:shadow-[0_0_28px_rgba(255,183,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {isPending ? 'Saving…' : 'Save changes'}
          {!isPending && (
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          )}
        </button>
      </div>
    </form>
  )
}
