-- Corrects the previous migration (20260818194726_security_hardening.sql).
--
-- `revoke select/insert/update (is_admin) on profiles from anon, authenticated`
-- had NO effect: Supabase's default bootstrap grants anon/authenticated
-- TABLE-LEVEL SELECT/INSERT/UPDATE/DELETE on every public table
-- (`GRANT ALL ON ALL TABLES IN SCHEMA public ...`), and a column-level REVOKE
-- cannot claw back a table-level GRANT in Postgres's privilege model -- it
-- only removes a privilege that was itself granted at column granularity.
-- Verified live: after the "fix", `SELECT is_admin FROM profiles` under a
-- role-simulated authenticated session still returned a value instead of
-- erroring with permission-denied.
--
-- The correct fix is to REVOKE the table-level privilege entirely and
-- re-GRANT it at column granularity for every column except is_admin.
-- profiles rows are only ever created by the handle_new_user() SECURITY
-- DEFINER trigger (runs as the function owner, not the calling role) and no
-- client code path inserts into profiles directly, so INSERT is not
-- re-granted at all -- RLS already had no permissive INSERT policy either,
-- so this is pure defense-in-depth with no functional change.

begin;

revoke select, insert, update on public.profiles from anon, authenticated;

grant select (
  id, username, display_name, avatar_url, bio, created_at, updated_at,
  banner_url, accent_color, profile_css, pronouns, location_text,
  website_url, show_activity, about_me
) on public.profiles to anon, authenticated;

grant update (
  display_name, username, pronouns, bio, about_me, location_text,
  website_url, accent_color, profile_css, show_activity, avatar_url,
  banner_url, updated_at
) on public.profiles to authenticated;

commit;
