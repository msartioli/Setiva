-- Setiva: 09 - storage policies, indices e views adicionais
-- Pre-condicao: migrations 01 a 08 aplicadas.
-- Esta migration cria buckets de Storage. Se os buckets ja existirem
-- (por exemplo, criados manualmente antes), o insert com on conflict
-- evita erro, mas confira se os limites abaixo continuam corretos.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('goal-covers', 'goal-covers', false, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Convencao de caminho: {user_id}/{arquivo}. O primeiro segmento do path
-- e comparado a auth.uid() para restringir cada usuario a sua propria pasta.
-- storage.objects e uma tabela do sistema, compartilhada pelo projeto
-- inteiro: sobrevive a um reset do schema public, entao "drop policy if
-- exists" antes de recriar evita erro 42710 se esta migration (ou uma
-- tentativa anterior dela) ja tiver rodado antes.
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists goal_covers_select_own on storage.objects;
create policy goal_covers_select_own
  on storage.objects for select
  to authenticated
  using (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists goal_covers_insert_own on storage.objects;
create policy goal_covers_insert_own
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists goal_covers_update_own on storage.objects;
create policy goal_covers_update_own
  on storage.objects for update
  to authenticated
  using (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'goal-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists goal_covers_delete_own on storage.objects;
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

-- Verificacao sugerida apos aplicar:
--   select id, public from storage.buckets where id in ('avatars','goal-covers');
--   select policyname from pg_policies where tablename = 'objects' and schemaname = 'storage';
--   select * from public.upcoming_commitments order by due_date limit 20;
