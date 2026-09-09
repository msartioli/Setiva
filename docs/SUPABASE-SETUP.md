# Setiva: aplicação manual das migrations no Supabase

Este guia explica exatamente o que colar no SQL Editor do seu projeto Supabase, em que ordem, e como verificar que cada passo funcionou. As migrations ficam em `supabase/migrations/`. Nenhuma foi aplicada automaticamente: o ambiente de implementação não tem acesso autenticado ao seu projeto Supabase, só leu a URL e a publishable key do `.env.local` (nunca a senha do banco ou a service role key).

## Antes de começar: descubra se o banco já tem algo

Não presuma que o projeto está vazio. Rode esta consulta somente leitura primeiro, no SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

- Se a lista vier vazia, siga direto para "Aplicação em projeto vazio".
- Se já existir alguma tabela com nomes iguais aos usados aqui (`profiles`, `accounts`, `transactions`, `cards`, etc.), pare e me avise antes de continuar. Não vou lhe indicar `IF NOT EXISTS` como solução porque isso esconderia uma divergência real de schema — o certo é comparar as definições antes de decidir o que fazer.

## Ordem exata dos arquivos

Aplique um arquivo inteiro por vez, na SQL Editor, exatamente nesta ordem. Cada arquivo é uma transação (`begin` / `commit`): ou aplica tudo, ou nada.

1. `20260908100001_profiles.sql` — perfis e preferências, vinculados a `auth.users`.
2. `20260908100002_categories_institutions_accounts.sql` — categorias padrão, catálogo de instituições e contas.
3. `20260908100003_transactions_transfers.sql` — lançamentos, transferências atômicas e saldo realizado.
4. `20260908100004_cards_purchases_invoices_payments.sql` — cartões, compras parceladas, faturas e pagamentos.
5. `20260908100005_recurrences.sql` — recorrências e geração idempotente de ocorrências.
6. `20260908100006_budgets_goals_debts.sql` — orçamentos, metas, aportes e dívidas.
7. `20260908100007_onboarding_notifications_help.sql` — estado do onboarding, notificações e preferências.
8. `20260908100008_imports_audit_consents.sql` — importação de CSV, auditoria mínima e consentimentos.
9. `20260908100009_storage_indexes_views.sql` — buckets de Storage, políticas e views de apoio.
10. `20260908100010_category_accents.sql` — corrige acentuação dos nomes de catálogo (categorias e instituições) que a migration 2 gravou sem acento.

### Aplicação em projeto vazio

Cole o conteúdo de cada arquivo, na ordem acima, um de cada vez, e clique em Run. Depois de cada um, rode a consulta de verificação listada ao final do próprio arquivo (comentário `-- Verificacao sugerida`).

### Se um arquivo falhar no meio

Não rode tudo de novo. Descubra qual foi o último arquivo aplicado com sucesso:

```sql
select tablename from pg_tables where schemaname = 'public' order by tablename;
```

Compare com a lista de tabelas que cada migration cria (o nome do arquivo indica o assunto). Corrija a causa do erro (normalmente algo já existente com o mesmo nome, ou uma migration anterior não aplicada) e rode apenas o arquivo que falhou, a partir do zero — como cada arquivo é transacional, um erro no meio já desfez o que aquele arquivo tinha feito.

## O que esperar de cada arquivo

Toda tabela privada nasce com `row level security` ativado e políticas de leitura/escrita por `auth.uid()` já na mesma transação — não existe uma janela em que a tabela fica exposta antes da proteção. Tabelas de referência pública (`categories` com `user_id` nulo, `institutions`) permitem leitura para qualquer usuário autenticado e nenhuma escrita direta. Operações que precisam ser atômicas (transferência entre contas, compra parcelada, pagamento de fatura, aporte de meta, pagamento de dívida) são funções `security definer` que validam a propriedade das contas/categorias envolvidas antes de escrever, e são idempotentes quando você passa uma `idempotency_key`.

## Configuração de Auth

No painel do projeto, em Authentication → URL Configuration:

- **Site URL** (desenvolvimento): `http://localhost:3000`
- **Redirect URLs** adicionais: `http://localhost:3000/**`

Mantenha "Confirm email" habilitado (Authentication → Providers → Email). O app implementa estas rotas, que precisam bater com o que o Supabase redireciona:

- `/auth/callback` — troca o código do link de confirmação/recuperação por sessão.
- `/auth/confirmar` — tela de "confira seu email".
- `/auth/recuperar-senha` — solicitação de recuperação.
- `/auth/redefinir-senha` — definição de nova senha após o link.

Antes de liberar cadastro público em produção, configure também: domínio de produção nas Redirect URLs, um provedor SMTP próprio (Authentication → Providers → SMTP; o serviço padrão do Supabase tem limite de envio e não é indicado para produção) e o Site URL de produção. Login funcionar em `localhost` não significa que o envio de email está validado para o seu domínio final.

## Configuração de Storage

A migration 9 cria os buckets `avatars` e `goal-covers` como privados, com limite de tamanho (2 MB e 4 MB) e tipos aceitos (`image/png`, `image/jpeg`, `image/webp`). Se você já tiver buckets com esses nomes e configuração diferente, a migration não sobrescreve (`on conflict do nothing`) — revise manualmente.

## Seeds de desenvolvimento

Não há seed de dados fictícios de usuário nesta pasta. `supabase/migrations/20260908100002_...sql` insere apenas dados de catálogo (categorias padrão e instituições), que não são "gastos" de ninguém. Se quiser popular uma conta de teste com lançamentos fictícios para testar a interface, isso deve ficar em `supabase/seeds/`, fora do caminho de produção, e nunca ser aplicado à sua conta real.

## Sobre histórico da CLI do Supabase

Aplicar estes arquivos manualmente pelo SQL Editor não registra automaticamente o histórico que a Supabase CLI usa (`supabase migration list` / tabela `supabase_migrations.schema_migrations`). Isso é esperado: você pediu o fluxo manual porque não quer que eu rode `db push` ou reset no seu banco remoto. Se no futuro quiser adotar a CLI para novas migrations, o primeiro passo é reconciliar o histórico (`supabase migration repair`) comparando o schema real com os arquivos já aplicados, antes de qualquer `db push` — não faça isso às cegas, porque marcar uma migration como aplicada sem ela realmente estar pode mascarar uma divergência.

## Depois de aplicar

Me avise quais arquivos você aplicou (idealmente todos, na ordem). Vou continuar o trabalho de qualquer forma enquanto isso não acontece, mas só vou afirmar "persistência real validada" depois que você confirmar a aplicação e eu conseguir testar contra o projeto de verdade.
