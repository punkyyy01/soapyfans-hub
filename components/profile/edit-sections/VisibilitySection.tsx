export default function VisibilitySection({
  showActivity,
  setShowActivity,
}: {
  showActivity: boolean
  setShowActivity: (v: boolean | ((prev: boolean) => boolean)) => void
}) {
  return (
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
  )
}
