-- Recovered baseline migration: applied to production (version 20260519015524)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations. Superseding migrations already in
-- this repo (fix_oauth_username_generation, harden_username_functions,
-- security_hardening, fix_profiles_column_grants,
-- case_insensitive_username_uniqueness) replay on top of this one in
-- timestamp order, exactly as they did in production.

-- profiles: public user data, 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

comment on table public.profiles is 'Public user profiles, linked 1:1 with auth.users';

-- updated_at trigger
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    -- Username: from metadata, or null (user can set later)
    nullif(new.raw_user_meta_data->>'preferred_username', ''),
    -- Display name: from Discord/OAuth metadata or email prefix
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

-- Anyone (even anonymous) can read profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Only the user themselves can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy: profiles are only created via the handle_new_user trigger
-- No DELETE policy: deletion cascades from auth.users
