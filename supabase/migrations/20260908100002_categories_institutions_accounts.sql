-- Setiva: 02 - categorias, instituicoes e contas
-- Pre-condicao: migration 01 aplicada (public.profiles, public.set_updated_at).

begin;

-- Categorias: linhas com user_id nulo sao categorias padrao do sistema,
-- visiveis a todos os usuarios autenticados mas nunca editaveis por eles.
-- Linhas com user_id preenchido sao categorias proprias do usuario.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid(): o cliente nunca precisa (nem consegue) enviar
  -- user_id de outra pessoa; categorias de sistema sao seedadas explicitando
  -- user_id (a coluna aceita null), entao o default nunca entra nesse caso.
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null,
  icon text not null default 'circle',
  color text not null default '#46533A',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_kind_check check (kind in ('income', 'expense')),
  constraint categories_name_len check (char_length(name) between 1 and 60)
);

comment on table public.categories is 'Categorias de receita/despesa. user_id nulo = categoria padrao do sistema (somente leitura para o usuario).';

create unique index categories_user_name_kind_uq
  on public.categories (user_id, lower(name), kind)
  where user_id is not null;

create unique index categories_system_name_kind_uq
  on public.categories (lower(name), kind)
  where user_id is null;

create index categories_user_id_idx on public.categories (user_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

alter table public.categories enable row level security;

revoke all on public.categories from anon, authenticated;
grant select, insert, update, delete on public.categories to authenticated;

create policy categories_select_own_or_system
  on public.categories
  for select
  to authenticated
  using (user_id = auth.uid() or user_id is null);

create policy categories_insert_own
  on public.categories
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy categories_update_own
  on public.categories
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy categories_delete_own
  on public.categories
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Catalogo de instituicoes financeiras (bancos, fintechs, carteiras).
-- Referencia publica somente leitura para a aplicacao; escrita reservada
-- a manutencao administrativa (service_role, fora do RLS de authenticated).
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  brand_color text,
  icon text not null default 'landmark',
  kind text not null default 'bank',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  constraint institutions_kind_check check (kind in ('bank', 'fintech', 'wallet', 'other')),
  constraint institutions_name_uq unique (name)
);

comment on table public.institutions is 'Catalogo local de instituicoes para selecao na criacao de contas e cartoes. Sem integracao bancaria automatica.';

alter table public.institutions enable row level security;

revoke all on public.institutions from anon, authenticated;
grant select on public.institutions to authenticated;

create policy institutions_select_all
  on public.institutions
  for select
  to authenticated
  using (true);

-- Contas do usuario (banco, carteira, investimento manual). O saldo atual
-- e sempre derivado dos lancamentos efetivados a partir de initial_balance,
-- calculado por funcao (ver migration 03), nunca armazenado aqui, para
-- impedir divergencia entre saldo exibido e historico real.
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  institution_id uuid references public.institutions (id) on delete set null,
  name text not null,
  kind text not null,
  color text not null default '#46533A',
  icon text not null default 'wallet',
  initial_balance_cents bigint not null default 0,
  initial_balance_date date not null default (timezone('America/Sao_Paulo', now()))::date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_kind_check check (kind in ('checking', 'savings', 'wallet', 'investment', 'other')),
  constraint accounts_name_len check (char_length(name) between 1 and 60)
);

comment on table public.accounts is 'Contas bancarias, carteiras e posicoes de investimento informadas manualmente pelo usuario.';

create index accounts_user_id_idx on public.accounts (user_id) where archived_at is null;

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

alter table public.accounts enable row level security;

revoke all on public.accounts from anon, authenticated;
grant select, insert, update, delete on public.accounts to authenticated;

create policy accounts_select_own
  on public.accounts
  for select
  to authenticated
  using (user_id = auth.uid());

create policy accounts_insert_own
  on public.accounts
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy accounts_update_own
  on public.accounts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy accounts_delete_own
  on public.accounts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Seed de referencia: categorias padrao do sistema (user_id nulo) e um
-- catalogo minimo de instituicoes. Nao sao dados ficticios de usuario,
-- sao dados de catalogo reutilizados por todas as contas.
insert into public.categories (name, kind, icon, color) values
  ('Salario', 'income', 'wallet', '#46533A'),
  ('Freelance', 'income', 'briefcase', '#46533A'),
  ('Outras receitas', 'income', 'plus-circle', '#46533A'),
  ('Moradia', 'expense', 'home', '#B9674F'),
  ('Contas e utilidades', 'expense', 'plug', '#B9674F'),
  ('Mercado', 'expense', 'shopping-cart', '#B9674F'),
  ('Transporte', 'expense', 'car', '#B9674F'),
  ('Saude', 'expense', 'heart-pulse', '#B9674F'),
  ('Educacao', 'expense', 'book-open', '#B9674F'),
  ('Lazer', 'expense', 'ticket', '#B9674F'),
  ('Assinaturas', 'expense', 'repeat', '#B9674F'),
  ('Cuidado pessoal', 'expense', 'sparkles', '#B9674F'),
  ('Pets', 'expense', 'paw-print', '#B9674F'),
  ('Presentes e doacoes', 'expense', 'gift', '#B9674F'),
  ('Impostos e taxas', 'expense', 'landmark', '#B9674F'),
  ('Outras despesas', 'expense', 'more-horizontal', '#B9674F')
on conflict do nothing;

insert into public.institutions (name, short_name, kind, icon, sort_order) values
  ('Carteira', 'Carteira', 'wallet', 'wallet', 1),
  ('Nubank', 'Nubank', 'fintech', 'landmark', 10),
  ('Banco do Brasil', 'BB', 'bank', 'landmark', 11),
  ('Caixa Economica Federal', 'Caixa', 'bank', 'landmark', 12),
  ('Bradesco', 'Bradesco', 'bank', 'landmark', 13),
  ('Itau', 'Itau', 'bank', 'landmark', 14),
  ('Santander', 'Santander', 'bank', 'landmark', 15),
  ('Inter', 'Inter', 'fintech', 'landmark', 16),
  ('C6 Bank', 'C6', 'fintech', 'landmark', 17),
  ('PicPay', 'PicPay', 'wallet', 'landmark', 18),
  ('Mercado Pago', 'Mercado Pago', 'wallet', 'landmark', 19),
  ('Outra instituicao', 'Outra', 'other', 'landmark', 100)
on conflict do nothing;

commit;

-- Verificacao sugerida apos aplicar:
--   select kind, count(*) from public.categories where user_id is null group by kind;
--   select count(*) from public.institutions;
