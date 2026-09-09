-- Setiva: schema completo consolidado (migrations 01 a 10 em um unico arquivo)
-- Gerado em 2026-09-09 a partir de supabase/migrations/2026090810000{1..9}_*.sql
-- e 20260908100010_category_accents.sql, para colar de uma vez no SQL Editor
-- de um projeto Supabase VAZIO. Os 10 arquivos individuais em
-- supabase/migrations/ continuam sendo a fonte de verdade e o historico real
-- do projeto; este arquivo e uma conveniencia de aplicacao, nao substitui
-- aqueles para futuras alteracoes incrementais.
--
-- Unica diferenca de conteudo em relacao a rodar os 10 arquivos em sequencia:
-- a migration 10 existia so para corrigir a acentuacao de nomes de catalogo
-- que a migration 02 tinha gravado sem acento (Salario, Saude, Educacao,
-- Presentes e doacoes, Caixa Economica Federal, Itau). Aqui, por ser uma
-- aplicacao do zero, esses nomes ja entram corretos no INSERT da secao 02
-- (ver comentario "correcao da migration 10 aplicada aqui" abaixo), sem
-- precisar do UPDATE de patch logo em seguida. Nenhuma outra linha de
-- schema, RLS, funcao ou policy foi alterada: e o mesmo conteudo dos 10
-- arquivos originais, so reorganizado em um unico arquivo com uma unica
-- transacao (tudo aplica ou nada aplica, sem deixar o schema pela metade
-- se algo falhar no meio).
--
-- Antes de rodar: confirme que o projeto esta vazio (nenhuma tabela custom
-- em public ainda), com esta consulta:
--   select table_name from information_schema.tables where table_schema = 'public' order by table_name;
-- Se ja existir alguma tabela com nome igual as criadas aqui (profiles,
-- accounts, transactions, cards etc.), PARE e resolva a divergencia antes
-- de continuar. Nao aplique isto por cima de um schema que ja tenha essas
-- tabelas.

begin;

-- ============================================================
-- 01 - profiles e preferencias
-- ============================================================

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
-- (service role, aplicacao) que remove o usuario em auth.users, o que
-- arrasta o perfil pelo on delete cascade.

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

-- ============================================================
-- 02 - categorias, instituicoes e contas
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
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
-- catalogo minimo de instituicoes. Nao sao dados ficticios de usuario, sao
-- dados de catalogo reutilizados por todas as contas. Nomes ja acentuados
-- corretamente (correcao da migration 10 aplicada aqui na origem, ja que
-- esta e uma aplicacao do zero: Salario -> Salário, Saude -> Saúde,
-- Educacao -> Educação, Presentes e doacoes -> Presentes e doações,
-- Caixa Economica Federal -> Caixa Econômica Federal, Itau -> Itaú).
insert into public.categories (name, kind, icon, color) values
  ('Salário', 'income', 'wallet', '#46533A'),
  ('Freelance', 'income', 'briefcase', '#46533A'),
  ('Outras receitas', 'income', 'plus-circle', '#46533A'),
  ('Moradia', 'expense', 'home', '#B9674F'),
  ('Contas e utilidades', 'expense', 'plug', '#B9674F'),
  ('Mercado', 'expense', 'shopping-cart', '#B9674F'),
  ('Transporte', 'expense', 'car', '#B9674F'),
  ('Saúde', 'expense', 'heart-pulse', '#B9674F'),
  ('Educação', 'expense', 'book-open', '#B9674F'),
  ('Lazer', 'expense', 'ticket', '#B9674F'),
  ('Assinaturas', 'expense', 'repeat', '#B9674F'),
  ('Cuidado pessoal', 'expense', 'sparkles', '#B9674F'),
  ('Pets', 'expense', 'paw-print', '#B9674F'),
  ('Presentes e doações', 'expense', 'gift', '#B9674F'),
  ('Impostos e taxas', 'expense', 'landmark', '#B9674F'),
  ('Outras despesas', 'expense', 'more-horizontal', '#B9674F')
on conflict do nothing;

insert into public.institutions (name, short_name, kind, icon, sort_order) values
  ('Carteira', 'Carteira', 'wallet', 'wallet', 1),
  ('Nubank', 'Nubank', 'fintech', 'landmark', 10),
  ('Banco do Brasil', 'BB', 'bank', 'landmark', 11),
  ('Caixa Econômica Federal', 'Caixa', 'bank', 'landmark', 12),
  ('Bradesco', 'Bradesco', 'bank', 'landmark', 13),
  ('Itaú', 'Itaú', 'bank', 'landmark', 14),
  ('Santander', 'Santander', 'bank', 'landmark', 15),
  ('Inter', 'Inter', 'fintech', 'landmark', 16),
  ('C6 Bank', 'C6', 'fintech', 'landmark', 17),
  ('PicPay', 'PicPay', 'wallet', 'landmark', 18),
  ('Mercado Pago', 'Mercado Pago', 'wallet', 'landmark', 19),
  ('Outra instituicao', 'Outra', 'other', 'landmark', 100)
on conflict do nothing;

-- ============================================================
-- 03 - lancamentos, transferencias e integridade de saldos
-- ============================================================

create type public.transaction_type as enum ('income', 'expense', 'transfer');
create type public.transaction_status as enum ('pending', 'completed');
create type public.transfer_direction as enum ('out', 'in');

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete restrict,
  to_account_id uuid not null references public.accounts (id) on delete restrict,
  amount_cents bigint not null,
  transfer_date date not null,
  description text not null default '',
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_amount_positive check (amount_cents > 0),
  constraint transfers_accounts_diff check (from_account_id <> to_account_id),
  constraint transfers_description_len check (char_length(description) <= 200)
);

create unique index transfers_idempotency_uq
  on public.transfers (user_id, idempotency_key)
  where idempotency_key is not null;

create trigger transfers_set_updated_at
  before update on public.transfers
  for each row
  execute function public.set_updated_at();

alter table public.transfers enable row level security;

revoke all on public.transfers from anon, authenticated;
grant select on public.transfers to authenticated;

create policy transfers_select_own
  on public.transfers
  for select
  to authenticated
  using (user_id = auth.uid());

-- Sem policy de insert/update/delete: toda escrita passa pelas funcoes
-- security definer abaixo, que validam propriedade das duas contas.

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  status public.transaction_status not null default 'completed',
  transfer_id uuid references public.transfers (id) on delete cascade,
  transfer_leg public.transfer_direction,
  amount_cents bigint not null,
  description text not null default '',
  competence_date date not null,
  effective_at timestamptz,
  origin text not null default 'manual',
  idempotency_key text,
  card_installment_id uuid,
  recurrence_occurrence_id uuid,
  import_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_amount_positive check (amount_cents > 0),
  constraint transactions_description_len check (char_length(description) <= 200),
  constraint transactions_origin_check check (origin in ('manual', 'transfer', 'card_invoice_payment', 'recurrence', 'import')),
  constraint transactions_transfer_shape check (
    (type = 'transfer' and transfer_id is not null and transfer_leg is not null)
    or (type <> 'transfer' and transfer_id is null and transfer_leg is null)
  ),
  constraint transactions_completed_has_effective check (
    status = 'pending' or effective_at is not null
  )
);

comment on table public.transactions is 'Lancamentos: receitas, despesas e as duas pernas de cada transferencia. Compras de cartao entram por competencia via card_installments.';

create index transactions_user_date_idx on public.transactions (user_id, competence_date desc);
create index transactions_account_idx on public.transactions (account_id);
create index transactions_category_idx on public.transactions (category_id);
create index transactions_transfer_idx on public.transactions (transfer_id);
create index transactions_status_idx on public.transactions (user_id, status);

create unique index transactions_idempotency_uq
  on public.transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- Garante que conta e categoria referenciadas pertencem ao mesmo usuario
-- do lancamento. Uma FK sozinha nao evita "conta de outro usuario com o
-- id certo"; este trigger fecha essa lacuna em toda escrita.
create or replace function public.validate_transaction_owner()
returns trigger
language plpgsql
as $$
declare
  v_account_user uuid;
  v_category_user uuid;
begin
  select user_id into v_account_user from public.accounts where id = new.account_id;
  if v_account_user is null or v_account_user <> new.user_id then
    raise exception 'Conta % nao pertence ao usuario %', new.account_id, new.user_id;
  end if;

  if new.category_id is not null then
    select user_id into v_category_user from public.categories where id = new.category_id;
    if v_category_user is not null and v_category_user <> new.user_id then
      raise exception 'Categoria % nao pertence ao usuario %', new.category_id, new.user_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_validate_owner
  before insert or update on public.transactions
  for each row
  execute function public.validate_transaction_owner();

alter table public.transactions enable row level security;

revoke all on public.transactions from anon, authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

create policy transactions_select_own
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Cliente autenticado só cria/edita/apaga lancamentos comuns
-- (income/expense) diretamente. Pernas de transferencia (type=transfer)
-- só existem via public.create_transfer / edit_transfer / delete_transfer.
create policy transactions_insert_own_non_transfer
  on public.transactions
  for insert
  to authenticated
  with check (user_id = auth.uid() and type <> 'transfer');

create policy transactions_update_own_non_transfer
  on public.transactions
  for update
  to authenticated
  using (user_id = auth.uid() and type <> 'transfer')
  with check (user_id = auth.uid() and type <> 'transfer');

create policy transactions_delete_own_non_transfer
  on public.transactions
  for delete
  to authenticated
  using (user_id = auth.uid() and type <> 'transfer');

-- Saldo realizado por conta: saldo inicial + movimentos efetivados a
-- partir da data de corte. Nunca conta lancamentos anteriores a
-- initial_balance_date, evitando dupla contagem do saldo de abertura.
create view public.account_realized_balances
  with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  a.initial_balance_cents
    + coalesce(sum(
        case
          when t.type = 'income' then t.amount_cents
          when t.type = 'expense' then -t.amount_cents
          when t.type = 'transfer' and t.transfer_leg = 'out' then -t.amount_cents
          when t.type = 'transfer' and t.transfer_leg = 'in' then t.amount_cents
          else 0
        end
      ), 0) as balance_cents
from public.accounts a
left join public.transactions t
  on t.account_id = a.id
 and t.status = 'completed'
 and t.effective_at is not null
 and t.effective_at::date >= a.initial_balance_date
where a.user_id = auth.uid()
group by a.id, a.user_id, a.initial_balance_cents;

comment on view public.account_realized_balances is 'Saldo realizado por conta, derivado dos lancamentos efetivados. Nunca armazenar saldo como coluna solta.';

grant select on public.account_realized_balances to authenticated;

create or replace function public.create_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount_cents bigint,
  p_transfer_date date,
  p_description text default '',
  p_idempotency_key text default null,
  p_status public.transaction_status default 'completed'
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_transfer public.transfers;
  v_existing public.transfers;
  v_effective timestamptz;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor da transferencia deve ser positivo';
  end if;

  if p_from_account_id = p_to_account_id then
    raise exception 'Conta de origem e destino devem ser diferentes';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing from public.transfers
      where user_id = v_user and idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;

  if not exists (select 1 from public.accounts where id = p_from_account_id and user_id = v_user) then
    raise exception 'Conta de origem nao pertence ao usuario';
  end if;

  if not exists (select 1 from public.accounts where id = p_to_account_id and user_id = v_user) then
    raise exception 'Conta de destino nao pertence ao usuario';
  end if;

  v_effective := case when p_status = 'completed' then now() else null end;

  insert into public.transfers (user_id, from_account_id, to_account_id, amount_cents, transfer_date, description, idempotency_key)
  values (v_user, p_from_account_id, p_to_account_id, p_amount_cents, p_transfer_date, coalesce(p_description, ''), p_idempotency_key)
  returning * into v_transfer;

  insert into public.transactions (user_id, account_id, type, status, transfer_id, transfer_leg, amount_cents, description, competence_date, effective_at, origin)
  values (v_user, p_from_account_id, 'transfer', p_status, v_transfer.id, 'out', p_amount_cents, coalesce(p_description, ''), p_transfer_date, v_effective, 'transfer');

  insert into public.transactions (user_id, account_id, type, status, transfer_id, transfer_leg, amount_cents, description, competence_date, effective_at, origin)
  values (v_user, p_to_account_id, 'transfer', p_status, v_transfer.id, 'in', p_amount_cents, coalesce(p_description, ''), p_transfer_date, v_effective, 'transfer');

  return v_transfer;
end;
$$;

revoke all on function public.create_transfer(uuid, uuid, bigint, date, text, text, public.transaction_status) from public;
grant execute on function public.create_transfer(uuid, uuid, bigint, date, text, text, public.transaction_status) to authenticated;

create or replace function public.edit_transfer(
  p_transfer_id uuid,
  p_amount_cents bigint,
  p_transfer_date date,
  p_description text default ''
)
returns public.transfers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_transfer public.transfers;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_transfer from public.transfers where id = p_transfer_id and user_id = v_user;
  if not found then
    raise exception 'Transferencia nao encontrada';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor da transferencia deve ser positivo';
  end if;

  update public.transfers
    set amount_cents = p_amount_cents,
        transfer_date = p_transfer_date,
        description = coalesce(p_description, '')
    where id = p_transfer_id
    returning * into v_transfer;

  update public.transactions
    set amount_cents = p_amount_cents,
        competence_date = p_transfer_date,
        description = coalesce(p_description, '')
    where transfer_id = p_transfer_id;

  return v_transfer;
end;
$$;

revoke all on function public.edit_transfer(uuid, bigint, date, text) from public;
grant execute on function public.edit_transfer(uuid, bigint, date, text) to authenticated;

create or replace function public.delete_transfer(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  delete from public.transfers where id = p_transfer_id and user_id = v_user;
  if not found then
    raise exception 'Transferencia nao encontrada';
  end if;
end;
$$;

revoke all on function public.delete_transfer(uuid) from public;
grant execute on function public.delete_transfer(uuid) to authenticated;

-- ============================================================
-- 04 - cartoes, compras parceladas, faturas e pagamentos
-- ============================================================

-- Ajusta um dia (1-31) ao ultimo dia valido do mes informado. Reaproveitada
-- para fechamento/vencimento de cartao e para ocorrencias de recorrencia
-- em dias 29, 30 ou 31, preservando o dia ancora.
create or replace function public.clamp_day_to_month(p_year int, p_month int, p_day int)
returns date
language plpgsql
immutable
as $$
declare
  v_last_day int;
begin
  v_last_day := extract(day from (make_date(p_year, p_month, 1) + interval '1 month - 1 day'))::int;
  return make_date(p_year, p_month, least(p_day, v_last_day));
end;
$$;

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  default_payment_account_id uuid references public.accounts (id) on delete set null,
  institution_id uuid references public.institutions (id) on delete set null,
  name text not null,
  color text not null default '#202A25',
  limit_cents bigint not null default 0,
  closing_day smallint not null,
  due_day smallint not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_closing_day_check check (closing_day between 1 and 31),
  constraint cards_due_day_check check (due_day between 1 and 31),
  constraint cards_limit_nonnegative check (limit_cents >= 0),
  constraint cards_name_len check (char_length(name) between 1 and 60)
);

create index cards_user_id_idx on public.cards (user_id) where archived_at is null;

create trigger cards_set_updated_at
  before update on public.cards
  for each row
  execute function public.set_updated_at();

create or replace function public.validate_card_owner()
returns trigger
language plpgsql
as $$
declare
  v_account_user uuid;
begin
  if new.default_payment_account_id is not null then
    select user_id into v_account_user from public.accounts where id = new.default_payment_account_id;
    if v_account_user is null or v_account_user <> new.user_id then
      raise exception 'Conta de pagamento padrao nao pertence ao usuario';
    end if;
  end if;
  return new;
end;
$$;

create trigger cards_validate_owner
  before insert or update on public.cards
  for each row
  execute function public.validate_card_owner();

alter table public.cards enable row level security;
revoke all on public.cards from anon, authenticated;
grant select, insert, update, delete on public.cards to authenticated;

create policy cards_select_own on public.cards for select to authenticated using (user_id = auth.uid());
create policy cards_insert_own on public.cards for insert to authenticated with check (user_id = auth.uid());
create policy cards_update_own on public.cards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cards_delete_own on public.cards for delete to authenticated using (user_id = auth.uid());

create table public.card_invoices (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reference_month date not null,
  closing_date date not null,
  due_date date not null,
  status text not null default 'open',
  paid_amount_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_invoices_status_check check (status in ('open', 'closed', 'paid', 'partially_paid')),
  constraint card_invoices_reference_is_first_day check (reference_month = date_trunc('month', reference_month)::date),
  constraint card_invoices_unique unique (card_id, reference_month)
);

create index card_invoices_user_idx on public.card_invoices (user_id, reference_month desc);

create trigger card_invoices_set_updated_at
  before update on public.card_invoices
  for each row
  execute function public.set_updated_at();

alter table public.card_invoices enable row level security;
revoke all on public.card_invoices from anon, authenticated;
grant select on public.card_invoices to authenticated;

create policy card_invoices_select_own on public.card_invoices for select to authenticated using (user_id = auth.uid());
-- Sem insert/update/delete direto: faturas nascem e mudam de status somente
-- pelas funcoes abaixo, que garantem calculo consistente de fechamento/vencimento.

create table public.card_purchases (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  description text not null default '',
  total_amount_cents bigint not null,
  installments_count smallint not null default 1,
  purchase_date date not null,
  idempotency_key text,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_purchases_amount_positive check (total_amount_cents > 0),
  constraint card_purchases_installments_check check (installments_count between 1 and 48),
  constraint card_purchases_description_len check (char_length(description) <= 200)
);

create unique index card_purchases_idempotency_uq
  on public.card_purchases (user_id, idempotency_key)
  where idempotency_key is not null;

create index card_purchases_card_idx on public.card_purchases (card_id);

create trigger card_purchases_set_updated_at
  before update on public.card_purchases
  for each row
  execute function public.set_updated_at();

alter table public.card_purchases enable row level security;
revoke all on public.card_purchases from anon, authenticated;
grant select on public.card_purchases to authenticated;

create policy card_purchases_select_own on public.card_purchases for select to authenticated using (user_id = auth.uid());
-- Insert/update somente pelas funcoes security definer (garantem parcelamento correto).

create table public.card_installments (
  id uuid primary key default gen_random_uuid(),
  card_purchase_id uuid not null references public.card_purchases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_id uuid not null references public.card_invoices (id) on delete restrict,
  installment_number smallint not null,
  amount_cents bigint not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint card_installments_amount_positive check (amount_cents > 0),
  constraint card_installments_status_check check (status in ('open', 'paid', 'refunded', 'canceled')),
  constraint card_installments_unique unique (card_purchase_id, installment_number)
);

create index card_installments_invoice_idx on public.card_installments (invoice_id);
create index card_installments_user_idx on public.card_installments (user_id);

create trigger card_installments_set_updated_at
  before update on public.card_installments
  for each row
  execute function public.set_updated_at();

alter table public.card_installments enable row level security;
revoke all on public.card_installments from anon, authenticated;
grant select on public.card_installments to authenticated;

create policy card_installments_select_own on public.card_installments for select to authenticated using (user_id = auth.uid());

-- Agora que card_installments existe, liga o vinculo opcional criado em
-- transactions para permitir rastrear compras avulsas se um dia forem
-- representadas tambem como transacao (nao usado no fluxo padrao, mas
-- mantem integridade referencial caso a aplicacao precise).
alter table public.transactions
  add constraint transactions_card_installment_fk
  foreign key (card_installment_id) references public.card_installments (id) on delete set null;

create table public.card_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.card_invoices (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  amount_cents bigint not null,
  paid_at date not null,
  transaction_id uuid references public.transactions (id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint card_payments_amount_positive check (amount_cents > 0)
);

create unique index card_payments_idempotency_uq
  on public.card_payments (user_id, idempotency_key)
  where idempotency_key is not null;

create index card_payments_invoice_idx on public.card_payments (invoice_id);

alter table public.card_payments enable row level security;
revoke all on public.card_payments from anon, authenticated;
grant select on public.card_payments to authenticated;

create policy card_payments_select_own on public.card_payments for select to authenticated using (user_id = auth.uid());

-- Total (liquido de estornos/cancelamentos) e status derivado de uma fatura.
create view public.card_invoice_totals
  with (security_invoker = true) as
select
  ci.id as invoice_id,
  ci.card_id,
  ci.user_id,
  ci.reference_month,
  ci.closing_date,
  ci.due_date,
  ci.status,
  ci.paid_amount_cents,
  coalesce(sum(ins.amount_cents) filter (where ins.status not in ('refunded', 'canceled')), 0) as total_cents
from public.card_invoices ci
left join public.card_installments ins on ins.invoice_id = ci.id
where ci.user_id = auth.uid()
group by ci.id;

grant select on public.card_invoice_totals to authenticated;

-- Garante a existencia da fatura de um mes de referencia para um cartao,
-- calculando fechamento e vencimento com o dia ajustado ao mes (dia 31 em
-- fevereiro vira o ultimo dia de fevereiro). Idempotente.
create or replace function public.ensure_card_invoice(p_card_id uuid, p_reference_month date)
returns public.card_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_card public.cards;
  v_ref date := date_trunc('month', p_reference_month)::date;
  v_invoice public.card_invoices;
  v_due_year int;
  v_due_month int;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_card from public.cards where id = p_card_id and user_id = v_user;
  if not found then
    raise exception 'Cartao nao encontrado';
  end if;

  select * into v_invoice from public.card_invoices where card_id = p_card_id and reference_month = v_ref;
  if found then
    return v_invoice;
  end if;

  -- Convencao: vencimento cai no mes seguinte ao fechamento quando o dia
  -- de vencimento configurado for menor que o dia de fechamento (padrao de
  -- mercado). Caso contrario, vencimento no mesmo mes do fechamento.
  if v_card.due_day < v_card.closing_day then
    v_due_year := extract(year from v_ref + interval '1 month')::int;
    v_due_month := extract(month from v_ref + interval '1 month')::int;
  else
    v_due_year := extract(year from v_ref)::int;
    v_due_month := extract(month from v_ref)::int;
  end if;

  insert into public.card_invoices (card_id, user_id, reference_month, closing_date, due_date, status)
  values (
    p_card_id,
    v_user,
    v_ref,
    public.clamp_day_to_month(extract(year from v_ref)::int, extract(month from v_ref)::int, v_card.closing_day),
    public.clamp_day_to_month(v_due_year, v_due_month, v_card.due_day),
    'open'
  )
  returning * into v_invoice;

  return v_invoice;
end;
$$;

revoke all on function public.ensure_card_invoice(uuid, date) from public;
grant execute on function public.ensure_card_invoice(uuid, date) to authenticated;

-- Registra uma compra (a vista ou parcelada), distribuindo os centavos sem
-- perda (resto distribuido nas primeiras parcelas) e associando cada
-- parcela a fatura correta a partir da data de compra e do fechamento.
-- Compra no cartao nunca gera linha em transactions nem afeta saldo
-- bancario: so vira caixa quando a fatura e paga (public.pay_card_invoice).
create or replace function public.create_card_purchase(
  p_card_id uuid,
  p_category_id uuid,
  p_description text,
  p_total_amount_cents bigint,
  p_installments_count smallint,
  p_purchase_date date,
  p_idempotency_key text default null
)
returns public.card_purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_card public.cards;
  v_purchase public.card_purchases;
  v_existing public.card_purchases;
  v_base bigint;
  v_remainder bigint;
  v_amount bigint;
  v_ref_month date;
  v_invoice public.card_invoices;
  i smallint;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing from public.card_purchases where user_id = v_user and idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;

  select * into v_card from public.cards where id = p_card_id and user_id = v_user;
  if not found then
    raise exception 'Cartao nao encontrado';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and (user_id = v_user or user_id is null)
  ) then
    raise exception 'Categoria nao pertence ao usuario';
  end if;

  if p_total_amount_cents is null or p_total_amount_cents <= 0 then
    raise exception 'Valor da compra deve ser positivo';
  end if;

  if p_installments_count is null or p_installments_count < 1 or p_installments_count > 48 then
    raise exception 'Numero de parcelas invalido';
  end if;

  insert into public.card_purchases (card_id, user_id, category_id, description, total_amount_cents, installments_count, purchase_date, idempotency_key)
  values (p_card_id, v_user, p_category_id, coalesce(p_description, ''), p_total_amount_cents, p_installments_count, p_purchase_date, p_idempotency_key)
  returning * into v_purchase;

  v_base := p_total_amount_cents / p_installments_count;
  v_remainder := p_total_amount_cents - (v_base * p_installments_count);

  -- Fatura da primeira parcela: se a compra ocorreu no dia do fechamento ou
  -- antes, entra na fatura do proprio mes; depois do fechamento, mes seguinte.
  if extract(day from p_purchase_date) <= v_card.closing_day then
    v_ref_month := date_trunc('month', p_purchase_date)::date;
  else
    v_ref_month := date_trunc('month', p_purchase_date + interval '1 month')::date;
  end if;

  for i in 1..p_installments_count loop
    v_amount := v_base + (case when i <= v_remainder then 1 else 0 end);
    v_invoice := public.ensure_card_invoice(p_card_id, v_ref_month);

    insert into public.card_installments (card_purchase_id, user_id, invoice_id, installment_number, amount_cents, status)
    values (v_purchase.id, v_user, v_invoice.id, i, v_amount, 'open');

    v_ref_month := date_trunc('month', v_ref_month + interval '1 month')::date;
  end loop;

  return v_purchase;
end;
$$;

revoke all on function public.create_card_purchase(uuid, uuid, text, bigint, smallint, date, text) from public;
grant execute on function public.create_card_purchase(uuid, uuid, text, bigint, smallint, date, text) to authenticated;

-- Cancela uma compra inteira, somente se nenhuma parcela ja foi paga.
create or replace function public.cancel_card_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if not exists (select 1 from public.card_purchases where id = p_purchase_id and user_id = v_user) then
    raise exception 'Compra nao encontrada';
  end if;

  if exists (select 1 from public.card_installments where card_purchase_id = p_purchase_id and status = 'paid') then
    raise exception 'Nao e possivel cancelar: ha parcelas ja pagas. Estorne a parcela especifica.';
  end if;

  update public.card_installments set status = 'canceled' where card_purchase_id = p_purchase_id and status = 'open';
  update public.card_purchases set canceled_at = now() where id = p_purchase_id;
end;
$$;

revoke all on function public.cancel_card_purchase(uuid) from public;
grant execute on function public.cancel_card_purchase(uuid) to authenticated;

-- Estorna uma parcela especifica (ex: devolucao parcial de uma compra).
create or replace function public.refund_card_installment(p_installment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select status into v_status from public.card_installments where id = p_installment_id and user_id = v_user;
  if not found then
    raise exception 'Parcela nao encontrada';
  end if;

  if v_status = 'paid' then
    raise exception 'Parcela ja paga nao pode ser estornada por aqui; registre um estorno na fatura paga';
  end if;

  update public.card_installments set status = 'refunded' where id = p_installment_id;
end;
$$;

revoke all on function public.refund_card_installment(uuid) from public;
grant execute on function public.refund_card_installment(uuid) to authenticated;

-- Paga uma fatura (total ou parcial). Gera uma unica transacao de caixa
-- (expense, origin card_invoice_payment, sem categoria) que reduz o saldo
-- da conta escolhida. Relatorios por competencia usam card_installments
-- (data da compra), nunca esta transacao, evitando contar a despesa duas
-- vezes. Idempotente por (usuario, idempotency_key).
create or replace function public.pay_card_invoice(
  p_invoice_id uuid,
  p_account_id uuid,
  p_amount_cents bigint,
  p_payment_date date,
  p_idempotency_key text default null
)
returns public.card_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invoice public.card_invoices;
  v_card public.cards;
  v_total bigint;
  v_existing_payment public.card_payments;
  v_transaction_id uuid;
  v_new_paid bigint;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing_payment from public.card_payments where user_id = v_user and idempotency_key = p_idempotency_key;
    if found then
      select * into v_invoice from public.card_invoices where id = v_existing_payment.invoice_id;
      return v_invoice;
    end if;
  end if;

  select * into v_invoice from public.card_invoices where id = p_invoice_id and user_id = v_user;
  if not found then
    raise exception 'Fatura nao encontrada';
  end if;

  select * into v_card from public.cards where id = v_invoice.card_id;

  if not exists (select 1 from public.accounts where id = p_account_id and user_id = v_user) then
    raise exception 'Conta de pagamento nao pertence ao usuario';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor do pagamento deve ser positivo';
  end if;

  select coalesce(sum(amount_cents) filter (where status not in ('refunded', 'canceled')), 0)
    into v_total
    from public.card_installments where invoice_id = p_invoice_id;

  insert into public.transactions (user_id, account_id, category_id, type, status, amount_cents, description, competence_date, effective_at, origin)
  values (
    v_user, p_account_id, null, 'expense', 'completed', p_amount_cents,
    'Pagamento fatura ' || v_card.name || ' - ' || to_char(v_invoice.reference_month, 'MM/YYYY'),
    p_payment_date, now(), 'card_invoice_payment'
  )
  returning id into v_transaction_id;

  insert into public.card_payments (invoice_id, user_id, account_id, amount_cents, paid_at, transaction_id, idempotency_key)
  values (p_invoice_id, v_user, p_account_id, p_amount_cents, p_payment_date, v_transaction_id, p_idempotency_key);

  v_new_paid := v_invoice.paid_amount_cents + p_amount_cents;

  update public.card_invoices
    set paid_amount_cents = v_new_paid,
        status = case when v_new_paid >= v_total then 'paid' else 'partially_paid' end
    where id = p_invoice_id
    returning * into v_invoice;

  update public.card_installments
    set status = 'paid'
    where invoice_id = p_invoice_id and status = 'open' and v_invoice.status = 'paid';

  return v_invoice;
end;
$$;

revoke all on function public.pay_card_invoice(uuid, uuid, bigint, date, text) from public;
grant execute on function public.pay_card_invoice(uuid, uuid, bigint, date, text) to authenticated;

-- ============================================================
-- 05 - recorrencias e geracao de ocorrencias
-- ============================================================

create table public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  kind text not null,
  description text not null,
  amount_cents bigint not null,
  frequency text not null default 'monthly',
  anchor_day smallint,
  weekday smallint,
  start_date date not null,
  end_date date,
  auto_effectuate boolean not null default false,
  -- true = valor estimado/incerto (ex: renda variavel de freelance). O
  -- cenario confirmado da margem do mes nunca soma ocorrencias com
  -- is_estimate = true; so entram no cenario esperado por escolha explicita.
  is_estimate boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurrences_kind_check check (kind in ('income', 'expense')),
  constraint recurrences_frequency_check check (frequency in ('monthly', 'weekly', 'yearly')),
  constraint recurrences_amount_positive check (amount_cents > 0),
  constraint recurrences_description_len check (char_length(description) between 1 and 120),
  constraint recurrences_anchor_day_check check (anchor_day is null or anchor_day between 1 and 31),
  constraint recurrences_weekday_check check (weekday is null or weekday between 0 and 6),
  constraint recurrences_end_after_start check (end_date is null or end_date >= start_date)
);

comment on table public.recurrences is 'Definicao de receitas, contas e assinaturas recorrentes. Nao gera pagamento por si so, apenas ocorrencias previstas.';

create index recurrences_user_idx on public.recurrences (user_id) where archived_at is null;

create trigger recurrences_set_updated_at
  before update on public.recurrences
  for each row
  execute function public.set_updated_at();

create or replace function public.validate_recurrence_owner()
returns trigger
language plpgsql
as $$
declare
  v_account_user uuid;
  v_category_user uuid;
begin
  if new.account_id is not null then
    select user_id into v_account_user from public.accounts where id = new.account_id;
    if v_account_user is null or v_account_user <> new.user_id then
      raise exception 'Conta nao pertence ao usuario';
    end if;
  end if;
  if new.category_id is not null then
    select user_id into v_category_user from public.categories where id = new.category_id;
    if v_category_user is not null and v_category_user <> new.user_id then
      raise exception 'Categoria nao pertence ao usuario';
    end if;
  end if;
  if new.frequency = 'monthly' and new.anchor_day is null then
    raise exception 'Recorrencia mensal exige anchor_day';
  end if;
  if new.frequency = 'weekly' and new.weekday is null then
    raise exception 'Recorrencia semanal exige weekday';
  end if;
  return new;
end;
$$;

create trigger recurrences_validate_owner
  before insert or update on public.recurrences
  for each row
  execute function public.validate_recurrence_owner();

alter table public.recurrences enable row level security;
revoke all on public.recurrences from anon, authenticated;
grant select, insert, update, delete on public.recurrences to authenticated;

create policy recurrences_select_own on public.recurrences for select to authenticated using (user_id = auth.uid());
create policy recurrences_insert_own on public.recurrences for insert to authenticated with check (user_id = auth.uid());
create policy recurrences_update_own on public.recurrences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recurrences_delete_own on public.recurrences for delete to authenticated using (user_id = auth.uid());

-- Ocorrencia prevista de uma recorrencia num periodo. Nasce como 'pending'
-- e so vira lancamento real por acao explicita (ou automatica, se
-- auto_effectuate estiver ligado), nunca como pagamento fictício.
create table public.recurrence_occurrences (
  id uuid primary key default gen_random_uuid(),
  recurrence_id uuid not null references public.recurrences (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  due_date date not null,
  amount_cents bigint not null,
  status text not null default 'pending',
  is_estimate boolean not null default false,
  transaction_id uuid references public.transactions (id) on delete set null,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurrence_occurrences_status_check check (status in ('pending', 'completed', 'skipped')),
  constraint recurrence_occurrences_amount_positive check (amount_cents > 0),
  constraint recurrence_occurrences_unique unique (recurrence_id, due_date)
);

create index recurrence_occurrences_user_due_idx on public.recurrence_occurrences (user_id, due_date);

create trigger recurrence_occurrences_set_updated_at
  before update on public.recurrence_occurrences
  for each row
  execute function public.set_updated_at();

alter table public.recurrence_occurrences enable row level security;
revoke all on public.recurrence_occurrences from anon, authenticated;
grant select on public.recurrence_occurrences to authenticated;

create policy recurrence_occurrences_select_own on public.recurrence_occurrences for select to authenticated using (user_id = auth.uid());
-- Escrita somente pelas funcoes abaixo (materializacao e efetivacao).

alter table public.transactions
  add constraint transactions_recurrence_occurrence_fk
  foreign key (recurrence_occurrence_id) references public.recurrence_occurrences (id) on delete set null;

-- Calcula a proxima data de vencimento de uma recorrencia mensal/anual a
-- partir de um mes de referencia, ajustando dias 29/30/31 ao ultimo dia
-- valido do mes, sem perder o dia ancora original nos meses seguintes.
create or replace function public.recurrence_due_date_for_month(p_recurrence public.recurrences, p_reference_month date)
returns date
language plpgsql
immutable
as $$
declare
  v_year int := extract(year from p_reference_month)::int;
  v_month int := extract(month from p_reference_month)::int;
begin
  if p_recurrence.frequency = 'yearly' then
    if v_month <> extract(month from p_recurrence.start_date)::int then
      return null;
    end if;
    return public.clamp_day_to_month(v_year, v_month, extract(day from p_recurrence.start_date)::int);
  elsif p_recurrence.frequency = 'monthly' then
    return public.clamp_day_to_month(v_year, v_month, p_recurrence.anchor_day);
  else
    return null;
  end if;
end;
$$;

-- Materializa (cria se ainda nao existir) as ocorrencias previstas de todas
-- as recorrencias ativas do usuario dentro de um horizonte de datas.
-- Idempotente: chamar de novo no mesmo periodo nao duplica ocorrencias
-- (unique (recurrence_id, due_date) protege mesmo em corrida).
create or replace function public.materialize_recurrence_occurrences(p_horizon_end date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_recurrence public.recurrences;
  v_month date;
  v_due date;
  v_created integer := 0;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  for v_recurrence in
    select * from public.recurrences
    where user_id = v_user and archived_at is null and start_date <= p_horizon_end
  loop
    if v_recurrence.frequency = 'weekly' then
      v_due := v_recurrence.start_date + ((v_recurrence.weekday - extract(dow from v_recurrence.start_date)::int + 7) % 7);
      while v_due <= p_horizon_end loop
        if v_due >= v_recurrence.start_date and (v_recurrence.end_date is null or v_due <= v_recurrence.end_date) then
          insert into public.recurrence_occurrences (recurrence_id, user_id, due_date, amount_cents, status, is_estimate)
          values (v_recurrence.id, v_user, v_due, v_recurrence.amount_cents, 'pending', v_recurrence.is_estimate)
          on conflict (recurrence_id, due_date) do nothing;
          if found then
            v_created := v_created + 1;
          end if;
        end if;
        v_due := v_due + 7;
      end loop;
    else
      v_month := date_trunc('month', v_recurrence.start_date)::date;
      while v_month <= p_horizon_end loop
        v_due := public.recurrence_due_date_for_month(v_recurrence, v_month);
        if v_due is not null and v_due >= v_recurrence.start_date and v_due <= p_horizon_end
           and (v_recurrence.end_date is null or v_due <= v_recurrence.end_date) then
          insert into public.recurrence_occurrences (recurrence_id, user_id, due_date, amount_cents, status, is_estimate)
          values (v_recurrence.id, v_user, v_due, v_recurrence.amount_cents, 'pending', v_recurrence.is_estimate)
          on conflict (recurrence_id, due_date) do nothing;
          if found then
            v_created := v_created + 1;
          end if;
        end if;
        v_month := date_trunc('month', v_month + interval '1 month')::date;
      end loop;
    end if;
  end loop;

  return v_created;
end;
$$;

revoke all on function public.materialize_recurrence_occurrences(date) from public;
grant execute on function public.materialize_recurrence_occurrences(date) to authenticated;

-- Efetiva uma ocorrencia especifica: cria o lancamento real (transactions)
-- e marca a ocorrencia como completed. So roda em pending; repetir a
-- chamada na mesma ocorrencia ja completed é rejeitado, evitando duplicar.
create or replace function public.effectuate_recurrence_occurrence(
  p_occurrence_id uuid,
  p_account_id uuid,
  p_amount_cents bigint default null,
  p_effective_date date default null
)
returns public.recurrence_occurrences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_occurrence public.recurrence_occurrences;
  v_recurrence public.recurrences;
  v_transaction_id uuid;
  v_amount bigint;
  v_effective date := coalesce(p_effective_date, current_date);
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_occurrence from public.recurrence_occurrences where id = p_occurrence_id and user_id = v_user;
  if not found then
    raise exception 'Ocorrencia nao encontrada';
  end if;

  if v_occurrence.status <> 'pending' then
    raise exception 'Ocorrencia ja foi efetivada ou dispensada';
  end if;

  select * into v_recurrence from public.recurrences where id = v_occurrence.recurrence_id;

  if not exists (select 1 from public.accounts where id = p_account_id and user_id = v_user) then
    raise exception 'Conta nao pertence ao usuario';
  end if;

  v_amount := coalesce(p_amount_cents, v_occurrence.amount_cents);

  insert into public.transactions (user_id, account_id, category_id, type, status, amount_cents, description, competence_date, effective_at, origin, recurrence_occurrence_id)
  values (v_user, p_account_id, v_recurrence.category_id, v_recurrence.kind, 'completed', v_amount, v_recurrence.description, v_occurrence.due_date, v_effective::timestamptz, 'recurrence', p_occurrence_id)
  returning id into v_transaction_id;

  update public.recurrence_occurrences
    set status = 'completed', transaction_id = v_transaction_id
    where id = p_occurrence_id
    returning * into v_occurrence;

  return v_occurrence;
end;
$$;

revoke all on function public.effectuate_recurrence_occurrence(uuid, uuid, bigint, date) from public;
grant execute on function public.effectuate_recurrence_occurrence(uuid, uuid, bigint, date) to authenticated;

create or replace function public.skip_recurrence_occurrence(p_occurrence_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  update public.recurrence_occurrences
    set status = 'skipped', skipped_at = now()
    where id = p_occurrence_id and user_id = v_user and status = 'pending';

  if not found then
    raise exception 'Ocorrencia nao encontrada ou ja tratada';
  end if;
end;
$$;

revoke all on function public.skip_recurrence_occurrence(uuid) from public;
grant execute on function public.skip_recurrence_occurrence(uuid) to authenticated;

-- ============================================================
-- 06 - orcamentos, metas, contribuicoes e dividas
-- ============================================================

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  period_month date not null,
  limit_cents bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_limit_positive check (limit_cents > 0),
  constraint budgets_period_first_day check (period_month = date_trunc('month', period_month)::date),
  constraint budgets_unique unique (user_id, category_id, period_month)
);

comment on table public.budgets is 'Limite planejado por categoria de despesa e mes. O realizado e calculado a partir de transactions + card_installments, nunca duplicado.';

create index budgets_user_period_idx on public.budgets (user_id, period_month desc);

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row
  execute function public.set_updated_at();

create or replace function public.validate_budget_owner()
returns trigger
language plpgsql
as $$
declare
  v_category_user uuid;
  v_category_kind text;
begin
  select user_id, kind into v_category_user, v_category_kind from public.categories where id = new.category_id;
  if v_category_kind is null then
    raise exception 'Categoria nao encontrada';
  end if;
  if v_category_kind <> 'expense' then
    raise exception 'Orcamento so pode ser definido para categoria de despesa';
  end if;
  if v_category_user is not null and v_category_user <> new.user_id then
    raise exception 'Categoria nao pertence ao usuario';
  end if;
  return new;
end;
$$;

create trigger budgets_validate_owner
  before insert or update on public.budgets
  for each row
  execute function public.validate_budget_owner();

alter table public.budgets enable row level security;
revoke all on public.budgets from anon, authenticated;
grant select, insert, update, delete on public.budgets to authenticated;

create policy budgets_select_own on public.budgets for select to authenticated using (user_id = auth.uid());
create policy budgets_insert_own on public.budgets for insert to authenticated with check (user_id = auth.uid());
create policy budgets_update_own on public.budgets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy budgets_delete_own on public.budgets for delete to authenticated using (user_id = auth.uid());

-- Realizado por orcamento: soma lancamentos avulsos da categoria (por
-- competencia) mais parcelas de cartao da mesma categoria cuja compra caiu
-- no mes, sem contar o pagamento da fatura (origin card_invoice_payment
-- nunca tem categoria e por isso ja fica fora desta soma).
create view public.budget_progress
  with (security_invoker = true) as
select
  b.id as budget_id,
  b.user_id,
  b.category_id,
  b.period_month,
  b.limit_cents,
  coalesce(t.spent, 0) + coalesce(c.spent, 0) as spent_cents
from public.budgets b
left join lateral (
  select sum(amount_cents) as spent
  from public.transactions
  where category_id = b.category_id
    and user_id = b.user_id
    and type = 'expense'
    and origin <> 'card_invoice_payment'
    and date_trunc('month', competence_date)::date = b.period_month
) t on true
left join lateral (
  select sum(ins.amount_cents) as spent
  from public.card_installments ins
  join public.card_purchases cp on cp.id = ins.card_purchase_id
  where cp.category_id = b.category_id
    and ins.user_id = b.user_id
    and ins.status not in ('refunded', 'canceled')
    and date_trunc('month', cp.purchase_date)::date = b.period_month
) c on true
where b.user_id = auth.uid();

grant select on public.budget_progress to authenticated;

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  linked_account_id uuid references public.accounts (id) on delete set null,
  name text not null,
  target_cents bigint not null,
  target_date date,
  reserved_cents bigint not null default 0,
  cover_image_url text,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_target_positive check (target_cents > 0),
  constraint goals_reserved_nonnegative check (reserved_cents >= 0),
  constraint goals_status_check check (status in ('active', 'completed', 'abandoned')),
  constraint goals_name_len check (char_length(name) between 1 and 80)
);

comment on table public.goals is 'Metas de reserva. reserved_cents e intencao/progresso, nao um saldo novo: vincular a uma conta nao duplica patrimonio.';

create index goals_user_idx on public.goals (user_id) where archived_at is null;

create trigger goals_set_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

create or replace function public.validate_goal_owner()
returns trigger
language plpgsql
as $$
declare
  v_account_user uuid;
begin
  if new.linked_account_id is not null then
    select user_id into v_account_user from public.accounts where id = new.linked_account_id;
    if v_account_user is null or v_account_user <> new.user_id then
      raise exception 'Conta vinculada nao pertence ao usuario';
    end if;
  end if;
  return new;
end;
$$;

create trigger goals_validate_owner
  before insert or update on public.goals
  for each row
  execute function public.validate_goal_owner();

alter table public.goals enable row level security;
revoke all on public.goals from anon, authenticated;
grant select, insert, update, delete on public.goals to authenticated;

create policy goals_select_own on public.goals for select to authenticated using (user_id = auth.uid());
create policy goals_insert_own on public.goals for insert to authenticated with check (user_id = auth.uid());
create policy goals_update_own on public.goals for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_delete_own on public.goals for delete to authenticated using (user_id = auth.uid());

-- Aporte de meta. kind = 'reserved' apenas marca intencao (sem mover
-- dinheiro); kind = 'transfer' move caixa de verdade para linked_account
-- via public.create_transfer, mantendo o total do patrimonio igual.
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents bigint not null,
  contribution_date date not null,
  kind text not null default 'reserved',
  transfer_id uuid references public.transfers (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint goal_contributions_amount_positive check (amount_cents > 0),
  constraint goal_contributions_kind_check check (kind in ('reserved', 'transfer'))
);

create index goal_contributions_goal_idx on public.goal_contributions (goal_id);

alter table public.goal_contributions enable row level security;
revoke all on public.goal_contributions from anon, authenticated;
grant select on public.goal_contributions to authenticated;

create policy goal_contributions_select_own on public.goal_contributions for select to authenticated using (user_id = auth.uid());
-- Escrita somente pelas funcoes abaixo.

create or replace function public.add_goal_contribution(
  p_goal_id uuid,
  p_amount_cents bigint,
  p_contribution_date date,
  p_kind text default 'reserved',
  p_from_account_id uuid default null,
  p_idempotency_key text default null
)
returns public.goal_contributions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_goal public.goals;
  v_transfer public.transfers;
  v_contribution public.goal_contributions;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_goal from public.goals where id = p_goal_id and user_id = v_user;
  if not found then
    raise exception 'Meta nao encontrada';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor do aporte deve ser positivo';
  end if;

  if p_kind = 'transfer' then
    if v_goal.linked_account_id is null then
      raise exception 'Meta sem conta vinculada nao aceita aporte por transferencia';
    end if;
    if p_from_account_id is null then
      raise exception 'Informe a conta de origem do aporte';
    end if;
    v_transfer := public.create_transfer(p_from_account_id, v_goal.linked_account_id, p_amount_cents, p_contribution_date, 'Aporte meta: ' || v_goal.name, p_idempotency_key);
  end if;

  insert into public.goal_contributions (goal_id, user_id, amount_cents, contribution_date, kind, transfer_id)
  values (p_goal_id, v_user, p_amount_cents, p_contribution_date, p_kind, v_transfer.id)
  returning * into v_contribution;

  update public.goals
    set reserved_cents = reserved_cents + p_amount_cents,
        status = case when reserved_cents + p_amount_cents >= target_cents then 'completed' else status end
    where id = p_goal_id;

  return v_contribution;
end;
$$;

revoke all on function public.add_goal_contribution(uuid, bigint, date, text, uuid, text) from public;
grant execute on function public.add_goal_contribution(uuid, bigint, date, text, uuid, text) to authenticated;

create or replace function public.remove_goal_contribution(p_contribution_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_contribution public.goal_contributions;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_contribution from public.goal_contributions where id = p_contribution_id and user_id = v_user;
  if not found then
    raise exception 'Aporte nao encontrado';
  end if;

  delete from public.goal_contributions where id = p_contribution_id;

  update public.goals
    set reserved_cents = greatest(0, reserved_cents - v_contribution.amount_cents),
        status = case when status = 'completed' then 'active' else status end
    where id = v_contribution.goal_id;

  if v_contribution.transfer_id is not null then
    perform public.delete_transfer(v_contribution.transfer_id);
  end if;
end;
$$;

revoke all on function public.remove_goal_contribution(uuid) from public;
grant execute on function public.remove_goal_contribution(uuid) to authenticated;

-- Dividas: principal, encargos informados (nunca projetados) e pagamentos.
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  principal_cents bigint not null,
  current_balance_cents bigint not null,
  known_charges_cents bigint not null default 0,
  installments_total smallint,
  installments_paid smallint not null default 0,
  next_due_date date,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_principal_positive check (principal_cents > 0),
  constraint debts_balance_nonnegative check (current_balance_cents >= 0),
  constraint debts_charges_nonnegative check (known_charges_cents >= 0),
  constraint debts_status_check check (status in ('active', 'paid_off', 'renegotiated')),
  constraint debts_name_len check (char_length(name) between 1 and 80)
);

comment on table public.debts is 'Dividas e parcelamentos externos ao cartao. Ausencia de taxa informada nao autoriza projetar juros.';

create index debts_user_idx on public.debts (user_id) where archived_at is null;

create trigger debts_set_updated_at
  before update on public.debts
  for each row
  execute function public.set_updated_at();

alter table public.debts enable row level security;
revoke all on public.debts from anon, authenticated;
grant select, insert, update, delete on public.debts to authenticated;

create policy debts_select_own on public.debts for select to authenticated using (user_id = auth.uid());
create policy debts_insert_own on public.debts for insert to authenticated with check (user_id = auth.uid());
create policy debts_update_own on public.debts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy debts_delete_own on public.debts for delete to authenticated using (user_id = auth.uid());

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  amount_cents bigint not null,
  payment_date date not null,
  transaction_id uuid references public.transactions (id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint debt_payments_amount_positive check (amount_cents > 0)
);

create unique index debt_payments_idempotency_uq
  on public.debt_payments (user_id, idempotency_key)
  where idempotency_key is not null;

alter table public.debt_payments enable row level security;
revoke all on public.debt_payments from anon, authenticated;
grant select on public.debt_payments to authenticated;

create policy debt_payments_select_own on public.debt_payments for select to authenticated using (user_id = auth.uid());

create or replace function public.register_debt_payment(
  p_debt_id uuid,
  p_account_id uuid,
  p_amount_cents bigint,
  p_payment_date date,
  p_idempotency_key text default null
)
returns public.debts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_debt public.debts;
  v_existing public.debt_payments;
  v_transaction_id uuid;
  v_new_balance bigint;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing from public.debt_payments where user_id = v_user and idempotency_key = p_idempotency_key;
    if found then
      select * into v_debt from public.debts where id = v_existing.debt_id;
      return v_debt;
    end if;
  end if;

  select * into v_debt from public.debts where id = p_debt_id and user_id = v_user;
  if not found then
    raise exception 'Divida nao encontrada';
  end if;

  if not exists (select 1 from public.accounts where id = p_account_id and user_id = v_user) then
    raise exception 'Conta nao pertence ao usuario';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Valor do pagamento deve ser positivo';
  end if;

  insert into public.transactions (user_id, account_id, category_id, type, status, amount_cents, description, competence_date, effective_at, origin)
  values (v_user, p_account_id, null, 'expense', 'completed', p_amount_cents, 'Pagamento divida: ' || v_debt.name, p_payment_date, now(), 'manual')
  returning id into v_transaction_id;

  insert into public.debt_payments (debt_id, user_id, account_id, amount_cents, payment_date, transaction_id, idempotency_key)
  values (p_debt_id, v_user, p_account_id, p_amount_cents, p_payment_date, v_transaction_id, p_idempotency_key);

  v_new_balance := greatest(0, v_debt.current_balance_cents - p_amount_cents);

  update public.debts
    set current_balance_cents = v_new_balance,
        installments_paid = installments_paid + 1,
        status = case when v_new_balance = 0 then 'paid_off' else status end
    where id = p_debt_id
    returning * into v_debt;

  return v_debt;
end;
$$;

revoke all on function public.register_debt_payment(uuid, uuid, bigint, date, text) from public;
grant execute on function public.register_debt_payment(uuid, uuid, bigint, date, text) to authenticated;

-- ============================================================
-- 07 - onboarding, notificacoes e preferencias de ajuda
-- ============================================================

alter table public.profiles
  add column guided_tour_completed_at timestamptz;

-- Estado do onboarding progressivo. Cada etapa grava dados reais nas
-- tabelas correspondentes (accounts, cards, recurrences, budgets, goals)
-- assim que respondida; esta tabela guarda apenas o passo atual e um
-- rascunho leve do formulario em edicao, para retomar sem perder digitacao.
create table public.onboarding_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  current_step smallint not null default 1,
  draft jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_state_step_check check (current_step between 1 and 12)
);

create trigger onboarding_state_set_updated_at
  before update on public.onboarding_state
  for each row
  execute function public.set_updated_at();

alter table public.onboarding_state enable row level security;
revoke all on public.onboarding_state from anon, authenticated;
grant select, insert, update on public.onboarding_state to authenticated;

create policy onboarding_state_select_own on public.onboarding_state for select to authenticated using (user_id = auth.uid());
create policy onboarding_state_insert_own on public.onboarding_state for insert to authenticated with check (user_id = auth.uid());
create policy onboarding_state_update_own on public.onboarding_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Marca o onboarding como concluido de forma idempotente: repetir a
-- chamada nao duplica nada porque nao cria registros financeiros, apenas
-- fecha o estado (os registros ja nasceram etapa a etapa nas tabelas reais).
create or replace function public.complete_onboarding()
returns public.onboarding_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_state public.onboarding_state;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  insert into public.onboarding_state (user_id, current_step, completed_at)
  values (v_user, 12, now())
  on conflict (user_id) do update
    set current_step = 12,
        completed_at = coalesce(public.onboarding_state.completed_at, now())
  returning * into v_state;

  update public.profiles
    set onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where user_id = v_user;

  return v_state;
end;
$$;

revoke all on function public.complete_onboarding() from public;
grant execute on function public.complete_onboarding() to authenticated;

create table public.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  due_soon_enabled boolean not null default true,
  due_soon_days_before smallint not null default 3,
  budget_limit_enabled boolean not null default true,
  goal_milestone_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_days_check check (due_soon_days_before between 0 and 14)
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant select, insert, update on public.notification_preferences to authenticated;

create policy notification_preferences_select_own on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy notification_preferences_insert_own on public.notification_preferences for insert to authenticated with check (user_id = auth.uid());
create policy notification_preferences_update_own on public.notification_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cria preferencias de notificacao e onboarding_state com os defaults
-- assim que o perfil nasce, para a aplicacao nunca operar sobre uma linha
-- inexistente.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id) values (new.user_id) on conflict do nothing;
  insert into public.onboarding_state (user_id) values (new.user_id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.handle_new_profile();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('due_soon', 'budget_limit', 'goal_milestone', 'invoice_closed', 'system')),
  constraint notifications_title_len check (char_length(title) between 1 and 140)
);

create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

-- Indice unico "cheio" (nao parcial): permite que upsert com ON CONFLICT
-- em (user_id, type, related_entity_type, related_entity_id) funcione — um
-- indice parcial exigiria repetir o WHERE no ON CONFLICT, que o PostgREST
-- nao faz, e a chamada falharia com 42P10. NULL em related_entity_id nunca
-- conflita entre si de qualquer forma (semantica padrao de indice unico),
-- entao nao precisamos do filtro parcial para o caso de notificacoes sem
-- entidade relacionada.
create unique index notifications_dedupe_uq
  on public.notifications (user_id, type, related_entity_type, related_entity_id);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_insert_own on public.notifications for insert to authenticated with check (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete_own on public.notifications for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- 08 - importacoes, auditoria minima e consentimentos versionados
-- ============================================================

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  source_filename text,
  status text not null default 'previewing',
  column_mapping jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  reverted_at timestamptz,
  constraint import_batches_status_check check (status in ('previewing', 'confirmed', 'reverted'))
);

create index import_batches_user_idx on public.import_batches (user_id, created_at desc);

alter table public.import_batches enable row level security;
revoke all on public.import_batches from anon, authenticated;
grant select, insert, update on public.import_batches to authenticated;

create policy import_batches_select_own on public.import_batches for select to authenticated using (user_id = auth.uid());
create policy import_batches_insert_own on public.import_batches for insert to authenticated with check (user_id = auth.uid());
create policy import_batches_update_own on public.import_batches for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.transactions
  add constraint transactions_import_batch_fk
  foreign key (import_batch_id) references public.import_batches (id) on delete set null;

alter table public.transactions
  add column import_duplicate_of uuid references public.transactions (id) on delete set null,
  add column import_duplicate_reviewed boolean not null default true;

comment on column public.transactions.import_duplicate_of is 'Preenchido pela importacao quando o lote encontra um lancamento existente com data e valor coincidentes. Revisao humana confirma antes de qualquer exclusao.';

-- Reverte um lote de importacao inteiro, apagando somente os lancamentos
-- criados por ele. Bloqueia a reversao (em vez de apagar em cascata) se
-- algum desses lancamentos ja foi usado por outra operacao (fatura, meta,
-- divida ou recorrencia), porque nesse caso apagar corromperia outro fluxo.
create or replace function public.reverse_import_batch(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_batch public.import_batches;
  v_dependent_count integer;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_batch from public.import_batches where id = p_batch_id and user_id = v_user;
  if not found then
    raise exception 'Lote de importacao nao encontrado';
  end if;

  if v_batch.status = 'reverted' then
    return;
  end if;

  select count(*) into v_dependent_count
  from public.transactions t
  where t.import_batch_id = p_batch_id
    and (
      exists (select 1 from public.recurrence_occurrences ro where ro.transaction_id = t.id)
      or exists (select 1 from public.card_payments cp where cp.transaction_id = t.id)
      or exists (select 1 from public.debt_payments dp where dp.transaction_id = t.id)
    );

  if v_dependent_count > 0 then
    raise exception 'Nao e possivel reverter: % lancamento(s) deste lote ja foram usados por outro fluxo (fatura, divida ou recorrencia). Ajuste manualmente.', v_dependent_count;
  end if;

  delete from public.transactions where import_batch_id = p_batch_id;

  update public.import_batches set status = 'reverted', reverted_at = now() where id = p_batch_id;
end;
$$;

revoke all on function public.reverse_import_batch(uuid) from public;
grant execute on function public.reverse_import_batch(uuid) to authenticated;

-- Auditoria minima, append-only. Escrita somente via log_audit_event
-- (security definer), nunca por insert direto do cliente.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_idx on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy audit_log_select_own on public.audit_log for select to authenticated using (user_id = auth.uid());

create or replace function public.log_audit_event(p_action text, p_entity_type text, p_entity_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;

revoke all on function public.log_audit_event(text, text, uuid, jsonb) from public;
grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;

-- Consentimentos versionados (termos e privacidade). Append-only: aceitar
-- uma nova versao insere uma linha nova, nunca sobrescreve a anterior.
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  document_type text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  constraint consent_records_type_check check (document_type in ('terms', 'privacy')),
  constraint consent_records_unique unique (user_id, document_type, version)
);

alter table public.consent_records enable row level security;
revoke all on public.consent_records from anon, authenticated;
grant select, insert on public.consent_records to authenticated;

create policy consent_records_select_own on public.consent_records for select to authenticated using (user_id = auth.uid());
create policy consent_records_insert_own on public.consent_records for insert to authenticated with check (user_id = auth.uid());

-- ============================================================
-- 09 - storage policies, indices e views adicionais
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('goal-covers', 'goal-covers', false, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Convencao de caminho: {user_id}/{arquivo}. O primeiro segmento do path
-- e comparado a auth.uid() para restringir cada usuario a sua propria pasta.
create policy avatars_select_own
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_insert_own
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_update_own
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_delete_own
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy goal_covers_select_own
  on storage.objects for select
  to authenticated
  using (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy goal_covers_insert_own
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy goal_covers_update_own
  on storage.objects for update
  to authenticated
  using (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy goal_covers_delete_own
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- Feed unificado de compromissos futuros (ocorrencias de recorrencia
-- pendentes + faturas de cartao em aberto), usado pelo calendario e pelo
-- mapa do mes. Mantido como view fina; a composicao do mapa (saldo
-- projetado dia a dia) e calculada na aplicacao a partir destes dados.
create view public.upcoming_commitments
  with (security_invoker = true) as
select
  ro.id,
  'recurrence'::text as source,
  ro.user_id,
  ro.due_date,
  ro.amount_cents,
  r.kind,
  r.description,
  null::uuid as card_id,
  ro.is_estimate
from public.recurrence_occurrences ro
join public.recurrences r on r.id = ro.recurrence_id
where ro.status = 'pending'
  and ro.user_id = auth.uid()
union all
select
  ci.id,
  'card_invoice'::text as source,
  ci.user_id,
  ci.due_date,
  greatest(cit.total_cents - ci.paid_amount_cents, 0),
  'expense'::text,
  'Fatura ' || c.name,
  c.id,
  false as is_estimate
from public.card_invoices ci
join public.cards c on c.id = ci.card_id
join public.card_invoice_totals cit on cit.invoice_id = ci.id
where ci.status in ('open', 'closed', 'partially_paid')
  and ci.user_id = auth.uid()
  and (cit.total_cents - ci.paid_amount_cents) > 0;

grant select on public.upcoming_commitments to authenticated;

-- Indices adicionais para os filtros e listagens mais comuns.
create index transactions_user_type_idx on public.transactions (user_id, type, competence_date desc);
create index card_purchases_purchase_date_idx on public.card_purchases (user_id, purchase_date desc);
create index debts_status_idx on public.debts (user_id, status);
create index goals_status_idx on public.goals (user_id, status);

commit;

-- ============================================================
-- Verificacoes sugeridas apos aplicar (rode cada select separadamente)
-- ============================================================
-- select table_name from information_schema.tables where table_schema = 'public' order by table_name;
--   -- esperado: 24 tabelas (accounts, accounts_realized... nao, essa e view;
--   -- tabelas: accounts, audit_log, budgets, card_installments, card_invoices,
--   -- card_payments, card_purchases, cards, categories, consent_records, debt_payments,
--   -- debts, goal_contributions, goals, import_batches, institutions,
--   -- notification_preferences, notifications, onboarding_state, profiles,
--   -- recurrence_occurrences, recurrences, transactions, transfers)
--
-- select count(*) from pg_policies where schemaname = 'public';
--   -- esperado: 60
--
-- select tablename from pg_tables where schemaname = 'public' and rowsecurity = false;
--   -- esperado: nenhuma linha (RLS ligado em 100% das tabelas de public)
--
-- select kind, count(*) from public.categories where user_id is null group by kind;
--   -- esperado: income = 3, expense = 13
--
-- select name, short_name from public.institutions order by sort_order;
--   -- confira que "Caixa Econômica Federal" e "Itaú" aparecem com acento
--
-- select id, public from storage.buckets where id in ('avatars', 'goal-covers');
--   -- esperado: public = false nas duas linhas
--
-- select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';
--   -- esperado: 8 policies (avatars_* e goal_covers_*, select/insert/update/delete)
--
-- select * from public.upcoming_commitments limit 5;
--   -- deve rodar sem erro mesmo sem nenhum dado ainda (retorna vazio)
