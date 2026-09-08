-- Setiva: 06 - orcamentos, metas, contribuicoes e dividas
-- Pre-condicao: migrations 01 a 05 aplicadas.

begin;

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

commit;

-- Verificacao sugerida apos aplicar:
--   select * from public.budget_progress;
--   select public.add_goal_contribution(meta_id, 5000, current_date, 'reserved');
--   select public.register_debt_payment(divida_id, conta_id, 20000, current_date);
