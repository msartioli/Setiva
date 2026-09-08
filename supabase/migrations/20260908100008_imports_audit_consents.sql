-- Setiva: 08 - importacoes, auditoria minima e consentimentos versionados
-- Pre-condicao: migrations 01 a 07 aplicadas.

begin;

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

commit;

-- Verificacao sugerida apos aplicar:
--   insert into consent_records ... como usuario de teste e conferir select proprio;
--   select public.log_audit_event('test.event', 'system'); select * from public.audit_log;
