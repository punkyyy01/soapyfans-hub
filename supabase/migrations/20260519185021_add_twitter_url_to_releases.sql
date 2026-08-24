-- Recovered baseline migration: applied to production (version 20260519185021)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations.

ALTER TABLE releases ADD COLUMN twitter_url TEXT;
