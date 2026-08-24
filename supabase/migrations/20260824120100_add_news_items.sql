-- News feed: RSS items ingested from entertainment outlets, classified by an
-- LLM (Groq) for relevance to Sophie Thatcher, then shown as
-- title + short summary + image, linking straight out to the source
-- article. See app/api/news-ingest/route.ts for the writer.
--
-- Only status = 'approved' rows are ever selectable by anon/authenticated --
-- rejected/uncertain rows stay in the table for audit but are never public,
-- same principle as reviews' deleted_at filtering. No INSERT/UPDATE/DELETE
-- policy exists for anon/authenticated at all: the ingest route is the only
-- legitimate writer and runs on the service-role client (bypasses RLS),
-- exactly like films' write path after 20260818203422_restrict_films_writes_to_service_role.sql --
-- so a direct PostgREST request can never forge or approve a news item.

begin;

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  title text not null,
  description text,
  image_url text,
  tag text,
  status text not null default 'uncertain' check (status in ('approved', 'rejected', 'uncertain')),
  confidence integer,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Dedup key: the ingest route checks this before inserting, so a title
-- reappearing in the same feed (or a second feed carrying the same story)
-- is never processed or classified twice.
create unique index news_items_source_url_key on public.news_items (source_url);

create index news_items_status_published_idx
  on public.news_items (status, published_at desc);

alter table public.news_items enable row level security;

create policy "Approved news is publicly readable"
  on public.news_items
  for select
  to anon, authenticated
  using (status = 'approved');

commit;
