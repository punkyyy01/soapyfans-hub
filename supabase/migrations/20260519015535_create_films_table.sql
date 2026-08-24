-- Recovered baseline migration: applied to production (version 20260519015535)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations. Superseded in part by
-- restrict_films_writes_to_service_role, already present in this repo.

-- films: local cache of TMDB film data, used for relational queries and aggregations
create table public.films (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null unique,
  title text not null,
  release_year integer,
  poster_path text,
  overview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.films is 'Local cache of TMDB films, populated when a film gets its first review';

-- Index for fast lookups by tmdb_id (most common query pattern)
create index films_tmdb_id_idx on public.films(tmdb_id);

-- updated_at trigger
create trigger films_set_updated_at
  before update on public.films
  for each row execute function public.set_updated_at();

-- RLS
alter table public.films enable row level security;

-- Anyone can read films
create policy "Films are viewable by everyone"
  on public.films for select
  using (true);

-- Only authenticated users can insert films (when they post a review)
create policy "Authenticated users can insert films"
  on public.films for insert
  to authenticated
  with check (true);

-- Films are not updatable or deletable by users (only by admin/service_role)
