-- Per-user "last seen" timestamps for /news and /music, used only to show
-- an unseen-content dot in the navbar.
--
-- Deliberately NOT modeled as rows in `notifications`: news-ingest runs
-- every 30 minutes (.github/workflows/news-ingest-cron.yml) and fanning out
-- one notification row per user per approved news item would spam the bell
-- (devaluing it for actual social interactions) and write O(users * items)
-- rows on every cron tick. A single per-user row compared against the
-- latest news_items/releases timestamp is O(1) writes and a cheap read.

begin;

create table public.content_seen (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  news_seen_at timestamptz,
  releases_seen_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.content_seen is 'Per-user last-viewed timestamps for /news and /music. Not user-facing data -- purely to compute the navbar''s unseen-content indicator.';

create trigger content_seen_set_updated_at
  before update on public.content_seen
  for each row execute function public.set_updated_at();

alter table public.content_seen enable row level security;

create policy "Users can view their own content_seen row"
  on public.content_seen for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own content_seen row"
  on public.content_seen for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own content_seen row"
  on public.content_seen for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
