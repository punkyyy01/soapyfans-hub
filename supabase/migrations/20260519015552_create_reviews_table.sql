-- Recovered baseline migration: applied to production (version 20260519015552)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations.

-- reviews: user reviews of films, 1 per user per film
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  film_id uuid not null references public.films(id) on delete cascade,
  rating smallint not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint rating_range check (rating >= 1 and rating <= 5),
  constraint content_length check (content is null or char_length(content) <= 5000),
  constraint one_review_per_user_per_film unique (user_id, film_id)
);

comment on table public.reviews is 'User reviews of films (1-5 rating + optional text content)';
comment on column public.reviews.deleted_at is 'Soft delete: when set, review is hidden but data is preserved';

-- Indexes for common query patterns
create index reviews_film_id_idx on public.reviews(film_id) where deleted_at is null;
create index reviews_user_id_idx on public.reviews(user_id) where deleted_at is null;
create index reviews_created_at_idx on public.reviews(created_at desc) where deleted_at is null;

-- updated_at trigger
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- RLS
alter table public.reviews enable row level security;

-- Anyone can read non-deleted reviews
create policy "Non-deleted reviews are viewable by everyone"
  on public.reviews for select
  using (deleted_at is null);

-- Authenticated users can insert reviews as themselves
create policy "Authenticated users can insert own reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update only their own reviews
create policy "Users can update own reviews"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can soft-delete their own reviews (by setting deleted_at via update)
-- We do NOT allow hard DELETE from clients to preserve history
