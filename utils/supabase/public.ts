import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Cookie-free client for public, non-personalized reads (e.g. music releases).
 * Safe to call inside `unstable_cache` — the cookie-bound client in
 * `server.ts` calls `cookies()` internally, which Next.js disallows there.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}
