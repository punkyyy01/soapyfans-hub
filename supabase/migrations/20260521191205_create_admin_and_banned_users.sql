-- Recovered baseline migration: applied to production (version 20260521191205)
-- but never committed to this repo. Content reproduced verbatim from
-- supabase_migrations.schema_migrations. Superseded in part by
-- security_hardening (drops/replaces the is_admin read policy and the
-- set_admin_on_signup RPC exposure), already present in this repo.

-- Columna is_admin en profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Solo el admin puede verse a sí mismo como admin
-- Nadie puede escribir is_admin desde el cliente
create policy "Only admin can read is_admin"
  on public.profiles for select
  using (true); -- ya existe select policy, is_admin se lee igual

-- Tabla banned_users
create table public.banned_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid not null references public.profiles(id),
  reason text,
  created_at timestamptz not null default now(),
  constraint banned_users_user_id_unique unique (user_id)
);

comment on table public.banned_users is 'Users banned by admin — checked on login via middleware';

-- RLS en banned_users
alter table public.banned_users enable row level security;

-- Solo lectura pública (el middleware necesita leer esto)
create policy "Banned users readable by authenticated"
  on public.banned_users for select
  to authenticated
  using (true);

-- Solo service_role puede insertar/borrar (lo hacemos desde server action con verificación de admin)
-- El insert/delete lo haremos via server action que verifica email hardcodeado

-- Marcar aikodiaz45@gmail.com como admin
-- Se ejecuta después de que el usuario exista en profiles
-- Como puede no existir aún, lo hacemos con un trigger que lo marca al crearse

create or replace function public.set_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'aikodiaz45@gmail.com' then
    update public.profiles set is_admin = true where id = new.id;
  end if;
  return new;
end;
$$;

create trigger mark_admin_on_signup
  after insert on auth.users
  for each row execute function public.set_admin_on_signup();

-- Marcar la cuenta existente como admin si ya existe
update public.profiles
set is_admin = true
where id = (
  select id from auth.users where email = 'aikodiaz45@gmail.com' limit 1
);

-- Índice para lookup rápido en middleware
create index banned_users_user_id_idx on public.banned_users(user_id);
