-- Migration: Guarantee every new profile gets a valid, unique username.
-- Root cause: handle_new_user() only used raw_user_meta_data->>'preferred_username',
-- which Discord/Google often omit, leaving username NULL forever (confirmed:
-- 2 existing prod profiles had username IS NULL). Every /profile/<slug> route
-- already falls back to the UUID when username is null, so no /profile/null
-- ever occurred -- but users got no human-readable URL and had to notice and
-- fix it manually in the editor.

-- Pure, independently testable: turns arbitrary OAuth metadata into a string
-- that satisfies the profiles.username_format / username_length constraints.
CREATE OR REPLACE FUNCTION public.sanitize_username_candidate(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN char_length(base) < 3 THEN rpad(base, 3, '0')
    ELSE left(base, 24)
  END
  FROM (
    SELECT COALESCE(
      NULLIF(left(regexp_replace(raw, '[^a-zA-Z0-9_]', '', 'g'), 24), ''),
      'user'
    ) AS base
  ) s
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_base text;
  v_candidate text;
  v_attempt int := 0;
begin
  v_base := public.sanitize_username_candidate(
    coalesce(
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1),
      'user'
    )
  );
  v_candidate := v_base;

  loop
    begin
      insert into public.profiles (id, username, display_name, avatar_url)
      values (
        new.id,
        v_candidate,
        coalesce(
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'name',
          split_part(new.email, '@', 1)
        ),
        new.raw_user_meta_data->>'avatar_url'
      );
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      exit when v_attempt > 20;
      v_candidate := left(v_base, 23) || '_' || substr(md5(new.id::text || v_attempt::text), 1, 6);
    end;
  end loop;

  return new;
end;
$function$;

-- Backfill: existing users the old trigger left with no username.
DO $$
DECLARE
  r record;
  v_base text;
  v_candidate text;
  v_attempt int;
BEGIN
  FOR r IN SELECT id, display_name FROM public.profiles WHERE username IS NULL LOOP
    v_base := public.sanitize_username_candidate(coalesce(r.display_name, 'user'));
    v_candidate := v_base;
    v_attempt := 0;
    LOOP
      BEGIN
        UPDATE public.profiles SET username = v_candidate WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        v_attempt := v_attempt + 1;
        EXIT WHEN v_attempt > 20;
        v_candidate := left(v_base, 23) || '_' || substr(md5(r.id::text || v_attempt::text), 1, 6);
      END;
    END LOOP;
  END LOOP;
END $$;
