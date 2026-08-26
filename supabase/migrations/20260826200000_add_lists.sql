-- Lists: user-curated named collections of films/TV credits, a Letterboxd-
-- style generalization of the existing single fixed "Sophie Picks" favorites
-- list (profile_favorites). A profile can have any number of lists, each
-- with an arbitrary number of items, an optional per-item note, and a
-- public/private flag independent of show_activity (a list is closer to
-- profile_favorites -- curated, intentionally shared -- than to the
-- activity feed).
--
-- Same "resolve title/poster live from TMDB at render time" philosophy as
-- profile_favorites/watchlist: only (tmdb_id, media_type) is stored here.
--
-- Unlike profile_favorites, there is no fixed-slot invariant to protect
-- (no cap on list count or item count), so create/rename/delete/add/remove
-- go through plain RLS-scoped table access, same shape as watchlist.
-- Reordering items *does* touch every row in one call, so it stays an RPC
-- (mirrors reorder_profile_favorites), but position has no UNIQUE
-- constraint here (ordering is cosmetic, not capacity-enforcing), so a
-- single-pass update is enough -- no negative-slot two-pass dance needed.

begin;

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lists is 'User-curated named collections of films/TV credits (Letterboxd-style lists). Title/poster resolved live from TMDB via list_items.tmdb_id, same as profile_favorites/watchlist.';

create unique index lists_user_name_lower_key on public.lists (user_id, lower(name));
create index lists_user_id_idx on public.lists (user_id, created_at desc);

create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

alter table public.lists enable row level security;

create policy "Public lists are viewable by everyone, private lists by their owner"
  on public.lists for select
  using (is_public or (select auth.uid()) = user_id);

create policy "Users can create their own lists"
  on public.lists for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own lists"
  on public.lists for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own lists"
  on public.lists for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ── list_items ──────────────────────────────────────────────────────────

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  note text check (note is null or char_length(note) <= 500),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint list_items_list_tmdb_type_unique unique (list_id, tmdb_id, media_type)
);

comment on table public.list_items is 'Entries within a list. Visibility inherits from the parent list (public.lists.is_public), enforced via a subquery in RLS since there is no denormalized owner/visibility column here.';

create index list_items_list_id_idx on public.list_items (list_id, position);

alter table public.list_items enable row level security;

create policy "List items are viewable when their parent list is viewable"
  on public.list_items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = list_id and (l.is_public or (select auth.uid()) = l.user_id)
    )
  );

create policy "Users can add items to their own lists"
  on public.list_items for insert
  to authenticated
  with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
  );

create policy "Users can update items in their own lists"
  on public.list_items for update
  to authenticated
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
  );

create policy "Users can remove items from their own lists"
  on public.list_items for delete
  to authenticated
  using (
    exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid()))
  );

-- ── RPC: reorder_list_items ─────────────────────────────────────────────

create or replace function public.reorder_list_items(p_list_id uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select user_id into v_owner_id from public.lists where id = p_list_id;
  if v_owner_id is null or v_owner_id <> v_user_id then
    raise exception 'List not found' using errcode = 'P0002';
  end if;

  select count(*) into v_count from public.list_items where list_id = p_list_id;
  if v_count <> array_length(p_ids, 1) then
    raise exception 'Reorder list must include every existing item exactly once' using errcode = 'P0001';
  end if;

  update public.list_items li
  set position = x.ord - 1
  from unnest(p_ids) with ordinality as x(id, ord)
  where li.id = x.id and li.list_id = p_list_id;
end;
$$;

comment on function public.reorder_list_items(uuid, uuid[]) is 'Bulk-reassigns list_items.position for one list. SECURITY INVOKER (no cross-user write) -- ownership is checked by hand since it needs the same "does the caller own this list" check across every row in the array, not something a single-row RLS policy expresses cleanly.';

-- CREATE FUNCTION grants EXECUTE to PUBLIC by default -- revoke it up front
-- instead of patching it in a follow-up migration later (see
-- 20260825164914_lock_down_social_rpc_grants.sql for why this matters).
revoke all on function public.reorder_list_items(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_list_items(uuid, uuid[]) to authenticated;

commit;
