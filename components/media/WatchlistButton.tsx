import { addToWatchlist, removeFromWatchlist } from '@/app/(auth)/actions'
import type { WatchlistMediaType } from '@/utils/watchlist'
import Button from '@/components/ui/Button'

interface Props {
  tmdbId: number
  mediaType: WatchlistMediaType
  isOnWatchlist: boolean
  isSignedIn: boolean
}

// A server component (no client JS): whether the title is already on the
// watchlist is known at render time from the page's own data fetch, so this
// just picks which of two server-action forms to render -- same pattern as
// the Navbar logout button.
export default function WatchlistButton({ tmdbId, mediaType, isOnWatchlist, isSignedIn }: Props) {
  if (!isSignedIn) {
    return (
      <Button href="/login" variant="secondary" size="sm">
        Sign in to add to watchlist
      </Button>
    )
  }

  const action = isOnWatchlist ? removeFromWatchlist : addToWatchlist

  return (
    <form action={action}>
      <input type="hidden" name="tmdb_id" value={tmdbId} />
      <input type="hidden" name="media_type" value={mediaType} />
      <Button type="submit" variant={isOnWatchlist ? 'secondary' : 'primary'} size="sm">
        {isOnWatchlist ? '✓ On Watchlist' : '+ Add to Watchlist'}
      </Button>
    </form>
  )
}
