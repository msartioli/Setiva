-- Setiva: 04 - cartoes, compras parceladas, faturas e pagamentos
-- Pre-condicao: migrations 01, 02 e 03 aplicadas.

begin;

-- Ajusta um dia (1-31) ao ultimo dia valido do mes informado. Reaproveitada
-- para fechamento/vencimento de cartao e para ocorrencias de recorrencia
-- em dias 29, 30 ou 31 (migration 05), preservando o dia ancora.
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
-- transactions (migration 03) para permitir rastrear compras avulsas se
-- um dia forem representadas tambem como transacao (nao usado no fluxo
-- padrao, mas mantem integridade referencial caso a aplicacao precise).
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
-- bancario: elaso vira caixa quando a fatura e paga (public.pay_card_invoice).
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

commit;

-- Verificacao sugerida apos aplicar:
--   select public.create_card_purchase(cartao_id, null, 'compra teste', 10000, 3, current_date);
--   select installment_number, amount_cents from public.card_installments order by installment_number; -- soma deve ser 10000
--   select * from public.card_invoice_totals where card_id = cartao_id;
