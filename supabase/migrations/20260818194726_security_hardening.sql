-- Security Hardening: Production Audit III
--
-- 1) CRITICAL: profiles.is_admin was readable AND writable by anon/authenticated
--    at the column-privilege level. RLS ("Users can update own profile") only
--    restricts which ROW you can touch, not which COLUMNS -- so any logged-in
--    user could PATCH /rest/v1/profiles?id=eq.<own-id> with {"is_admin":true}
--    and self-promote to admin. Confirmed exploitable via a role-simulated
--    transaction (rolled back, no data changed) before this fix.
-- 2) rls_auto_enable() / set_admin_on_signup() are SECURITY DEFINER functions
--    only meant to run as an event trigger / AFTER INSERT trigger on
--    auth.users. Both are RETURNS trigger / RETURNS event_trigger, so direct
--    RPC invocation already fails at the Postgres level ("... functions can
--    only be called as triggers") -- but PostgREST still exposes them at
--    /rest/v1/rpc/... to anon+authenticated, which the security advisor
--    correctly flags as unnecessary attack surface. Revoking EXECUTE does not
--    affect trigger firing (Postgres does not gate that on caller EXECUTE
--    privilege).
-- 3) set_updated_at() had a mutable search_path (advisor warning).
-- 4) RLS policies re-evaluated auth.uid() per row; replaced with
--    (select auth.uid()) per Supabase's documented initplan optimization.
-- 5) banned_users had a blanket "readable by any authenticated user" SELECT
--    policy exposing ban reasons/moderator identity for every banned user to
--    every other user. No app code needs that -- middleware/auth callback
--    only ever self-check `.eq('user_id', user.id)`, and the admin dashboard
--    uses the service-role client (bypasses RLS). Restricted to self-read.
-- 6) films had no UPDATE policy, only INSERT. submitReview()'s
--    `.upsert(..., {onConflict:'tmdb_id'})` needs an UPDATE-permitting policy
--    whenever the film is already cached (i.e. a second person reviews the
--    same title) -- reproduced the exact failure via role-simulated
--    ON CONFLICT DO UPDATE, which raised "new row violates row-level
--    security policy". This was silently breaking review submission for any
--    already-cached film. films is a public TMDB metadata mirror (not
--    user-owned data) written only from server-side TMDB API responses, so
--    matching the existing INSERT policy's permissiveness is appropriate.
-- 7) banned_users.banned_by had no covering index for its FK.

begin;

-- ── 1) Lock down profiles.is_admin at the column-privilege layer ──────────
revoke select (is_admin), insert (is_admin), update (is_admin)
  on public.profiles from anon, authenticated;

-- Lets a signed-in user learn ONLY their own admin status without needing
-- column access. SECURITY DEFINER so it can read is_admin internally despite
-- the revoke above; ignores any caller-supplied id, so it can never be used
-- to probe another user's status.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = (select auth.uid())), false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- "Only admin can read is_admin" had `USING (true)` -- it never restricted
-- anything (RLS can't do column-level filtering anyway) and only produced a
-- redundant-permissive-policy warning. The column revoke above is the real
-- protection; this policy was pure noise.
drop policy if exists "Only admin can read is_admin" on public.profiles;

alter policy "Users can update own profile" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── 2) Trigger-only SECURITY DEFINER functions: no public RPC surface ─────
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.set_admin_on_signup() from public, anon, authenticated;

-- ── 3) Pin search_path on the remaining mutable-search_path function ──────
alter function public.set_updated_at() set search_path = public, pg_catalog;

-- ── 4) RLS initplan perf: auth.uid() -> (select auth.uid()) ───────────────
alter policy "Authenticated users can insert own reviews" on public.reviews
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own reviews" on public.reviews
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "Users can delete own reviews" on public.reviews
  using ((select auth.uid()) = user_id);

alter policy "Authenticated users can insert music reviews" on public.music_reviews
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own music reviews" on public.music_reviews
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Users can insert own favorites" on public.profile_favorites
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own favorites" on public.profile_favorites
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "Users can delete own favorites" on public.profile_favorites
  using ((select auth.uid()) = user_id);

-- ── 5) banned_users: stop leaking ban reasons/moderator identity ──────────
drop policy if exists "Banned users readable by authenticated" on public.banned_users;
create policy "Users can read own ban record" on public.banned_users
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- ── 6) films: add the missing UPDATE policy (fixes broken review upsert) ──
create policy "Authenticated users can update films" on public.films
  for update to authenticated
  using (true)
  with check (true);

-- ── 7) Unindexed FK ─────────────────────────────────────────────────────
create index if not exists banned_users_banned_by_idx on public.banned_users (banned_by);

commit;
