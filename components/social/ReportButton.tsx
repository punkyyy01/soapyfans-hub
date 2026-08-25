'use client'

import { useState } from 'react'
import { submitReport } from '@/app/(main)/social-actions'

interface Props {
  targetType: 'review' | 'music_review' | 'review_reply' | 'news_item'
  targetId: string
  redirectTo: string
}

// The one control in the social layer that genuinely needs local state:
// the reason field only makes sense revealed after an explicit click, so
// this can't be the plain "one form, no JS" pattern the toggle buttons use.
export default function ReportButton({ targetType, targetId, redirectTo }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[0.68rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-red-400 cursor-pointer focus-ring"
      >
        Report
      </button>
    )
  }

  return (
    <form
      action={submitReport}
      className="mt-2 w-full space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3"
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <textarea
        name="reason"
        required
        maxLength={500}
        rows={2}
        placeholder="Why are you reporting this?"
        className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] p-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
      />
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-[0.6rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-red-300 transition-colors hover:bg-red-900/60 cursor-pointer focus-ring"
        >
          Submit report
        </button>
      </div>
    </form>
  )
}
