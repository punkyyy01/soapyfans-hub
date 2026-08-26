import type { RefObject } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { LABEL_CLS } from '../editFormStyles'

const ACCENT_PRESETS = ['#e8890c', '#ffb700', '#2e6646', '#c53b3b', '#c4b9a7']

export default function AppearanceSection({
  displayName,
  username,
  accentColor,
  setAccentColor,
  fallbackAccent,
  avatarPreview,
  bannerPreview,
  avatarInputRef,
  bannerInputRef,
  onAvatarChange,
  onBannerChange,
}: {
  displayName: string
  username: string
  accentColor: string
  setAccentColor: (v: string) => void
  fallbackAccent: string
  avatarPreview: string | null
  bannerPreview: string | null
  avatarInputRef: RefObject<HTMLInputElement | null>
  bannerInputRef: RefObject<HTMLInputElement | null>
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
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

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center gap-1.5" role="group" aria-label="Preset accent colors">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAccentColor(preset)}
                  aria-label={`Use preset color ${preset}`}
                  aria-pressed={accentColor.toLowerCase() === preset.toLowerCase()}
                  className={`h-6 w-6 shrink-0 rounded-full border transition-transform focus-ring cursor-pointer ${
                    accentColor.toLowerCase() === preset.toLowerCase()
                      ? 'border-[var(--text-primary)] scale-110'
                      : 'border-black/30 hover:scale-105'
                  }`}
                  style={{ background: preset }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
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
                    aria-label="Choose a custom profile accent color"
                  />
                </div>
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]">
                  {accentColor}
                </span>
              </div>

              {accentColor.toLowerCase() !== fallbackAccent.toLowerCase() && (
                <button
                  type="button"
                  onClick={() => setAccentColor(fallbackAccent)}
                  className="rounded-full border border-[var(--border-subtle)] px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer focus-ring"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
