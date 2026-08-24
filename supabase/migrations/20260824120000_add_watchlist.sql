-- Watchlist: lets a signed-in fan mark a film/TV credit as "want to watch",
-- separate from profile_favorites (curated top picks) and reviews (already
-- watched + rated). Mirrors profile_favorites' shape and RLS style: only
-- (user_id, tmdb_id, media_type) is stored -- title/poster are resolved live
-- from TMDB at render time (see app/(main)/profile/[username]/page.tsx's
-- existing favoriteDetails pattern), so nothing here ever goes stale.

begin;

create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  created_at timestamptz not null default now()
);

-- One entry per (user, title): re-adding an already-watchlisted title is a
-- no-op, not a duplicate row.
create unique index watchlist_user_tmdb_media_key
  on public.watchlist (user_id, tmdb_id, media_type);

create index watchlist_user_id_idx on public.watchlist (user_id);

alter table public.watchlist enable row level security;

-- Public by default, same as reviews and profile_favorites -- a profile's
-- watchlist is part of its public archive page. The profile page itself
-- additionally gates rendering on show_activity, same as Recent Activity.
create policy "Watchlist is publicly readable"
  on public.watchlist
  for select
  to anon, authenticated
  using (true);

create policy "Users can add to their own watchlist"
  on public.watchlist
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can remove from their own watchlist"
  on public.watchlist
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

commit;
