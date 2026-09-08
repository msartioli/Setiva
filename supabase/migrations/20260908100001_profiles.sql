-- Setiva: 01 - profiles e preferencias
-- Cria o perfil de cada usuario autenticado, vinculado a auth.users, e as
-- preferencias de interface (tema, densidade, privacidade de valores).
-- Pre-condicao: nenhuma. Pode ser aplicada em projeto novo ou existente,
-- desde que a tabela public.profiles ainda nao exista.

begin;

-- Funcao utilitaria reaproveitada pelas migrations seguintes para manter
-- updated_at coerente sem depender de logica no cliente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.app_theme as enum ('light', 'dark', 'system');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  nickname text,
  avatar_family text,
  avatar_style text,
  avatar_seed text,
  avatar_url text,
  theme public.app_theme not null default 'system',
  density text not null default 'comfortable',
  hide_values boolean not null default false,
  show_cents boolean not null default true,
  first_day_of_week smallint not null default 0,
  animations_enabled boolean not null default true,
  mascot_enabled boolean not null default true,
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_density_check check (density in ('comfortable', 'compact')),
  constraint profiles_first_day_check check (first_day_of_week in (0, 1)),
  constraint profiles_display_name_len check (char_length(display_name) <= 80),
  constraint profiles_nickname_len check (nickname is null or char_length(nickname) <= 40)
);

comment on table public.profiles is 'Perfil e preferencias de interface de cada usuario. Uma linha por usuario autenticado.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sem policy de delete: exclusao de conta e tratada por fluxo dedicado
-- (ver migration 08) que remove o usuario em auth.users via service role,
-- o que arrasta o perfil pelo on delete cascade.

-- Cria automaticamente o perfil ao nascer um novo usuario em auth.users,
-- evitando que a aplicacao precise inserir a linha antes de ter sessao.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, nickname, avatar_family, avatar_style, avatar_seed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_family', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_style', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_seed', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

commit;

-- Verificacao sugerida apos aplicar:
--   select count(*) from public.profiles; -- deve funcionar sem erro
--   select policyname from pg_policies where tablename = 'profiles';
