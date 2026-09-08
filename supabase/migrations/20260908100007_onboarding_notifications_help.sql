-- Setiva: 07 - onboarding, notificacoes e preferencias de ajuda
-- Pre-condicao: migrations 01 a 06 aplicadas.

begin;

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

commit;

-- Verificacao sugerida apos aplicar:
--   select public.complete_onboarding(); -- chamar duas vezes e conferir que completed_at nao muda na segunda
--   select * from public.notification_preferences; select * from public.onboarding_state;
