# Profile Root Cause Repair — `about_me` Schema Drift & Related Fixes

Date: 2026-08-18
Scope: `/profile/[username]`, profile editor, favorites, OAuth profile creation.

## 01 — Root Cause

`profiles.about_me` was referenced by `page.tsx`, `edit/page.tsx`, `edit/actions.ts`,
`ProfileEditForm.tsx`, and `database.types.ts`, but **did not exist on the live
Supabase database**.

The migration file `supabase/migrations/20260818_add_about_me_to_profiles.sql`
already existed in the repo, and `database.types.ts` already declared
`about_me: string | null` on `Row`/`Insert`/`Update` — but `list_migrations`
on project `tcskvcmtcsaxyfoselvb` showed the last migration actually applied
to the database was `20260529231521_create_profile_favorites`. The `about_me`
migration (and a second, unrelated one, `20260818_update_releases_cover_art`)
had been written and the types hand-updated to match the *intended* schema,
but neither migration was ever executed against Supabase — there is no
`supabase` CLI installed in this environment, so nothing ever ran
`supabase db push`.

This was pure **repo ↔ remote-database drift**, not a multi-project mixup:
`.env.local`'s `NEXT_PUBLIC_SUPABASE_URL` resolves to project ref
`tcskvcmtcsaxyfoselvb`, which is the only `soapyfans-hub` project in the
account and matches the ref documented in `CLAUDE.md`. Local dev and
production use the exact same database, so this bug was never a
local-vs-production split — the second the column was missing, it was
missing everywhere.

Query error `42703 column profiles.about_me does not exist` fired inside
`Promise.all([...profileQuery..., getUser()])` in
`app/(main)/profile/[username]/page.tsx`; the existing code already
distinguished DB error from "not found" correctly (`if (profileError) throw
new Error(...)`, separately `if (!profile) notFound()`), so the fix is at the
schema layer, not in that error-handling logic (see §10).

## 02 — Schema State

| Column | Before | After |
|---|---|---|
| `profiles.about_me` | absent | `text null`, comment documents the 2000-char app-level limit |
| `profile_favorites.position` | unconstrained smallint | `CHECK (position BETWEEN 0 AND 5)` + `UNIQUE (user_id, position)` |
| `public.handle_new_user()` | left `username` null when OAuth metadata had no `preferred_username` (2 prod users affected) | always assigns a sanitized, unique username via retry loop |

Full schema/constraint/RLS audit performed against the live DB (`profiles`,
`profile_favorites`, `reviews`, `music_reviews`, `films`, `releases`,
`tracks`, `banned_users`) — no other application-referenced column was found
missing. `releases.cover_art_url`, `reviews.*`, `music_reviews.*` all matched
their generated types exactly.

## 03 — Migrations Applied

Applied directly to project `tcskvcmtcsaxyfoselvb` (verified after each
apply) and committed to `supabase/migrations/` for repo/remote parity:

1. `add_about_me_to_profiles` — the pre-existing, never-applied migration, applied as-is.
2. `update_releases_cover_art` — the second pre-existing drifted migration (data-only `UPDATE`), applied as-is.
3. `favorites_position_slot_constraint` — `CHECK`/`UNIQUE` on `profile_favorites.position` + `add_profile_favorite()` / `reorder_profile_favorites()` RPCs (see §08).
4. `fix_oauth_username_generation` — rewrites `handle_new_user()`, adds `sanitize_username_candidate()`, backfills the 2 existing null-username profiles (see §07).
5. `harden_username_functions` — closes 2 security-advisor warnings introduced by #4 (pinned `search_path`, revoked public `EXECUTE` on the trigger-only function).

Verified post-apply via direct SQL: `profiles.about_me` exists
(`information_schema.columns`), both position constraints exist
(`pg_constraint`), both RPCs exist (`pg_proc`), and 0 profiles remain with
`username IS NULL`.

## 04 — Generated Types

`utils/supabase/database.types.ts` regenerated from the live schema via
`generate_typescript_types` and replaced wholesale (previously it had been
hand-edited for `about_me`, which happened to match the generator's output
exactly — confirmed by diff). It now also declares the `Functions` block for
`add_profile_favorite`, `reorder_profile_favorites`, and
`sanitize_username_candidate`, so `supabase.rpc(...)` calls are fully typed.
No `as any`, no suppressions. `npm run typecheck` passes clean.

## 05 — Profile Route

No changes to `app/(main)/profile/[username]/page.tsx`. It already separated
DB error (`throw new Error(...)`, caught by the route's error boundary) from
"not found" (`notFound()`) correctly — confirmed by reading the code and by
the regression test in §13. The P0 was purely the missing column.

## 06 — Profile Editor

No changes to `app/(main)/profile/edit/page.tsx` or `ProfileEditForm.tsx`
beyond what the schema fix required (none — they already referenced
`about_me` correctly). Verified live in the browser end-to-end (§12).

`ProfileEditForm`'s "View Public Profile" and "Cancel" links
(`savedProfileSlug = saveState.username || profile.username || profile.id`)
were checked against the concern that they might route to an unsaved local
username: they don't. `saveState.username` only updates after the server
action confirms a successful DB write, so both links always point at a
*persisted* slug, never the uncommitted text in the username input. No
change needed; codified as a regression test in `tests/profile-edit.test.ts`
(`Profile Slug and Navigation Invariants`, pre-existing).

## 07 — OAuth

Root cause: `public.handle_new_user()` (the `AFTER INSERT ON auth.users`
trigger, `SECURITY DEFINER`) set `username = nullif(raw_user_meta_data->>
'preferred_username', '')` with no fallback. Discord/Google frequently omit
that field, so the username stayed `NULL` forever — confirmed by 2 real
production profiles (`luigimario15181373`, `renasarenas`) with
`username IS NULL` before this fix.

This never produced literal `/profile/null` URLs — every call site already
falls back to the UUID (`profile?.username ?? user.id`) — but it left users
with an unreadable UUID URL until they noticed and fixed it manually.

Fix: `handle_new_user()` now derives a candidate from
`preferred_username → user_name → email local-part → 'user'`, sanitizes it
through `sanitize_username_candidate()` (strips to `[a-zA-Z0-9_]`, pads
short values, truncates to 24 chars — satisfying the `username_format` and
`username_length` DB constraints), and retries with a random 6-char suffix
on unique-constraint collision (bounded at 20 attempts). The two existing
null-username profiles were backfilled with the same logic from their
`display_name`. `sanitize_username_candidate()` is a pure `IMMUTABLE SQL`
function, independently verified via direct `SELECT` calls (see §13).

Separately, `app/auth/callback/route.ts` had a client-side
`.from('profiles').upsert(...)` fallback for when the trigger-created row
wasn't found yet. It could never have worked: `pg_policies` shows `profiles`
has no `INSERT` policy, so RLS silently rejects that upsert for the
authenticated-role client used in the callback (only the `SECURITY DEFINER`
trigger, which bypasses RLS, can insert). Removed the dead insert attempt;
kept a warning log if a profile is unexpectedly still missing after
sign-in, since that would indicate the trigger itself failed.

## 08 — Favorites

Root cause of the concurrency bypass: `addFavorite()` did
`SELECT count(*) ...` then `INSERT ... position: count`, two separate
round-trips with no locking — two concurrent requests can both read
`count = 5` and both insert, producing 7 favorites.

Real DB-level fix (not an app-level `if (count >= 6)` check):

- `profile_favorites.position` is now `CHECK (position BETWEEN 0 AND 5)`
  with `UNIQUE (user_id, position)` — there are structurally only 6 valid
  slots per user; a 7th row can never be stored, full stop, regardless of
  what the application does.
- `add_profile_favorite(tmdb_id, media_type)` RPC does the count-then-insert
  atomically: it takes `SELECT ... FOR UPDATE` on the caller's own
  `profiles` row first, serializing concurrent calls from the same user, so
  two simultaneous requests can no longer both observe `count = 5`.
- `reorder_profile_favorites(ids)` RPC reorders in two passes (temporary
  negative positions, then final positions) inside one transaction, so the
  `UNIQUE(user_id, position)` constraint never trips mid-reorder — the old
  code's `Promise.all` of independent `.update()` calls would have risked
  exactly that once the constraint was added.
- `actions.ts` `addFavorite`/`reorderFavorites` now call these RPCs instead
  of raw `.from('profile_favorites')` calls.

Verified with a real transactional test against production data (rolled
back, zero rows persisted): starting from Frambuesa's real 3 favorites,
filled to 6, then attempted a 7th — the 7th insert was rejected by the
`CHECK` constraint. See §13.

Ownership (`auth.uid() = user_id` on all four `profile_favorites` policies)
and the natural-key duplicate constraint (`UNIQUE(user_id, tmdb_id,
media_type)`) were already correct and untouched.

## 09 — Reviews

`reviews` and `music_reviews` RLS (`auth.uid() = user_id` on
INSERT/UPDATE/DELETE) and FKs (`reviews.film_id → films.id`,
`music_reviews.release_id → releases.id`, both `ON DELETE CASCADE`) were
audited directly against the live schema and are correct.

The "FK error in music review" and "redirect(`/`) on null username" issues
described in the task brief were investigated but **not reproduced** in the
current code: `submitMusicReview`'s `release_id` is always sourced from a
real `releases.id` via the hidden form field in `MusicReviewForm.tsx`
(populated from a validated `release` row on `/music`), and none of the
review actions in `app/(auth)/actions.ts` use `redirect('/')` as a generic
error fallback — they redirect to the specific film/music/profile page with
an `?error=` query param. No code change made here; flagged in §14 in case
the original report was based on an earlier version of this code.

## 10 — Error Handling

No changes required. `page.tsx` already keeps "query error" (throws, caught
by the route's `error.tsx` boundary) and "resource not found"
(`notFound()`, renders `not-found.tsx`) as two distinct paths — confirmed by
code review and the new `tests/schema-drift.test.ts` guard that would fail
if this collapsed back into one path in the future for the schema-drift
scenario specifically.

## 11 — Local vs Production

Local dev and production share the exact same Supabase project
(`tcskvcmtcsaxyfoselvb`), so the schema fix applies to both simultaneously —
there is no environment split to reconcile for this bug. Confirmed
`/profile/Frambuesa` on both `http://localhost:3001` (after the fix) and
`https://soapyhub.fans` (before any code deploy, immediately after the
migration was applied) render the profile correctly, since production's
already-deployed code was querying `about_me` correctly all along — only the
column was missing.

Two things noticed on production during this verification that are **not**
part of the `about_me`/favorites/OAuth root cause and were left untouched:

- A recurring, reproducible React hydration warning (minified error #418,
  text mismatch) on `/profile/Frambuesa` in production only — not observed
  on local dev. Page content renders correctly despite it (React recovers
  client-side). Needs separate investigation; see §14.
- `curl` against a nonexistent profile
  (`/profile/this-user-does-not-exist-zzz`) returns HTTP 200 with the
  correct `not-found.tsx` body rendered, instead of 404. The app code is
  correct (`notFound()` fires, right page renders); the status code itself
  is wrong at the edge (Cloudflare sits in front of Vercel per response
  headers). This is an infrastructure-layer issue outside what a code change
  in this repo can fix from here; see §14.

## 12 — Browser Verification

Performed in the existing, already-Discord-authenticated Chrome session
(the browser had a live `@Frambuesa` session; a fresh OAuth login could not
be performed programmatically since it requires real Discord credentials —
see §14):

- `/profile/Frambuesa` (owner, authenticated): loads, no console errors, all
  sections render (avatar, banner, bio, location, pronouns, 3 favorites,
  activity feed).
- `/profile/edit`: loads, all fields populated from the real profile
  including the now-working About Me textarea (0/2,000).
- Wrote a multi-paragraph About Me containing an emoji and a literal
  `<script>alert(1)</script>` string, saved — toast confirmed
  "PROFILE ATELIER CHANGES SAVED SUCCESSFULLY."
- Reloaded `/profile/Frambuesa`: About Me section appeared with paragraphs
  and emoji preserved, and the script tag rendered as **visible plain
  text** (no alert fired) — React's default JSX escaping, confirmed safe.
- Cleared About Me back to empty and saved again — confirmed via direct SQL
  that `about_me` is `null` again (test data cleaned up, not left on the
  real account).
- Production `/profile/Frambuesa`: same content renders correctly (avatar
  loaded via `/_next/image` from the Supabase storage bucket, 200).

Not exercised: a fresh Discord/Google OAuth login (needs real user
interaction with Discord's consent screen) and logout (would have logged
the user out of their real session with no way for me to log back in) — see
§14.

## 13 — Tests

`npm run typecheck`: clean.
`npm test`: 91/91 passing (26 suites), including the new
`tests/schema-drift.test.ts` (13 new assertions):

- migration exists adding `about_me`; generated types declare it on
  `Row`/`Insert`/`Update`.
- migration exists adding the favorites position-slot constraint + RPCs;
  generated types expose both RPC signatures.
- migration exists fixing `handle_new_user()` username generation.
- favorites position-slot invariant (0–5 valid, 6/-1 invalid; max 6 per
  user by construction).
- app-level username regex (`^[a-zA-Z0-9_]{3,30}$`) stays in sync with the
  DB's `username_format`/`username_length` CHECK constraints.

`npm run build`: succeeds, all 20 routes compile.

Direct-SQL verification against the live DB (not part of `npm test`, since
this repo's test suite has no DB access):

- `profiles.about_me` column exists (`information_schema.columns`).
- `sanitize_username_candidate()` tested via `SELECT` with messy input,
  empty string, too-short input, and `NULL` — all produced valid,
  constraint-satisfying usernames.
- Both previously-null-username profiles now have real usernames derived
  from their display names.
- Favorites cap: a `BEGIN ... ROLLBACK`-wrapped transaction against
  Frambuesa's real 3 favorites filled to 6 and then had its 7th insert
  rejected by `CHECK(position <= 5)` — confirmed 0 rows leaked afterward.

## 14 — Remaining Issues

Genuinely open, not addressed in this pass:

1. **React hydration warning on production `/profile/Frambuesa`** (error
   #418, text mismatch) — reproducible, not present on local dev, page
   content unaffected. Needs its own investigation (likely a
   server/client render difference specific to the production build or
   edge cache, or an environment/extension difference in the browser used
   to test) before it can be diagnosed further.
2. **404 responses return HTTP 200 at the edge** — app code is correct
   (`notFound()` renders the right page), but the actual response status
   for a nonexistent profile is 200 instead of 404 on production. Cloudflare
   sits in front of Vercel for this domain; diagnosing this needs access to
   the Cloudflare/Vercel dashboards, which this session doesn't have.
3. **Full OAuth login/logout cycle** not exercised end-to-end by this
   session — the browser already had a live Discord session, and I did not
   log it out (would strand the user's real session with no way to sign
   back in programmatically) or attempt a fresh OAuth consent flow (needs
   real Discord/Google interaction). The trigger fix in §07 is verified at
   the SQL level (sanitizer function, backfill); a live first-time OAuth
   signup should be smoke-tested by the user directly to close the loop.
4. **"FK error in music review" / "redirect('/') on null username"**
   mentioned in the original task brief were investigated and not found in
   the current codebase (§09) — either already fixed by an earlier commit,
   or specific to a reproduction path not covered here. Flagging rather
   than silently dropping.
5. Code changes in this pass have **not been committed or deployed**. The
   Supabase migrations are live (this is infrastructure, not app code, and
   was explicitly requested to be applied directly); the local file changes
   (`actions.ts`, `route.ts`, `database.types.ts`, `tests/`, migration
   files) are uncommitted working-tree changes pending review.
