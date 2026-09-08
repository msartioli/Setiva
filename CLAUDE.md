@AGENTS.md

# Setiva

Finanças pessoais para o Brasil. Especificação completa em `SETIVA-PROMPT-MESTRE.md`; estado real em `docs/PROGRESS.md`; fórmulas de domínio em `docs/FINANCIAL-MODEL.md`. Não duplicar essas specs aqui — só comandos e invariantes que valem sempre.

**Projeto anterior a ignorar**: `C:\Users\matheus.artioli\Projetos\finance-saas` não tem relação com este projeto. Não ler, não comparar, não reaproveitar.

## Comandos

```bash
npm run dev          # app em http://localhost:3000
npm run build && npm run start
npm run lint
npm run typecheck
npm run test         # unitários (src/**/*.test.ts), sem infraestrutura
npm run test:db      # integração contra Supabase local — exige `npx supabase start` antes
npm run test:e2e     # Playwright
```

Banco: migrations manuais em `supabase/migrations/`, aplicação e ordem em `docs/SUPABASE-SETUP.md`. **Nunca** `supabase db push`/`reset` nem MCP contra o projeto remoto (`xjycdaxxwthzukbbbugy.supabase.co`) — só o dono aplica lá, pelo SQL Editor. `supabase start`/`db reset` locais (Docker, portas 55321-55329 neste projeto) são só para validar SQL antes de entregar.

## Invariantes que não se renegociam

- Dinheiro é `bigint` em centavos. Nunca `float`/`double` para valor monetário.
- Toda tabela privada nova precisa de RLS + policies na mesma migration que a cria. Toda coluna `user_id` que o cliente preenche direto precisa de `default auth.uid()` (bug já corrigido uma vez por faltar isso — não reintroduzir).
- PostgREST recusa `update`/`delete` sem filtro explícito na própria query (`"UPDATE requires a WHERE clause"`), mesmo que o RLS já restrinja a linha certa. Todo `.update(...)`/`.delete()` no cliente Supabase precisa de um `.eq(...)` (ou outro filtro) explícito — não confiar só no RLS (bug já corrigido uma vez em `src/actions/onboarding.ts`, não reintroduzir).
- Transferência, compra parcelada, pagamento de fatura, aporte de meta e pagamento de dívida são sempre funções `security definer` que validam propriedade das contas/categorias envolvidas — nunca insert direto do cliente nessas linhas.
- Compra no cartão nunca gera linha em `transactions` nem mexe em saldo bancário; só o pagamento da fatura gera (`origin = 'card_invoice_payment'`, sem categoria, para não duplicar despesa nos relatórios por competência).
- Next.js 16: arquivo de sessão/redirecionamento é `proxy.ts` (não `middleware.ts`, deprecado). Cache Components (`cacheComponents` em `next.config.ts`) fica **desligado** — todo dado é privado e dinâmico por usuário.
- Zero emojis em qualquer texto de interface. Sem travessão/hífen como recurso estilístico em copy (sinal de menos matemático e sintaxe de código continuam normais).
- Nunca declarar "aplicado em produção" ou "testado com Supabase real" sem confirmação de que as migrations foram aplicadas no projeto remoto pelo dono.
