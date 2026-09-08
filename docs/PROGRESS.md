# Setiva: progresso

Este arquivo é o estado real do projeto. Antes de continuar em uma nova sessão, leia isto e `CLAUDE.md` em vez de replanejar do zero.

## Decisão de projeto (2026-09-08)

Existe um projeto anterior em `C:\Users\matheus.artioli\Projetos\finance-saas` (também chamado Setiva internamente). O dono do produto confirmou explicitamente: **esse projeto antigo deve ser ignorado, não referenciado, não comparado e não reaproveitado**. Todo o trabalho a partir de agora acontece somente em `C:\Users\matheus.artioli\Documents\Setiva`. O banco definitivo é o projeto Supabase remoto `xjycdaxxwthzukbbbugy.supabase.co` (URL e publishable key em `.env.local`).

## Fase A — Diagnóstico, modelo financeiro, direção visual (concluída)

- Pasta continha apenas `SETIVA-PROMPT-MESTRE.md`, `.env.local` e `imagens/` (logo, símbolo, ícones de app, favicons — sem mascote nem fotos). Nada para preservar além disso.
- Next.js 16.3.4 + React 19.2 + TypeScript + Tailwind v4 escolhidos (versões estáveis atuais). Next 16 renomeou `middleware.ts` para `proxy.ts` e introduziu Cache Components (`cacheComponents` em `next.config.ts`) — **decisão: não habilitar Cache Components**. Todo dado aqui é privado e por usuário, então cada rota autenticada é dinâmica por natureza; o modelo de cache complexo (`use cache`, PPR, Suspense obrigatório por acesso a `cookies()`) não traz benefício e adiciona risco de vazar dado entre usuários se mal aplicado.
- `docs/FINANCIAL-MODEL.md`: fórmulas de saldo realizado, margem confirmada/esperada, linha diária, cartão (competência x caixa), parcelamento, transferência, recorrência, orçamento, meta, dívida.
- Paleta e tipografia definidas e já aplicadas em `src/app/globals.css` / `src/app/layout.tsx`: papel `#F4F1E8`, tinta `#202A25`, oliva `#46533A`, lima `#DCEB9B`, argila `#B9674F`, névoa `#CCDCE3`, com tokens semânticos próprios (positivo/negativo/alerta/info) separados da marca. Tipografia: **Fraunces** (títulos, expressiva) + **Inter** (UI/tabelas, números tabulares) — escolha final, não reabrir.

## Fase B — Schema, RLS, migrations (concluída e validada localmente)

- `supabase/migrations/20260908100001..100009_*.sql`: perfis, categorias/instituições/contas, lançamentos/transferências, cartões/faturas/parcelas, recorrências, orçamentos/metas/dívidas, onboarding/notificações, importação/auditoria/consentimento, storage/views.
- `docs/SUPABASE-SETUP.md`: ordem exata, pré-condições, verificação, configuração de Auth/Storage. **Ainda não aplicadas no projeto remoto** — aguardando o dono aplicar manualmente no SQL Editor (fluxo pedido explicitamente, nada de `db push`/MCP no remoto).
- Validação real feita localmente (Docker + Supabase CLI, projeto local separado do remoto, portas 55321-55329 para não colidir com outros stacks locais da máquina): as 9 migrations aplicam sem erro num Postgres 17 limpo (`npx supabase start` / `db reset`). 24 tabelas, 60 policies, RLS ativo em 100% das tabelas privadas.
- **Bug real encontrado e corrigido**: as colunas `user_id` não tinham `default auth.uid()`, então qualquer insert do cliente sem enviar `user_id` explicitamente era rejeitado pela policy (`new row violates row-level security policy`). Corrigido em todas as tabelas com insert direto do cliente (accounts, categories, transactions, transfers, cards, recurrences, budgets, goals, debts, notifications, import_batches, consent_records).
- `tests/db/invariants.test.ts` (suite de integração, `npm run test:db`, exige `npx supabase start` local): 8 testes passando — perfil criado automaticamente; RLS bloqueia anônimo; RLS bloqueia usuário B lendo conta de A; transferência conserva patrimônio total; usuário B não consegue transferir com conta de A (rejeitado pela função); parcelamento distribui centavos sem perda (3x de R$100 = R$100 exato); materializar recorrência duas vezes não duplica e dia 31 em fevereiro ajusta para 28; concluir onboarding duas vezes é idempotente.
- Ambiente local usado só para validar SQL antes de entregar — é descartável, não é o banco do produto. Credenciais em `.env.test.local` (gitignored) são os defaults públicos de dev local do Supabase CLI, não segredos reais.

## Fase C — Auth, perfil e onboarding (concluída e testada no navegador)

- Rotas: `/cadastro`, `/entrar`, `/auth/callback`, `/auth/confirmar`, `/auth/recuperar-senha`, `/auth/redefinir-senha`, `/onboarding`. `src/proxy.ts` (Next 16 renomeou `middleware.ts`) protege rotas autenticadas e redireciona usuário logado para fora das telas de auth.
- `src/actions/auth.ts`: cadastro, login, logout, recuperação e redefinição de senha, com Zod (`src/lib/validations/auth.ts`) e mensagens de erro traduzidas. Consentimento de termos/privacidade versionado (`src/lib/legal.ts`, `consent_records`) gravado quando a sessão existe de verdade (cadastro imediato ou depois da confirmação por email em `/auth/callback`).
- Onboarding completo (12 passos, `src/components/onboarding/onboarding-flow.tsx` + `src/actions/onboarding.ts`): cada passo grava direto nas tabelas reais (accounts, recurrences, cards + card_purchases via `create_card_purchase`, debts, budgets, goals, profiles) assim que respondido, não num JSON isolado. Pular nunca fabrica dado falso (corrigido: a primeira versão criava conta/renda fictícia no "pular", violando a regra do prompt mestre — agora pular envia lista vazia de verdade). Avatar via DiceBear local (`src/lib/avatars.ts`, 3 famílias CC0, licenças em `docs/ASSETS.md`), sem depender de API externa.
- **Bug real encontrado e corrigido durante o teste no navegador**: PostgREST recusa `update`/`delete` sem filtro explícito na query (`"UPDATE requires a WHERE clause"`), mesmo com RLS correto. Vários `update()` em `src/actions/onboarding.ts` não tinham `.eq("user_id", ...)`. Corrigido em todos; regra registrada em `CLAUDE.md` para não reintroduzir.
- Testado de ponta a ponta com Playwright contra o Supabase local (não o remoto): cadastro → 12 passos do onboarding com dados reais (renda R$ 5.000, conta com saldo R$ 1.200,50, cartão com fatura em aberto de R$ 250, conta mensal Aluguel R$ 1.500) → `complete_onboarding` → redireciona a `/hoje`. Conferido diretamente no Postgres que profiles, accounts, recurrences, cards, card_purchases/card_installments e onboarding_state ficaram com os valores exatos digitados.
- `.env.development.local` (gitignored) aponta o `next dev` para o Supabase local só para eu testar; `.env.local` continua apontando para o projeto remoto.

## Fase D — App shell, Hoje, Movimentações, Visão geral (concluída e testada no navegador)

- `src/proxy.ts` + `src/app/(app)/layout.tsx`: guarda de sessão e de onboarding completo antes de entrar no shell autenticado.
- `src/components/layout/app-shell.tsx`: cápsula de navegação central no desktop (Hoje, Movimentações, Visão geral — "Planejar" entra quando a Fase F tiver conteúdo real, para não virar link morto), navegação inferior de 4 destinos no mobile (3 rotas + botão Novo), menu de perfil com Radix DropdownMenu (a primeira versão só abria no hover, o que não funciona por teclado nem toque — corrigido).
- `/hoje`: mapa do mês real — `src/lib/finance/projection.ts` (`calculateMargin`, `buildDailyBalanceLine`, `findFirstNegativeDay`) alimentado por `account_realized_balances` + `upcoming_commitments` (recorrências pendentes materializadas + faturas em aberto) + reserva protegida de metas vinculadas a conta. Alerta de dia negativo com prioridade sobre o total do mês, gráfico de linha (Recharts) com estados vazios reais.
- `/movimentacoes`: tabela com filtro por tipo/conta/busca (via querystring, sem JS extra), edição e exclusão (transferências excluem as duas pernas via `delete_transfer`).
- `/visao-geral`: contas com saldo real (`account_realized_balances`), criação e arquivamento.
- "Novo lançamento" (`src/components/transactions/new-transaction-dialog.tsx`): abas Despesa/Receita/Transferência, sempre acessível no header (desktop) e na navegação inferior (mobile).
- Testado no navegador com Playwright contra o Supabase local: cadastro → onboarding mínimo → Hoje mostra saldo e margem corretos → lançar despesa reflete em Movimentações e no saldo → criar segunda conta → transferir entre contas conserva o total e atualiza os dois saldos exatamente.

## Fase E (parte 1) — Cartões (concluída e testada no navegador)

- `/visao-geral/cartoes`: cadastro de cartão, nova compra (parcelada, preview de distribuição de centavos no cliente espelhando a função SQL), pagamento de fatura. `SectionTabs` compartilhado entre `/visao-geral` (Contas) e `/visao-geral/cartoes` (Cartões).
- **Bug real encontrado e corrigido**: a consulta ordenava as faturas por `reference_month` decrescente e pegava as 3 primeiras, então "fatura atual" acabava sendo a fatura mais **futura** (ex: pagar a fatura de novembro em vez da de setembro, que era a realmente vencendo). Corrigido para ordenar ascendente e filtrar a partir do mês anterior; conferido que uma compra parcelada em 3x paga a fatura correta mês a mês (setembro → outubro) e o saldo da conta de pagamento é debitado certo.
- Recorrências (backend) ainda sem tela própria — ver próximos passos.

## Fase F — Planejar: Orçamentos, Metas, Recorrências, Dívidas (concluída e testada no navegador)

- `/planejar` (redireciona para `/planejar/orcamentos`) com abas compartilhadas (`PlanejarTabs`): Orçamentos, Metas, Recorrências, Dívidas. "Planejar" agora está na cápsula de navegação (só entrou depois de ter conteúdo real nas 4 abas, para não virar link morto).
- Recorrências: cadastro, lista de próximas ocorrências com "Efetivar" (`effectuate_recurrence_occurrence`) e "Dispensar" (`skip_recurrence_occurrence`), arquivamento.
- Orçamentos: limite por categoria no mês corrente com barra de progresso real (`budget_progress`), criação e remoção.
- Metas: criação (com conta vinculada opcional), aporte por "só marcar progresso" (`reserved`, sem mexer em saldo) ou "transferir dinheiro" (`transfer`, chama `create_transfer` de verdade).
- Dívidas: cadastro e registro de pagamento (`register_debt_payment`), que gera uma saída de caixa real e reduz o saldo devedor.
- Testado no navegador: recorrência criada e efetivada vira lançamento real em Movimentações; orçamento reflete o limite certo; meta com conta vinculada recebe aporte por transferência e os dois saldos batem (Conta A −500, Poupança Meta +500, patrimônio conservado); dívida paga reduz o saldo da conta certa.
- **Ajuste de clareza feito durante o teste**: as duas pernas de uma transferência apareciam em Movimentações sem sinal (nem + nem −), o que dificultava ver qual conta perdeu dinheiro à primeira vista. Corrigido para colorir/sinalizar conforme `transfer_leg` (saída em vermelho com "−", entrada em verde com "+").

## Fase G (parte 1) — Configurações e conta (concluída e testada no navegador)

- `/configuracoes`: perfil (nome, apelido, avatar), aparência/privacidade (tema, densidade, ocultar valores, centavos, animações, mascote), segurança (trocar senha), dados (exportar/excluir).
- `GET /api/exportar-dados`: exporta em JSON todas as tabelas do próprio titular (RLS garante isolamento, sem service role). Baixa como arquivo de verdade (`Content-Disposition: attachment`).
- Exclusão de conta (`src/actions/account.ts` + `src/lib/supabase/admin.ts`): exige reautenticação por senha, remove os arquivos do usuário no Storage (avatars/goal-covers) e então `auth.admin.deleteUser` (que arrasta todas as tabelas via `on delete cascade`). Chave de serviço só existe no servidor (`SUPABASE_SERVICE_ROLE_KEY`, documentada em `.env.example`, nunca `NEXT_PUBLIC_`).
- **Bug real encontrado e corrigido**: depois de excluir o usuário, a função chamava `supabase.auth.signOut()` na sessão do usuário que acabou de deixar de existir; isso podia falhar e fazia a action inteira reportar erro **mesmo com a conta já excluída de verdade** — o usuário veria "falha" quando na verdade tinha dado certo. Corrigido isolando esse `signOut` num try/catch que nunca desfaz o sucesso da exclusão.
- Testado no navegador: trocar senha funciona; exportação retorna JSON real com os dados cadastrados; excluir conta com senha certa remove o usuário de verdade (login depois falha com "Email ou senha incorretos") e redireciona para a landing.

## Fase G (parte 2) — Central de notificações (concluída e testada no navegador)

- `src/lib/notifications.ts` (`ensureNotifications`): gera, de forma idempotente, notificações de vencimento próximo (`due_soon`, a partir de `upcoming_commitments` e `notification_preferences.due_soon_days_before`), limite de orçamento estourado (`budget_limit`, via `budget_progress`) e meta concluída (`goal_milestone`). Chamada a cada carregamento do shell autenticado (`(app)/layout.tsx`).
- Sino no cabeçalho com indicador de não lidas; `/notificacoes` lista, marca uma ou todas como lidas.
- **Bug real encontrado e corrigido**: o índice de deduplicação (`notifications_dedupe_uq`) era parcial (`where related_entity_id is not null`). Postgres não aceita `ON CONFLICT` mirar um índice parcial sem repetir o `WHERE`, e o PostgREST não faz isso — todo `upsert` falhava silenciosamente com `42P10` (o erro não era checado, então a página carregava normal e nenhuma notificação nunca era criada). Corrigido tornando o índice não parcial (semântica idêntica, já que `NULL` nunca conflita em índice único comum) e passou a checar o erro do upsert.
- Testado no navegador: recorrência com vencimento hoje gera notificação "vence em breve" de verdade, aparece o indicador no sino, marcar como lida funciona.

## Fase G (parte 3) — Relatórios (concluída e testada no navegador)

- `/relatorios` (aba de "Visão geral" junto com Contas e Cartões): receitas x despesas por mês (competência, últimos 6 meses), despesas por categoria no mês corrente, comparação caixa x competência no mês corrente.
- Agregação feita em memória a partir de `transactions` + `card_installments`/`card_purchases` (dataset de um usuário, período de 6 meses — volume pequeno o suficiente para não precisar de view SQL dedicada agora; revisar se performance virar problema com histórico longo).
- Testado no navegador com dados reais: receita de R$5.000, despesa avulsa de R$400 (Mercado) e compra no cartão de R$200 (Lazer, não paga). Resultado exato: despesa por competência R$600 (400+200), saída de caixa R$400 (só a despesa avulsa, a compra no cartão ainda não gerou saída de caixa) — confirma a distinção competência/caixa funcionando ponta a ponta.

## Fase G (parte 4) — Importar/exportar, Sugestões, Ajuda, categorias, páginas legais, mascote (concluída e testada no navegador)

- `/importar`: assistente de 3 passos (upload CSV → mapear colunas → prévia) com parser CSV próprio (`src/lib/csv.ts`, sem dependência externa, aceita `,` ou `;`), detecção de duplicata por (conta, data, valor) via `checkDuplicates`, e reversão de lote (`reverse_import_batch`). `GET /api/exportar-movimentacoes` exporta CSV com neutralização de fórmula perigosa (`csvField`) e BOM UTF-8 para abrir certo no Excel.
- Testado no navegador: importar um CSV com 3 linhas cria 3 lançamentos reais; reimportar o mesmo arquivo marca as 3 como "possível duplicata" (sem excluir automaticamente); reverter o lote remove exatamente os 3 lançamentos.
- `/sugestoes`: motor determinístico (`src/lib/finance/suggestions.ts`, testado com Vitest) — orçamento estourado, categoria com alta relevante em relação ao mês anterior, sugestão de reserva para meta a partir de 20% da margem confirmada. Cada card mostra os dados usados e a fórmula. Simulador "E se eu mudar isso?" client-side (não salva nada) reaproveitando `calculateMargin`.
- `/ajuda`: conteúdo real com link direto para cada fluxo (conta, lançamento, cartão/parcelamento, fatura, transferência, orçamento, meta, importação, leitura da previsão).
- Categorias próprias: seção em Configurações para criar e arquivar (categorias do sistema não têm botão de remover, protegido também por RLS).
- **Bug de UX encontrado e corrigido**: o cadastro linkava para `/termos` e `/privacidade`, que não existiam (404). Criadas com conteúdo real sobre o que o app efetivamente faz — sem inventar razão social/CNPJ/contato, que ficam marcados como pendentes de publicação (ver Pendências externas). `/creditos` lista as bibliotecas e licenças (DiceBear CC0, fontes, ícones).
- Mascote Tiva: primeiro estado real (`TivaWelcome`, SVG original em `src/components/mascot/tiva.tsx`) no último passo do onboarding, condicionado à preferência `mascotEnabled`. Estados "dica", "comemoração" e "pausa" continuam pendentes (ver `docs/ASSETS.md`).

## Próximos passos (o que ainda falta)

Todos os módulos funcionais principais das seções 13/14 do prompt mestre estão implementados e testados localmente: Hoje, Movimentações, Visão geral (Contas/Cartões/Relatórios), Planejar (Orçamentos/Metas/Recorrências/Dívidas), Importar/Exportar, Sugestões, Notificações, Ajuda, Configurações (perfil/aparência/categorias/segurança/dados). O que resta é polimento visual e conteúdo, não lógica de domínio:

1. **Calendário** (item 5 da lista de telas) não tem view própria — hoje os vencimentos aparecem em Hoje (próximos compromissos) e Sugestões, mas falta uma grade de calendário mensal navegável.
2. **Landing page** é funcional mas mínima (sem as composições editoriais com fotos, seções de recursos e FAQ descritas na seção 5 do prompt mestre).
3. **Mascote**: só o estado "boas-vindas" existe (ver Fase G parte 4). Faltam "dica", "comemoração" e "pausa".
4. **Fotos de estilo de vida** (landing, onboarding, capas de meta): nenhuma foi buscada ainda — precisam de fonte com licença comercial verificável, não Google Imagens.
5. **Revisão visual final**: screenshots reais em 360/390/768/1440px, contraste WCAG AA, `prefers-reduced-motion`, animações com Motion (hoje as transições são só CSS simples).
6. **Playwright automatizado**: os testes de fluxo neste projeto foram feitos com scripts Playwright avulsos rodados manualmente durante o desenvolvimento (ver histórico de progresso acima) — não existe uma suíte `tests/e2e/` versionada no repo ainda.

## Pendências externas (agrupadas)

1. **Aplicar as 9 migrations no Supabase remoto** (`docs/SUPABASE-SETUP.md`) — bloqueia qualquer teste real de ponta a ponta contra produção. Até lá, o app roda contra o schema, mas "persistência real validada" só vale depois disso.
2. **Configurar Auth no painel remoto**: Site URL, Redirect URLs, e (antes de liberar cadastro público) SMTP próprio — o Supabase não tem esses valores hoje.
3. **Configurar `SUPABASE_SERVICE_ROLE_KEY`** no ambiente de produção (nunca `NEXT_PUBLIC_`) — necessária só para exclusão de conta (`src/actions/account.ts`). Ver `.env.example`.
4. **Identificação jurídica do operador** (razão social, CNPJ, endereço, contato formal) ainda não existe — `/termos` e `/privacidade` têm conteúdo real sobre o que o app faz, mas marcam essa lacuna explicitamente e não devem ser tratadas como termos finais para abertura de cadastro público.
5. **Fotos de estilo de vida e mascote completo** — ver lista acima.
