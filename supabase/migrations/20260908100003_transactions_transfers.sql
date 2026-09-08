-- Setiva: 03 - lancamentos, transferencias e integridade de saldos
-- Pre-condicao: migrations 01 e 02 aplicadas.

begin;

create type public.transaction_type as enum ('income', 'expense', 'transfer');
create type public.transaction_status as enum ('pending', 'completed');
create type public.transfer_direction as enum ('out', 'in');

-- Transferencias sao a unidade logica; cada uma gera duas linhas em
-- transactions (uma 'out' e uma 'in'), sempre pela funcao abaixo, nunca
-- por insert direto do cliente, para garantir atomicidade e paridade.
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

comment on table public.transactions is 'Lancamentos: receitas, despesas e as duas pernas de cada transferencia. Compras de cartao entram por competencia via migration 04.';

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

-- Cria as duas pernas de uma transferencia em uma unica transacao SQL,
-- valida propriedade das contas e é idempotente por (user, idempotency_key).
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

-- Edita os dois lados de uma transferencia existente numa unica transacao.
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

-- Remove a transferencia e as duas pernas (cascade) de uma vez.
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

commit;

-- Verificacao sugerida apos aplicar (como usuario autenticado real, nao service_role):
--   select public.create_transfer(conta_origem, conta_destino, 10000, current_date, 'teste');
--   select * from public.account_realized_balances;
--   -- confirmar que o total das duas contas envolvidas nao mudou (patrimonio conservado)
