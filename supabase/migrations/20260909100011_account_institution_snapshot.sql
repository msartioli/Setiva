-- Setiva: 11 - snapshot de instituicao financeira real nas contas
-- Pre-condicao: migrations 01 a 10 aplicadas (schema_completo.sql cobre as
-- 10 primeiras num arquivo so).
--
-- Contexto: o seletor de banco no onboarding e em "Nova conta" passou a
-- usar o dataset publico de instituicoes financeiras brasileiras (ISPB,
-- COMPE, nome oficial, logo), em vez do catalogo pequeno em
-- public.institutions (que continua existindo e em uso por public.cards,
-- sem mudanca). A identidade da instituicao escolhida numa conta agora e o
-- ISPB, nunca a URL do logo (logo e so apresentacao, pode trocar de fonte
-- no futuro sem quebrar a conta). Aditivo apenas: nenhuma coluna existente
-- e alterada ou removida, accounts.institution_id continua valido para
-- quem ja o usava.

begin;

alter table public.accounts
  add column institution_ispb text,
  add column institution_compe text,
  add column institution_display_name text,
  add column institution_logo_url text,
  -- Prepara o terreno para Open Finance no futuro sem acoplar a conta a
  -- "sempre manual": por enquanto so 'manual' e permitido de verdade.
  add column connection_type text not null default 'manual';

alter table public.accounts
  add constraint accounts_institution_ispb_format
    check (institution_ispb is null or institution_ispb ~ '^[0-9]{8}$'),
  add constraint accounts_connection_type_check
    check (connection_type in ('manual'));

comment on column public.accounts.institution_ispb is 'ISPB (Banco Central) da instituicao escolhida no seletor de bancos. Identidade estavel; nunca usar institution_logo_url para identificar a instituicao.';
comment on column public.accounts.institution_compe is 'Codigo COMPE, quando a instituicao tiver (nem toda instituicao com ISPB tem COMPE, ex: participantes so-Pix).';
comment on column public.accounts.institution_display_name is 'Nome da instituicao no momento em que foi escolhida (snapshot), resolvido no servidor a partir do ISPB — nunca aceito diretamente do cliente.';
comment on column public.accounts.institution_logo_url is 'URL do logo no momento em que foi escolhida (snapshot). Apresentacao apenas; se ficar indisponivel, a interface cai para um avatar generico, a conta continua intacta.';
comment on column public.accounts.connection_type is 'Preparacao para Open Finance futuro. Nesta fase so ''manual'' existe: saldo sempre informado por quem usa o app.';

commit;

-- Verificacao sugerida apos aplicar:
--   select column_name, data_type from information_schema.columns
--     where table_name = 'accounts' and column_name like 'institution_%' or column_name = 'connection_type';
--   select connection_type, count(*) from public.accounts group by connection_type; -- tudo 'manual'
