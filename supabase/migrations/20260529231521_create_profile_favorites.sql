-- Recovered baseline migration: applied to production (version 20260529231521)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations. Superseded in part by
-- favorites_position_slot_constraint (position CHECK/UNIQUE + RPCs) and
-- security_hardening (auth.uid() initplan rewrite), already present in this
-- repo.

-- Tabla de favoritos de perfil
CREATE TABLE IF NOT EXISTS public.profile_favorites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tmdb_id    integer     NOT NULL,
  media_type text        NOT NULL CHECK (media_type IN ('movie', 'tv')),
  position   smallint    NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profile_favorites_user_tmdb_type_unique UNIQUE (user_id, tmdb_id, media_type)
);

-- RLS
ALTER TABLE public.profile_favorites ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquiera puede ver favoritos de perfiles públicos
CREATE POLICY "Profile favorites viewable by everyone"
  ON public.profile_favorites
  FOR SELECT
  USING (true);

-- INSERT: solo el propio usuario
CREATE POLICY "Users can insert own favorites"
  ON public.profile_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: solo el propio usuario
CREATE POLICY "Users can update own favorites"
  ON public.profile_favorites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: solo el propio usuario
CREATE POLICY "Users can delete own favorites"
  ON public.profile_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
