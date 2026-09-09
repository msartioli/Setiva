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

## Fase G (parte 5) — Correções de design real após revisão do dono (concluída e testada no navegador)

O dono revisou capturas de tela reais e apontou, com razão, que o polimento visual ficou muito abaixo do funcional. Problemas concretos corrigidos:

1. **Bug de layout**: o botão "Novo lançamento" sobrepunha "Visão geral" no cabeçalho em larguras intermediárias. Causa: o nav central usava `position: absolute` dentro de um container `justify-between`, que não reserva espaço para ele. Corrigido trocando para grid de 3 colunas (`grid-cols-[auto_1fr_auto]`), com rótulos dos itens de nav escondidos abaixo de `lg` para não espremer.
2. **Checkboxes nativos do navegador em todo o app** (cadastro, onboarding, configurações, importação, recorrências): substituídos por `Checkbox`/`Switch` de verdade (Radix), com o mesmo sistema de cor/raio do resto da interface. Isso sozinho resolvia a maior parte da sensação de "quebrado".
3. **Bug real, mais sério: a preferência de tema (claro/escuro) nunca era aplicada.** Ficava salva em `profiles.theme`, mas nada escrevia `data-theme` na tag `<html>` — escolher "Escuro" ou "Claro" não tinha efeito nenhum; só o tema do sistema operacional valia. Corrigido com um cookie leve (`src/lib/theme-cookie.ts`) escrito sempre que a preferência muda (`updatePreferences`, `savePreferencesStep`) ou no login, lido pelo layout raiz (`src/app/layout.tsx`) para decidir `data-theme` antes da primeira renderização. Testado: escolher Escuro/Claro agora muda a cor de fundo de verdade e persiste depois de recarregar. Custo aceito: como o layout raiz agora lê cookies, as páginas públicas deixaram de ser pré-renderizadas estaticamente (todas viram `ƒ` dinâmico no build) — correção da funcionalidade teve prioridade sobre esse ganho de performance.
4. Faltava também o token `--lime-strong` no bloco `[data-theme="dark"]` explícito (só existia no bloco de `prefers-color-scheme`), fazendo o tema "Escuro" manual divergir sutilmente do "Automático". Corrigido.
5. **Avatares minúsculos e sem contraste**: o estilo Notionists é traço preto sobre fundo transparente — em 40-48px sobre o papel claro ficava ilegível e sem nada a ver com a proposta de marca. Corrigido com fundo colorido sólido (paleta da marca, via `backgroundColor`/`backgroundType` do próprio DiceBear) e avatares maiores (64px, círculo com anel de seleção) no onboarding e em Configurações.
6. **Página Hoje estruturalmente incompleta**: faltavam "visão visual das contas", "sugestão explicável" e "acesso a metas" que o prompt mestre pedia para o dashboard — daí a sensação de página vazia. Adicionadas as três seções (lista de contas, destaque da sugestão principal via `computeSuggestions` reaproveitado de Sugestões, mini-lista de metas com progresso).

Ainda pendente de uma futura passada: animações com Motion (hoje só transições CSS simples), passeio guiado da spec (5 pontos), e o polimento editorial completo da landing/mascote com fotos.

## Fase H (parcial) — Repaginação da landing, login/cadastro, 404 e tipografia (concluída e testada no navegador)

A pedido do dono, depois de ver a Fase G rodando: landing considerada "site novo", tipografia rejeitada, pediu algo inovador com fotos reais, elementos geométricos/wave animados e uma 404 de verdade.

- **Tipografia trocada em todo o site**: Fraunces saiu, entrou Bricolage Grotesque (títulos, peso variável) mantendo Inter no corpo/tabelas. Um só lugar (`src/app/layout.tsx` + `--font-display` em `globals.css`), then propaga para app e marketing.
- **Fotos reais licenciadas**: 3 fotos do Unsplash (License gratuita, uso comercial liberado), buscadas e baixadas de verdade, não Google Imagens. Uma candidata inicial era do Unsplash+ (camada paga) e foi descartada ao conferir o domínio antes de baixar — registrado em `docs/ASSETS.md` como lembrete. Arquivos em `public/images/`, créditos completos documentados.
- **Elemento de assinatura visual**: `src/components/marketing/flow-wave.tsx`, uma linha de fluxo de caixa que se desenha sozinha com nós flutuantes (o mesmo conceito do mapa do mês, não uma onda decorativa qualquer), mais `geo-field.tsx` (formas geométricas flutuando) e `cta-button.tsx` (botão com microinteração de hover/tap via Motion).
- **Landing inteira reconstruída** (`src/app/page.tsx`): header fixo escuro, hero com headline grande + wave animada + mini-cards de exemplo, seção "um mapa não uma planilha" com foto real, "como funciona" em 3 passos, grade de 6 recursos com conteúdo específico (não genérico), segunda seção com foto, FAQ em acordeão com perguntas e respostas reais (sem estatística inventada, sem depoimento fake, sem preço inventado), CTA final e rodapé.
- **Login e cadastro reconstruídos** (`src/components/layout/auth-shell.tsx`): painel escuro com foto real (opacidade baixa, atrás de gradiente), a mesma FlowWave, formulário à direita já herda a fonte nova.
- **Página 404 de verdade** (`src/app/not-found.tsx`): fundo escuro, wave, formas geométricas, e o segundo estado da mascote Tiva (`TivaPause`, deitada e "zzz"), com call to action de volta para o mapa do mês.
- **Achado durante a implementação**: `bg-ink` inicialmente reaproveitava o token `--ink`, que **inverte** no modo escuro do usuário (vira a cor clara) — isso faria o herói escuro da landing virar claro se alguém tivesse o tema "Escuro" ativado. Corrigido com um token novo e fixo (`--ink-fixed`, nunca redefinido nos blocos de dark mode), reservado só para composição de marketing, independente da preferência de tema do app.
- **Revisão de texto**: ao mexer em tantas telas, uma auditoria por `grep` achou vários travessões usados como recurso estilístico em textos de interface (onboarding, ajuda, termos, privacidade, diálogos), o que o próprio prompt mestre proíbe. Todos substituídos por pontuação normal (ponto, dois-pontos, vírgula).
- Efeito colateral aceito: como o layout raiz já lia cookies (tema) desde a Fase G, isso não mudou; mas a landing e paginas publicas continuam `ƒ` dinâmicas no build (sem pré-renderização estática), decisão já tomada antes por causa do tema.

Testado no navegador: 404 real, cadastro e login com o novo visual, landing completa em light mode nas rolagens principais, fonte nova aplicada dentro do app autenticado também. Lint, typecheck, os 28 testes automatizados e o build de produção passam.

Pendente ainda desta fase: passeio guiado (tutorial) de até 5 pontos.

### Correção depois da primeira entrega (mesmo dia): landing ainda genérica

O dono viu a primeira versão e apontou, com capturas de tela: seção de perguntas "genérica" visualmente e sem ícone algum, uma das duas fotos de banco de imagens sem relação clara com o texto ao lado e com espaço vazio sobrando ao redor, os "três passos" só com número gigante e nada mais, e pediu algo mais específico do produto, não "algo que qualquer um faz".

- **Bug real encontrado ao testar**: depois de adicionar ícone em cada pergunta do FAQ, a página quebrou (erro 500). Causa: o ícone (um componente React) estava sendo passado como prop de `src/app/page.tsx` (Server Component) para `FaqItem` (Client Component, `"use client"`) — funções/componentes não podem atravessar essa fronteira, só dados serializáveis ou elementos já renderizados. Corrigido renderizando o ícone (`<item.icon />`) ainda no componente de servidor e passando o elemento já pronto como prop, não a referência do componente.
- **Peça nova**: `src/components/marketing/product-mockup.tsx`, uma réplica em HTML/CSS puro (sem captura de tela, sem imagem) de duas telas reais do produto (mapa do mês de `/hoje`, fatura de cartão de `/visao-geral/cartoes`), dentro de uma moldura de navegador. Usa a paleta de marca sempre fixa (não segue tema claro/escuro do visitante, mesmo raciocínio do `--ink-fixed`), documentado em `docs/ASSETS.md`.
- Uma das duas fotos de banco de imagens saiu da landing (a de "pessoa sorrindo com celular ao ar livre", removida de `public/images/`) e o espaço virou a seção com o mockup da fatura, com blob colorido atrás.
- A foto que ficou (café e notebook) ganhou um cartão flutuante sobreposto no canto ("Tempo pra organizar o mês: 3 minutos") e um blob de cor atrás, pra não sobrar tanto vazio ao redor da imagem.
- O herói trocou a onda abstrata + números soltos por esse mesmo mockup do mapa do mês, com dois cartões flutuantes sobrepostos nos cantos (como uma tela real, não uma ilustração genérica de gráfico).
- "Como funciona": os três passos ganharam um ícone dentro de um círculo da cor da marca, ligados por uma linha, número ficou pequeno ao lado do título em vez de gigante e sozinho.
- "Recursos": os seis ícones agora alternam de cor (marca, argila, verde, névoa, azul, lima), em vez de todos na mesma cor neutra.
- Removida a etiqueta "Registro manual e importação de CSV, sem conexão automática com bancos" do topo do herói, a pedido do dono.

Testado no navegador depois da correção: as 5 seções de novo, com o erro 500 resolvido, e ícone de cada pergunta aparecendo corretamente. Lint, typecheck, os 20 testes unitários e o build de produção passam de novo.

## Fase I — Redesign seguindo a referência visual enviada pelo dono

O dono rejeitou as duas tentativas anteriores de landing e mandou capturas de tela de uma referência concreta (contasonline.com.br), pedindo o mesmo vocabulário visual: ícones, personagens ilustrados, a tipografia, e login/cadastro no mesmo padrão. Nas rodadas anteriores eu vinha impondo direção própria em vez de seguir a referência; esta fase segue a referência.

**Paleta refeita a partir do próprio logo.** O logo da Setiva é esmeralda vivo, mas o app inteiro usava um verde-oliva acinzentado que não combinava com ele. Trocado: verde profundo (`--forest`, faixas escuras), esmeralda (`--brand`) e dourado (`--accent`, só para ação), fundo cinza-claro. Como só `globals.css` conhecia os valores brutos, a troca foi central e propagou para o app inteiro sem tocar em componente. Tokens fixos (`--forest-fixed`) para as faixas verdes de marketing, que não podem inverter com o tema escuro do usuário.

**Tipografia unificada** em Plus Jakarta Sans (títulos e corpo), geométrica e arredondada como a da referência. Saíram Bricolage Grotesque e Inter.

**Personagens ilustrados** (`src/components/marketing/illustrations.tsx`): quatro pessoas em vetor plano, SVG desenhado aqui, sem biblioteca e sem licença a cumprir. Dois tons de pele diferentes de propósito. `PersonPointing` (herói, apontando para o celular, com a mão passando na frente da tela como na referência), `PersonWithPhone` (painel de entrar/cadastrar), `PersonCelebrating` (chamada final), `PersonSearching` (404).

**Peças de composição** (`src/components/marketing/pieces.tsx`): pílula de seção em caixa alta, selo de ícone em quadrado arredondado, lista de recursos com divisórias finas, cartão verde que emoldura uma tela do produto. Tudo no padrão da referência.

**Mockups de tela ampliados** (`product-mockup.tsx`): além da fatura, agora existem o resumo do dia em celular, a agenda do mês em grade e os orçamentos com barras. Continuam HTML/CSS, não imagem.

**Foto de pessoa de volta, no lugar certo.** A referência usa um retrato recortado em círculo; foi isso que se fez, com cartões do produto sobrepostos. Retrato buscado no Unsplash com licença gratuita conferida antes de baixar (`images.unsplash.com`, não `plus.`); descartados no caminho os resultados marcados "Getty Images (Premium)". As três fotos de cena anteriores foram removidas do projeto por não dizerem nada sobre o produto.

**Login, cadastro e 404** reconstruídos no mesmo vocabulário: painel verde com lista de benefícios marcados, personagem com cartões flutuantes, círculos decorativos.

Bugs reais encontrados e corrigidos durante esta fase:
- Landing quebrou com erro 500 ao dar ícone às perguntas: o ícone (componente React) estava sendo passado de `page.tsx` (Server Component) para `FaqItem` (Client Component). Componentes não atravessam essa fronteira. Corrigido renderizando o ícone no servidor e passando o elemento pronto.
- Herói: a coluna do grid era `auto` e colapsou com filho `w-full`, jogando o personagem para fora da tela à direita. Corrigido fixando a largura da coluna.
- Personagem sentado renderizava como barras soltas (as formas de perna sentada não fechavam). Redesenhado em pé, com a mesma estrutura do personagem que já funcionava.
- Fundo dos avatares do DiceBear ainda usava os hex da paleta antiga; atualizado para os tons novos.

Removidos por terem ficado sem uso: `flow-wave.tsx`, `geo-field.tsx` e as três fotos antigas.

Testado no navegador: landing inteira, cadastro, login, 404, e o app autenticado (cadastro real, onboarding completo até `/hoje`) para conferir que a troca de paleta não quebrou contraste em botão, cabeçalho ou estado vazio. Lint, typecheck, os 20 testes unitários e o build de produção passam.

## Fase J — Ajustes pedidos pelo dono: landing enxuta, dia da renda, gráficos e ícones

**Landing.** Removido o dedo apontando da ilustração do herói (ficava lendo como um retângulo solto). Os dois botões do herói viraram um só, "Teste grátis". A seção final inteira ("Comece a ver seu mês com clareza") saiu, junto com a ilustração que só ela usava.

**Dia da renda no onboarding.** O passo 3 fixava `anchorDay: 5` no código: toda renda caía no dia 5, independente do que a pessoa recebesse. Agora tem campo "Todo dia", validado de 1 a 31, e a lista mostra "Salário: R$ 5.000,00, todo dia 10". A server action já aceitava `anchorDay`, então não precisou de migration. Verificado no navegador: uma renda cadastrada no dia 10 aparece em próximos compromissos como 10/09 e 10/10.

**Gráficos novos em /hoje.**
- `BudgetAlerts`: limites do mês em barras, com três faixas (dentro, perto do limite a partir de 80%, estourado). O aviso de 80% é o que importa: depois de estourar, avisar já não evita o gasto. Cada faixa tem texto próprio dizendo para segurar o gasto naquela categoria.
- `CategoryDonut`: rosca de despesas do mês por categoria, com legenda, valor e percentual. No máximo 6 fatias nomeadas mais "Outras", para a rosca não virar um arco-íris ilegível.
- `MonthFlowChart`: barras de entrou/saiu/sobrou no mês, na coluna lateral.

**Consistência entre telas (decisão de implementação).** O gasto por categoria da rosca é calculado em `src/lib/month-spending.ts`, que soma as **mesmas duas fontes** que a view `budget_progress`: transações de despesa (menos pagamento de fatura) e parcelas de cartão pelo mês da compra. Se somasse só `transactions`, a rosca mostraria um valor menor que a barra de orçamento da mesma categoria, e as duas telas se contradiriam na mesma página.

**Ícones de categoria.** `src/lib/category-visuals.ts` mapeia o `icon` que a categoria já guarda no banco para um ícone Lucide mais um par de cores. As cores vivem no app, não na coluna `color`: o seed foi gravado com a paleta antiga e o remoto só é atualizado pelo dono, manualmente, então derivar no app mantém tudo em sincronia sem exigir migration de dados. Tem fallback por nome e fallback final, para categoria criada pelo usuário nunca quebrar a tela. Aplicado em orçamentos e nos limites de /hoje.

**Migration 10 (`20260908100010_category_accents.sql`)**: ao revisar as telas de categoria, notado que o seed da migration 2 gravou os nomes de catálogo sem acento ("Salario", "Saude", "Educacao", "Presentes e doacoes", "Caixa Economica Federal", "Itau"), aparecendo assim na interface. Migration nova, idempotente, corrige só as linhas de catálogo (`user_id is null`); categoria criada pelo usuário não é tocada. **Não validada contra Postgres local nesta sessão** (Docker Desktop não estava disponível na máquina); são somente `update` condicionais sobre nomes exatos, sem mudança de schema, então o risco é baixo, mas revisar antes de aplicar no remoto.

**Bug encontrado no teste com dados reais.** O gráfico de entrou/saiu mostrava só a barra vermelha e uma barra "Sobrou R$ 0,00" quando a renda era uma recorrência ainda não efetivada. Lia como prejuízo, não como "ainda não entrou". Corrigido: a barra "Sobrou" só aparece quando já houve receita no mês, e no lugar entra uma linha explicando que o previsto está em próximos compromissos.

Testado ponta a ponta no navegador com dados reais: cadastro, onboarding com renda no dia 10, conta com saldo, quatro despesas em categorias diferentes e três limites (um tranquilo, um a 87%, um estourado a 116%), conferindo que as três faixas de alerta aparecem certas e que rosca e barras batem. A conta de teste foi excluída depois pelo próprio fluxo do app, e confirmei que o login dela não funciona mais. Lint, typecheck, os 20 testes e o build passam.

## Fase K — Mascote completa: dica e comemoração

Os dois estados que faltavam da Tiva (`docs/ASSETS.md`), pedidos explicitamente pelo prompt mestre ("boas-vindas, dica, comemoração e pausa").

- `TivaTip` (`src/components/mascot/tiva.tsx`): Tiva em pé segurando uma lâmpada. Aparece em `/sugestoes`, ao lado do título "Sugestões para este mês", só quando existe ao menos uma sugestão de verdade (não aparece no estado vazio "Nada para destacar agora", que já é uma notícia boa por si só).
- `TivaCelebrate`: Tiva com as duas patas erguidas e confete ao redor. Aparece no cartão de uma meta em `/planejar/metas` quando ela atinge 100% do valor alvo (`reservedCents >= targetCents`), junto com o texto "Meta concluída."
- Ambos condicionados à mesma preferência `profiles.mascot_enabled` que já existia (buscada agora também nas páginas de Sugestões e Metas, seguindo o padrão do resto do app de cada página buscar o que precisa direto do Supabase).
- Verificação visual: como o Docker não estava disponível nesta sessão para subir o Supabase local, não deu para testar com dados reais de ponta a ponta (uma sugestão real, uma meta batendo 100%). Em vez disso, os quatro estados da mascote (os dois novos e os dois existentes, para comparação) foram renderizados isolados num HTML estático com os tokens de cor exatos do app, em claro e escuro, conferindo coerência visual e contraste antes de integrar.

Lint, typecheck, os 23 testes e o build de produção passam.

## Fase L — Capa de meta (upload próprio, não banco de imagens)

Ao investigar o item pendente "capas de meta" (`docs/ASSETS.md`), descoberto que a Fase B já tinha criado o necessário no banco para isso: coluna `goals.cover_image_url` e o bucket privado `goal-covers` com RLS completo (migration 9), só que sem nenhuma UI que os usasse. Não era um caso de "buscar foto de banco de imagens" (diferente de landing/onboarding): o prompt mestre pede uma capa por meta, e a arquitetura já provisionada era claramente para o usuário subir a própria foto (viagem, casa etc.), não uma foto de estoque genérica.

- `src/actions/planning.ts`: `updateGoalCover` (valida tipo PNG/JPEG/WEBP e até 4 MB, sobe pro bucket em `{user_id}/{goal_id}.{ext}`, remove o arquivo antigo se a extensão mudou) e `removeGoalCover`.
- `src/app/(app)/planejar/metas/page.tsx`: gera uma URL assinada (1h) por meta que tiver capa, já que o bucket é privado.
- `src/components/planning/goals-view.tsx`: banner de capa no topo do cartão da meta, botões "Adicionar capa"/"Trocar capa"/"Remover".
- **Não testado com Supabase real nesta sessão** (Docker indisponível): typecheck, lint (1 warning esperado do `<img>` nativo, mesmo padrão já aceito para os avatares DiceBear) e build de produção passam, mas falta confirmar upload/leitura de verdade contra um Postgres/Storage real assim que houver ambiente disponível.

## Próximos passos (o que ainda falta)

Todos os módulos funcionais principais das seções 13/14 do prompt mestre estão implementados e testados localmente: Hoje, Movimentações, Visão geral (Contas/Cartões/Relatórios), Planejar (Orçamentos/Metas/Recorrências/Dívidas), Importar/Exportar, Sugestões, Notificações, Ajuda, Configurações (perfil/aparência/categorias/segurança/dados). A landing, autenticação, 404 e mascote também já passaram por redesign completo (Fases H a K). O que resta é polimento visual e conteúdo, não lógica de domínio:

1. **Calendário** (item 5 da lista de telas) não tem view própria — hoje os vencimentos aparecem em Hoje (próximos compromissos) e Sugestões, mas falta uma grade de calendário mensal navegável.
2. **Fotos de estilo de vida no onboarding**: a landing já tem uma foto real licenciada (`docs/ASSETS.md`) e a capa de meta virou upload próprio do usuário (Fase L, não precisa de banco de imagens); falta só o onboarding, que exige repensar o layout atual (coluna única estreita, `step-shell.tsx`) para caber imagem — decisão de design ainda em aberto, não fazer sem alinhar antes.
3. **Revisão visual final**: screenshots reais em 360/390/768/1440px, contraste WCAG AA, `prefers-reduced-motion`, animações com Motion (hoje as transições são só CSS simples).
4. **Playwright automatizado**: os testes de fluxo neste projeto foram feitos com scripts Playwright avulsos rodados manualmente durante o desenvolvimento (ver histórico de progresso acima) — não existe uma suíte `tests/e2e/` versionada no repo ainda.
5. **Testar contra Supabase real assim que houver ambiente disponível** (Docker indisponível durante esta sessão): `TivaTip`/`TivaCelebrate` (Fase K) dentro do produto com dados reais, e o upload/leitura de capa de meta (Fase L) de ponta a ponta.

## Pendências externas (agrupadas)

1. **Aplicar o schema no Supabase remoto** — bloqueia qualquer teste real de ponta a ponta contra produção. Até lá, o app roda contra o schema, mas "persistência real validada" só vale depois disso. Duas formas equivalentes, escolha uma (`docs/SUPABASE-SETUP.md`): as 10 migrations individuais em `supabase/migrations/`, ou `supabase/schema_completo.sql` (as mesmas 10 fundidas num único arquivo/transação, gerado em 2026-09-09, revisado quanto a nomes duplicados e balanceamento de sintaxe mas **não executado contra um Postgres real nesta sessão** por falta de Docker disponível).
2. **Configurar Auth no painel remoto**: Site URL, Redirect URLs, e (antes de liberar cadastro público) SMTP próprio — o Supabase não tem esses valores hoje.
3. **Configurar `SUPABASE_SERVICE_ROLE_KEY`** no ambiente de produção (nunca `NEXT_PUBLIC_`) — necessária só para exclusão de conta (`src/actions/account.ts`). Ver `.env.example`.
4. **Identificação jurídica do operador** (razão social, CNPJ, endereço, contato formal) ainda não existe — `/termos` e `/privacidade` têm conteúdo real sobre o que o app faz, mas marcam essa lacuna explicitamente e não devem ser tratadas como termos finais para abertura de cadastro público.
5. **Fotos de estilo de vida e mascote completo** — ver lista acima.
