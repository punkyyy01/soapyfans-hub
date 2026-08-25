-- Social layer: follows, likes, replies (comments), reports, and the
-- notifications that follows/likes/replies/mentions feed into.
--
-- House style followed throughout (see existing migrations):
--   * Invariant-enforcing writes go through RPCs, never raw table access
--     from the client (profile_favorites precedent).
--   * SECURITY DEFINER is used ONLY where a function must write a row for
--     a user other than the caller (notifications for someone else) --
--     same justification as is_admin() in 20260818194726_security_hardening.sql.
--     Those functions re-implement the auth.uid()/ownership checks by hand
--     since SECURITY DEFINER bypasses RLS entirely.
--   * With RLS enabled and no permissive policy for a given role+command,
--     Postgres denies by default -- so tables meant to be written only via
--     an RPC simply get no INSERT/UPDATE/DELETE policy for
--     anon/authenticated at all (same shape as news_items).
--   * Soft delete via deleted_at, never hard delete, on anything
--     moderatable (matches reviews/music_reviews).
--   * No FK for genuinely polymorphic references (reports.target_id can
--     point at 4 different tables) -- existence is checked inside the RPC
--     instead, same precedent as profile_favorites.tmdb_id having no FK.

begin;

-- ── follows ─────────────────────────────────────────────────────────────

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

comment on table public.follows is 'Who follows whom. Written only via toggle_follow() -- no direct INSERT/DELETE policy for clients.';

create index follows_following_id_idx on public.follows(following_id);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

-- ── review_likes ────────────────────────────────────────────────────────

create table public.review_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  music_review_id uuid references public.music_reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint review_likes_exactly_one_target check (
    (review_id is not null and music_review_id is null) or
    (review_id is null and music_review_id is not null)
  ),
  constraint review_likes_unique_per_review unique (user_id, review_id),
  constraint review_likes_unique_per_music_review unique (user_id, music_review_id)
);

comment on table public.review_likes is 'Likes on film reviews or music reviews (exactly one of review_id/music_review_id set). Written only via toggle_review_like().';

create index review_likes_review_id_idx on public.review_likes(review_id) where review_id is not null;
create index review_likes_music_review_id_idx on public.review_likes(music_review_id) where music_review_id is not null;

alter table public.review_likes enable row level security;

create policy "Review likes are viewable by everyone"
  on public.review_likes for select
  using (true);

-- ── review_replies ──────────────────────────────────────────────────────

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  music_review_id uuid references public.music_reviews(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint review_replies_exactly_one_target check (
    (review_id is not null and music_review_id is null) or
    (review_id is null and music_review_id is not null)
  ),
  constraint review_replies_content_length check (char_length(content) between 1 and 2000)
);

comment on table public.review_replies is 'Replies/comments on a film review or music review. Soft-deleted via deleted_at, same as reviews.';

create index review_replies_review_id_idx on public.review_replies(review_id) where deleted_at is null;
create index review_replies_music_review_id_idx on public.review_replies(music_review_id) where deleted_at is null;
create index review_replies_user_id_idx on public.review_replies(user_id) where deleted_at is null;

create trigger review_replies_set_updated_at
  before update on public.review_replies
  for each row execute function public.set_updated_at();

alter table public.review_replies enable row level security;

create policy "Non-deleted replies are viewable by everyone"
  on public.review_replies for select
  using (deleted_at is null);

-- Insertion happens only through submit_review_reply() (needs to fan out
-- notifications to a different user, so it's SECURITY DEFINER -- see
-- below). Editing/soft-deleting your own reply is a same-user operation
-- with no cross-user side effect, so it stays a plain RLS-gated UPDATE,
-- same shape as "Users can update own reviews".
create policy "Users can update own replies"
  on public.review_replies for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── reports ──────────────────────────────────────────────────────────────

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('review', 'music_review', 'review_reply', 'news_item')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

comment on table public.reports is 'User-submitted reports against a review/music_review/review_reply/news_item. No FK on target_id -- it is polymorphic across 4 tables, existence is checked inside submit_report(). Readable only by admins (via service-role client) or the reporter themselves.';

create unique index reports_pending_dedup_idx
  on public.reports (reporter_id, target_type, target_id)
  where status = 'pending';

create index reports_status_created_idx on public.reports(status, created_at desc);

alter table public.reports enable row level security;

-- No public/authenticated SELECT-all policy -- the admin dashboard reads
-- via createAdminClient() (service role, bypasses RLS), same pattern as
-- banned_users. Reporters can see the status of their own reports.
create policy "Users can view their own reports"
  on public.reports for select
  to authenticated
  using ((select auth.uid()) = reporter_id);

-- submit_report() is SECURITY INVOKER (no cross-user write needed), so it
-- still needs a real INSERT policy to succeed.
create policy "Authenticated users can submit reports as themselves"
  on public.reports for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);

-- ── notifications ────────────────────────────────────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('follow', 'like', 'reply', 'mention')),
  target_type text check (target_type in ('review', 'music_review')),
  target_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'In-app notifications fed by follows/likes/replies/mentions. Written only via SECURITY DEFINER RPCs (toggle_follow, toggle_review_like, submit_review_reply) -- no INSERT policy exists for anon/authenticated at all, so a client can never forge a notification directly.';

create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Marking as read is a same-user operation with no cross-user side effect.
create policy "Users can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Deliberately no INSERT policy for anon/authenticated: rows are created
-- only inside the SECURITY DEFINER functions below, which run with the
-- function owner's privileges and so are not blocked by RLS the way a
-- direct client insert would be.

-- ── RPCs ─────────────────────────────────────────────────────────────────

create or replace function public.toggle_follow(p_target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if v_user_id = p_target_user_id then
    raise exception 'You cannot follow yourself' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  delete from public.follows
  where follower_id = v_user_id and following_id = p_target_user_id
  returning true into v_deleted;

  if v_deleted then
    return false; -- now unfollowed
  end if;

  insert into public.follows (follower_id, following_id)
  values (v_user_id, p_target_user_id)
  on conflict (follower_id, following_id) do nothing;

  insert into public.notifications (user_id, actor_id, type)
  values (p_target_user_id, v_user_id, 'follow');

  return true; -- now following
end;
$$;

comment on function public.toggle_follow(uuid) is 'Toggles a follow relationship and notifies the target user on new follows. SECURITY DEFINER because it must insert a notification row for a user other than the caller.';

grant execute on function public.toggle_follow(uuid) to authenticated;

create or replace function public.toggle_review_like(p_target_type text, p_target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_deleted boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_target_type not in ('review', 'music_review') then
    raise exception 'Invalid target type' using errcode = 'P0001';
  end if;

  if p_target_type = 'review' then
    select user_id into v_owner_id from public.reviews where id = p_target_id and deleted_at is null;
  else
    select user_id into v_owner_id from public.music_reviews where id = p_target_id and deleted_at is null;
  end if;

  if v_owner_id is null then
    raise exception 'Review not found' using errcode = 'P0002';
  end if;

  if p_target_type = 'review' then
    delete from public.review_likes
    where user_id = v_user_id and review_id = p_target_id
    returning true into v_deleted;
  else
    delete from public.review_likes
    where user_id = v_user_id and music_review_id = p_target_id
    returning true into v_deleted;
  end if;

  if v_deleted then
    return false; -- now unliked
  end if;

  if p_target_type = 'review' then
    insert into public.review_likes (user_id, review_id) values (v_user_id, p_target_id)
    on conflict (user_id, review_id) do nothing;
  else
    insert into public.review_likes (user_id, music_review_id) values (v_user_id, p_target_id)
    on conflict (user_id, music_review_id) do nothing;
  end if;

  if v_owner_id <> v_user_id then
    insert into public.notifications (user_id, actor_id, type, target_type, target_id)
    values (v_owner_id, v_user_id, 'like', p_target_type, p_target_id);
  end if;

  return true; -- now liked
end;
$$;

comment on function public.toggle_review_like(text, uuid) is 'Toggles a like on a review/music_review and notifies its author. SECURITY DEFINER because it must insert a notification row for the review author, who is not necessarily the caller.';

grant execute on function public.toggle_review_like(text, uuid) to authenticated;

create or replace function public.submit_review_reply(p_target_type text, p_target_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_reply_id uuid;
  v_content text := trim(p_content);
  v_mention text;
  v_mentioned_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_target_type not in ('review', 'music_review') then
    raise exception 'Invalid target type' using errcode = 'P0001';
  end if;

  if char_length(v_content) < 1 or char_length(v_content) > 2000 then
    raise exception 'Reply must be between 1 and 2000 characters' using errcode = 'P0003';
  end if;

  if p_target_type = 'review' then
    select user_id into v_owner_id from public.reviews where id = p_target_id and deleted_at is null;
  else
    select user_id into v_owner_id from public.music_reviews where id = p_target_id and deleted_at is null;
  end if;

  if v_owner_id is null then
    raise exception 'Review not found' using errcode = 'P0002';
  end if;

  if p_target_type = 'review' then
    insert into public.review_replies (user_id, review_id, content)
    values (v_user_id, p_target_id, v_content)
    returning id into v_reply_id;
  else
    insert into public.review_replies (user_id, music_review_id, content)
    values (v_user_id, p_target_id, v_content)
    returning id into v_reply_id;
  end if;

  if v_owner_id <> v_user_id then
    insert into public.notifications (user_id, actor_id, type, target_type, target_id)
    values (v_owner_id, v_user_id, 'reply', p_target_type, p_target_id);
  end if;

  -- @mentions: same case-insensitive lookup as profiles_username_lower_key
  -- (20260820120000_case_insensitive_username_uniqueness.sql). Each
  -- matched user is notified once, skipping self-mentions.
  for v_mention in select (regexp_matches(v_content, '@([a-zA-Z0-9_]{3,30})', 'g'))[1]
  loop
    select id into v_mentioned_id
    from public.profiles
    where lower(username) = lower(v_mention)
    limit 1;

    if v_mentioned_id is not null and v_mentioned_id <> v_user_id then
      insert into public.notifications (user_id, actor_id, type, target_type, target_id)
      values (v_mentioned_id, v_user_id, 'mention', p_target_type, p_target_id);
    end if;
  end loop;

  return v_reply_id;
end;
$$;

comment on function public.submit_review_reply(text, uuid, text) is 'Inserts a reply, notifies the review author, and notifies any @mentioned users. SECURITY DEFINER because it must insert notification rows for users other than the caller.';

grant execute on function public.submit_review_reply(text, uuid, text) to authenticated;

create or replace function public.submit_report(p_target_type text, p_target_id uuid, p_reason text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exists boolean;
  v_report_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_target_type not in ('review', 'music_review', 'review_reply', 'news_item') then
    raise exception 'Invalid target type' using errcode = 'P0001';
  end if;

  if char_length(trim(p_reason)) < 1 or char_length(p_reason) > 500 then
    raise exception 'Reason must be between 1 and 500 characters' using errcode = 'P0003';
  end if;

  case p_target_type
    when 'review' then
      select exists(select 1 from public.reviews where id = p_target_id) into v_exists;
    when 'music_review' then
      select exists(select 1 from public.music_reviews where id = p_target_id) into v_exists;
    when 'review_reply' then
      select exists(select 1 from public.review_replies where id = p_target_id) into v_exists;
    when 'news_item' then
      select exists(select 1 from public.news_items where id = p_target_id) into v_exists;
  end case;

  if not v_exists then
    raise exception 'Reported item not found' using errcode = 'P0002';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (v_user_id, p_target_type, p_target_id, trim(p_reason))
  on conflict (reporter_id, target_type, target_id) where status = 'pending'
  do nothing
  returning id into v_report_id;

  if v_report_id is null then
    raise exception 'You already reported this' using errcode = 'P0004';
  end if;

  return v_report_id;
end;
$$;

comment on function public.submit_report(text, uuid, text) is 'Inserts a report as the calling user. SECURITY INVOKER (no cross-user write needed) -- relies on the "Authenticated users can submit reports as themselves" RLS policy.';

grant execute on function public.submit_report(text, uuid, text) to authenticated;

commit;
