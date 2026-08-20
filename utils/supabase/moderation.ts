import { cache } from 'react'
import { createAdminClient } from './admin'

/**
 * All currently-banned user ids, as a Set for O(1) membership checks. One
 * query per request regardless of how many reviews/profiles need checking
 * against it -- callers must not loop this per-row.
 *
 * Uses the service-role client because `banned_users` RLS only allows a
 * user to read their own ban record (see 20260818194726_security_hardening.sql
 * item 5) -- there is no public policy that would let an anon/authenticated
 * client see who *else* is banned, by design. This never returns ban reason
 * or moderator identity to callers, only the id set.
 */
export const getBannedUserIds = cache(async (): Promise<Set<string>> => {
  const { data } = await createAdminClient().from('banned_users').select('user_id')
  return new Set((data ?? []).map((row) => row.user_id))
})
