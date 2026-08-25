import { toggleFollow } from '@/app/(main)/social-actions'
import Button from '@/components/ui/Button'

interface Props {
  targetUserId: string
  profileSlug: string
  isFollowing: boolean
  isSignedIn: boolean
}

// Same shape as WatchlistButton: the follow state is known at render time
// from the profile page's own data fetch, so this just picks which form to
// render -- no client state, no useOptimistic.
export default function FollowButton({ targetUserId, profileSlug, isFollowing, isSignedIn }: Props) {
  if (!isSignedIn) {
    return (
      <Button href="/login" variant="secondary" size="sm">
        Sign in to follow
      </Button>
    )
  }

  return (
    <form action={toggleFollow}>
      <input type="hidden" name="target_user_id" value={targetUserId} />
      <input type="hidden" name="profile_slug" value={profileSlug} />
      <Button type="submit" variant={isFollowing ? 'secondary' : 'primary'} size="sm">
        {isFollowing ? 'Following' : '+ Follow'}
      </Button>
    </form>
  )
}
