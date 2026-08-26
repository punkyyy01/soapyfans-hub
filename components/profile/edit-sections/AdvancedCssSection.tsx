import Button from '@/components/ui/Button'
import { INPUT_CLS } from '../editFormStyles'

export default function AdvancedCssSection({
  profileCss,
  setProfileCss,
  onPreview,
}: {
  profileCss: string
  setProfileCss: (v: string) => void
  onPreview: () => void
}) {
  const cssCharCount = profileCss.length

  return (
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
          onClick={onPreview}
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
  )
}
