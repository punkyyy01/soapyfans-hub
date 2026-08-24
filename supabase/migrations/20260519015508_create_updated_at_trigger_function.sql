-- Recovered baseline migration: applied to production (version 20260519015508)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations so local migration history matches
-- what's actually running -- see the case-insensitive username uniqueness
-- migration's own commit for the class of bug this prevents (schema drift
-- between the repo and the live database).

-- Helper function that updates the updated_at column on row UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is 'Trigger function: auto-updates updated_at timestamp on row update';
