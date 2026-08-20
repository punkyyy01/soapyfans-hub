-- Migration: Case-insensitive uniqueness for profiles.username.
--
-- Problem: profiles_username_key is a case-SENSITIVE UNIQUE(username)
-- constraint, but every public profile lookup resolves usernames
-- case-insensitively (.ilike() in app/(main)/profile/[username]/page.tsx).
-- Two profiles differing only by case ("JohnDoe" / "johndoe") could
-- coexist at the DB level and make that lookup match multiple rows,
-- throwing instead of resolving to one canonical profile.
--
-- Fix: replace the case-sensitive constraint with a case-insensitive one.
-- username_format restricts values to [a-zA-Z0-9_], so lower() is safe and
-- locale-independent here -- no citext extension needed.
--
-- Safety: aborts the whole migration (no partial state, no renamed/deleted
-- rows) if any existing case-variant collision is found, rather than
-- silently mutating usernames.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username IS NOT NULL
    GROUP BY lower(username)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce case-insensitive username uniqueness: existing case-variant username collisions found. Resolve them manually, then re-run this migration.';
  END IF;
END $$;

ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_key;

-- Postgres UNIQUE constraints only support plain columns, not expressions,
-- so a case-insensitive uniqueness invariant on an expression must be a
-- unique index rather than a table CONSTRAINT -- this is the standard
-- Postgres pattern and behaves identically for INSERT/UPDATE conflict
-- detection (raises unique_violation, caught by the existing
-- handle_new_user() retry loop unchanged).
CREATE UNIQUE INDEX profiles_username_lower_key ON public.profiles (lower(username));
