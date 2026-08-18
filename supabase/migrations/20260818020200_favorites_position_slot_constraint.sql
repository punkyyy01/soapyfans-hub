-- Migration: Enforce the 6-favorite cap as a real DB guarantee instead of an
-- app-level count-then-insert check (which races under concurrent inserts).
-- position becomes a bounded slot (0-5); UNIQUE(user_id, position) makes a
-- 7th favorite for the same user structurally impossible to store.

ALTER TABLE public.profile_favorites
  ADD CONSTRAINT profile_favorites_position_range CHECK (position >= 0 AND position <= 5);

ALTER TABLE public.profile_favorites
  ADD CONSTRAINT profile_favorites_user_position_unique UNIQUE (user_id, position);

-- Atomically pick the next free slot and insert, serialized per-user via a row
-- lock on the owning profile so concurrent requests can't both read count=5.
CREATE OR REPLACE FUNCTION public.add_profile_favorite(p_tmdb_id integer, p_media_type text)
RETURNS public.profile_favorites
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_position smallint;
  v_row public.profile_favorites;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  SELECT count(*) INTO v_position FROM public.profile_favorites WHERE user_id = v_user_id;
  IF v_position >= 6 THEN
    RAISE EXCEPTION 'Maximum 6 favorites allowed' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profile_favorites (user_id, tmdb_id, media_type, position)
  VALUES (v_user_id, p_tmdb_id, p_media_type, v_position)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Reorders in two passes (temp negative slots, then final slots) so the
-- UNIQUE(user_id, position) constraint never trips mid-reorder, all inside
-- the single transaction the function body runs in.
CREATE OR REPLACE FUNCTION public.reorder_profile_favorites(p_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  SELECT count(*) INTO v_count FROM public.profile_favorites WHERE user_id = v_user_id;
  IF v_count <> array_length(p_ids, 1) THEN
    RAISE EXCEPTION 'Reorder list must include every existing favorite exactly once' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profile_favorites pf
  SET position = -1 - (x.ord - 1)
  FROM unnest(p_ids) WITH ORDINALITY AS x(id, ord)
  WHERE pf.id = x.id AND pf.user_id = v_user_id;

  UPDATE public.profile_favorites pf
  SET position = x.ord - 1
  FROM unnest(p_ids) WITH ORDINALITY AS x(id, ord)
  WHERE pf.id = x.id AND pf.user_id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_profile_favorite(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_profile_favorites(uuid[]) TO authenticated;
