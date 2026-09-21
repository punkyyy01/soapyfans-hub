'use server'

import { createClient } from '@/utils/supabase/server'

type ContentKind = 'news' | 'releases'

// Called directly from a client component effect (not a <form action>) --
// this only records a per-user timestamp, there's no redirect/result the
// caller needs beyond "did this actually write" (see MarkContentSeen).
// Kept out of the /news and /music page components themselves so those
// pages can stay ISR-cached (export const revalidate) instead of becoming
// per-request dynamic just to read cookies for this.
export async function markContentSeen(kind: ContentKind): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const now = new Date().toISOString()
  const patch = kind === 'news' ? { news_seen_at: now } : { releases_seen_at: now }

  const { data: updated } = await supabase
    .from('content_seen')
    .update(patch)
    .eq('user_id', user.id)
    .select('user_id')

  if (!updated || updated.length === 0) {
    // No row yet for this user -- insert one. Never upsert here: an upsert
    // payload with only one column would reset the *other* seen column to
    // null on conflict (Postgrest upserts via INSERT ... ON CONFLICT DO
    // UPDATE SET <every column in the payload>, and an omitted column falls
    // back to its default/null on the INSERT side that feeds `excluded`).
    await supabase.from('content_seen').insert({ user_id: user.id, ...patch })
  }

  return true
}
