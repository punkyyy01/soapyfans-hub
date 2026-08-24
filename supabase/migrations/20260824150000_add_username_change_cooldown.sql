-- Migration: Enforce a cooldown between username changes.
--
-- Problem: nothing stopped a user from changing their username as often as
-- they liked. Combined with the case-insensitive uniqueness invariant, this
-- lets someone repeatedly grab and release a desirable/impersonation-prone
-- handle, or briefly assume another user's just-freed handle. There was also
-- no server-side backstop at all -- only the app-level regex/ilike checks in
-- app/(main)/profile/edit/actions.ts.
--
-- Fix: track the last time each profile's username actually changed, and
-- reject an UPDATE that changes it again before the cooldown elapses. This
-- is enforced as a BEFORE UPDATE trigger (not just app-level) so it holds
-- even for direct PostgREST/API writes, consistent with how uniqueness and
-- the 6-favorite cap are enforced at the DB layer elsewhere in this schema.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;

COMMENT ON COLUMN public.profiles.username_changed_at IS
  'Timestamp of the last actual username change. Null means the username has never been changed since account creation (the OAuth-assigned or self-chosen initial value is still in place), so the very first change is never blocked by the cooldown below.';

-- Backfill: seed existing rows to their creation time so nobody already in
-- the table is retroactively cooled down by a rule that didn't exist when
-- they last changed their username.
UPDATE public.profiles SET username_changed_at = created_at WHERE username_changed_at IS NULL;

CREATE OR REPLACE FUNCTION public.enforce_username_change_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_cooldown constant interval := interval '14 days';
  v_elapsed interval;
  v_remaining_days integer;
BEGIN
  IF OLD.username_changed_at IS NOT NULL THEN
    v_elapsed := now() - OLD.username_changed_at;
    IF v_elapsed < v_cooldown THEN
      v_remaining_days := ceil(extract(epoch FROM (v_cooldown - v_elapsed)) / 86400);
      RAISE EXCEPTION 'You can change your username again in % day(s).', v_remaining_days
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  NEW.username_changed_at := now();
  RETURN NEW;
END;
$$;

-- Trigger-only function: no direct PostgREST RPC surface, same hardening
-- already applied to handle_new_user() in harden_username_functions.sql.
REVOKE EXECUTE ON FUNCTION public.enforce_username_change_cooldown() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_username_change_cooldown ON public.profiles;
CREATE TRIGGER profiles_username_change_cooldown
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION public.enforce_username_change_cooldown();
