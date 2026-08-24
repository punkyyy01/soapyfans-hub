-- Recovered baseline migration: applied to production (version 20260519134111)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations.

-- releases: EPs, singles, álbumes de Sophie Thatcher
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  musicbrainz_id text unique,
  title text not null,
  release_type text not null, -- 'ep', 'single', 'album', 'soundtrack'
  release_date date,
  cover_art_url text,
  spotify_url text,
  apple_music_url text,
  bandcamp_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.releases is 'Sophie Thatcher music releases — EPs, singles, soundtracks';

-- tracks: canciones dentro de cada release
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  musicbrainz_id text unique,
  title text not null,
  duration_ms integer, -- duración en milisegundos
  track_number smallint,
  youtube_video_id text, -- solo el ID, ej: "dQw4w9WgXcQ"
  spotify_track_url text,
  lyrics_snippet text, -- máximo 2 versos para contexto, nada más
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tracks is 'Individual tracks within a release';
comment on column public.tracks.youtube_video_id is 'YouTube video ID for official music videos only';
comment on column public.tracks.lyrics_snippet is 'Max 1-2 lines for context only — copyright compliance';

-- music_reviews: mismo sistema que film reviews pero para releases
create table public.music_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  release_id uuid not null references public.releases(id) on delete cascade,
  rating smallint not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint music_rating_range check (rating >= 1 and rating <= 5),
  constraint music_content_length check (content is null or char_length(content) <= 5000),
  constraint one_music_review_per_user_per_release unique (user_id, release_id)
);

comment on table public.music_reviews is 'Fan reviews of Sophie Thatcher music releases';

-- triggers updated_at
create trigger releases_set_updated_at
  before update on public.releases
  for each row execute function public.set_updated_at();

create trigger tracks_set_updated_at
  before update on public.tracks
  for each row execute function public.set_updated_at();

create trigger music_reviews_set_updated_at
  before update on public.music_reviews
  for each row execute function public.set_updated_at();

-- índices
create index tracks_release_id_idx on public.tracks(release_id);
create index tracks_track_number_idx on public.tracks(release_id, track_number);
create index music_reviews_release_id_idx on public.music_reviews(release_id) where deleted_at is null;
create index music_reviews_user_id_idx on public.music_reviews(user_id) where deleted_at is null;

-- RLS
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.music_reviews enable row level security;

-- releases y tracks: solo lectura pública, escritura solo service_role
create policy "Releases viewable by everyone"
  on public.releases for select using (true);

create policy "Tracks viewable by everyone"
  on public.tracks for select using (true);

-- music_reviews: mismo patrón que film reviews
create policy "Non-deleted music reviews viewable by everyone"
  on public.music_reviews for select using (deleted_at is null);

create policy "Authenticated users can insert music reviews"
  on public.music_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own music reviews"
  on public.music_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
