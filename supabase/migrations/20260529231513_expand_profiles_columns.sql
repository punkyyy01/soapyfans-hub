-- Recovered baseline migration: applied to production (version 20260529231513)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations.

-- Nuevas columnas en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url       text,
  ADD COLUMN IF NOT EXISTS accent_color     text
    CONSTRAINT profiles_accent_color_hex CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  ADD COLUMN IF NOT EXISTS profile_css      text
    CONSTRAINT profiles_profile_css_length  CHECK (char_length(profile_css) <= 5000),
  ADD COLUMN IF NOT EXISTS pronouns         text
    CONSTRAINT profiles_pronouns_length     CHECK (char_length(pronouns) <= 30),
  ADD COLUMN IF NOT EXISTS location_text   text
    CONSTRAINT profiles_location_length     CHECK (char_length(location_text) <= 60),
  ADD COLUMN IF NOT EXISTS website_url      text,
  ADD COLUMN IF NOT EXISTS show_activity    boolean NOT NULL DEFAULT true;
