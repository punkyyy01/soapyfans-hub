import Image from 'next/image'
import type { EnrichedFavorite } from '@/app/(main)/profile/edit/page'
import { getTmdbImageUrl } from '@/utils/tmdb'
import Button from '@/components/ui/Button'

export default function SophiePicksSection({
  favorites,
  dragIndex,
  dragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onRemove,
  onOpenSearch,
}: {
  favorites: EnrichedFavorite[]
  dragIndex: number | null
  dragOver: number | null
  onDragStart: (index: number) => void
  onDragEnd: () => void
  onDragOver: (index: number) => void
  onDrop: (targetIndex: number) => void
  onRemove: (id: string) => void
  onOpenSearch: () => void
}) {
  return (
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
          onClick={onOpenSearch}
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
              onClick={onOpenSearch}
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
                  onDragOver(index)
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
                  onClick={() => onRemove(fav.id)}
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
              onClick={onOpenSearch}
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
  )
}
