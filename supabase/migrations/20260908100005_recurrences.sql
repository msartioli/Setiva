-- Setiva: 05 - recorrencias e geracao de ocorrencias
-- Pre-condicao: migrations 01 a 04 aplicadas.

begin;

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

commit;

-- Verificacao sugerida apos aplicar:
--   select public.materialize_recurrence_occurrences((current_date + interval '3 months')::date);
--   select due_date, amount_cents, status from public.recurrence_occurrences order by due_date;
--   -- chamar materialize de novo com o mesmo horizonte e confirmar que o count nao aumenta
