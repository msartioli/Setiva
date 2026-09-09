# Dados financeiros públicos (BrasilAPI, logos-bancos-br, Banco Central)

Camada de dados públicos brasileiros para enriquecer o produto: lista real de instituições financeiras com logo, câmbio e indicadores (Selic/CDI/IPCA). **Não é Open Finance**: nenhuma conexão bancária, nenhuma leitura automática de saldo/extrato, nenhum consentimento OAuth. O saldo continua 100% manual.

## Fontes

- **`logos-bancos-br`** (npm, MIT, dataset local empacotado): base principal da lista de instituições. Cobre ~1090 instituições (bancos com COMPE + participantes só-Pix), com logo real para a maioria via CDN oficial do próprio pacote. Nunca faz chamada de rede — nunca falha em runtime.
- **BrasilAPI** (`brasilapi.com.br`, gratuita, sem chave): `/banks/v1` complementa a lista (só entra quando falta um ISPB que a base local não tem, o que na prática quase nunca acontece); `/cambio/v1/*` para câmbio; `/taxas/v1` para Selic/CDI/IPCA.
- **Banco Central** (SGS + PTAX/Olinda, gratuita, sem chave): fallback do câmbio (só USD) e da Selic quando a BrasilAPI falha.

## Arquitetura

```
src/lib/integrations/
  safe-fetch.ts              fetch com timeout + log estruturado, nunca lança excecao
  brasil-api/{client,types,mappers}.ts
  bcb/{client,types}.ts
  financial-institutions/
    types.ts                 FinancialInstitution — modelo unico que o resto do app conhece
    normalize.ts              normalizeSearchText, digitsOnly (puro, sem I/O)
    aliases.ts                apelidos curados de busca + ordem dos bancos populares
    search.ts                 searchInstitutions/getPopularInstitutions (puro — seguro para client component)
    service.ts                getFinancialInstitutions (merge+cache), getFinancialInstitutionByIspb (server-only)
  market-data/{types,service}.ts   getCurrencies, getExchangeRate, getCurrentSelicRate
```

O browser nunca chama BrasilAPI/BCB diretamente. Toda chamada externa é server-side (`service.ts`, Server Components/Actions); o cliente só recebe o modelo já normalizado (`FinancialInstitution`, `Currency`, `ExchangeRate`, `SelicRate`).

`search.ts` é deliberadamente separado de `service.ts`: não importa `logos-bancos-br` nem `fetch`, então pode ser importado por um Client Component (o seletor de banco filtra localmente, sem round-trip ao servidor a cada tecla) sem colocar o dataset inteiro no bundle do navegador.

## Identidade: ISPB, nunca o logo

`accounts.institution_ispb` é a identidade estável de uma conta. `institution_logo_url`/`institution_display_name` são um **snapshot de apresentação** no momento em que a conta foi criada — sempre resolvidos no servidor a partir do ISPB (`getFinancialInstitutionByIspb`), nunca aceitos do cliente. Isso evita que um cliente adulterado grave nome/URL arbitrários, e permite trocar a fonte do logo no futuro (CDN → assets próprios → Open Finance) sem quebrar contas existentes.

## Fallback de logo (cascata)

1. `logoUrl` resolvido (logos-bancos-br, CDN oficial do pacote — `cdn.jsdelivr.net/npm/logos-bancos-br@<versão>/logos/...`).
2. Se a URL não existir ou a imagem falhar ao carregar (`onError`): avatar genérico — sigla + cor determinística (`src/lib/institution-visuals.ts`), nunca uma imagem quebrada.

## Cache e resiliência

- `logos-bancos-br`: dado local, não precisa de cache (nunca faz I/O).
- Lista mesclada (`getFinancialInstitutions`): memo em memória de 1h por processo, além do cache de `fetch` do Next (24h) na chamada à BrasilAPI.
- Câmbio/Selic: `fetch` com `next.revalidate` (6–24h conforme o endpoint) + último valor válido em memória como fallback final se todas as fontes externas falharem.
- Toda chamada externa tem timeout (`safeFetchJson`, 5s por padrão) — uma API fora do ar nunca deixa a página carregando indefinidamente.
- Falha da BrasilAPI nunca derruba a lista de bancos (a base local já é suficiente sozinha). Falha do câmbio/Selic cai para PTAX do BCB (só USD) e depois para o último valor em cache; se não houver nada, a função retorna `null` e a UI deve tratar a ausência, nunca travar.

## O que ainda não tem lugar na interface

Selic/câmbio ficam só como infraestrutura nesta fase — não foram colocados no dashboard nem em nenhuma tela, para não "poluir" sem um motivo real de produto (ver PROGRESS.md). Ficam prontos para uso futuro (simuladores, conteúdo educativo, comparações de investimento).

## Adicionando um novo provider no futuro

1. Criar `src/lib/integrations/<provider>/{client,types,mappers}.ts` seguindo o padrão acima (usar `safeFetchJson`).
2. Mapear para `FinancialInstitution` (ou `Currency`/`ExchangeRate`/`SelicRate`, conforme o caso) — nunca expor o formato cru fora da própria pasta do provider.
3. Mesclar em `service.ts` por ISPB (instituições) ou substituir/complementar em `market-data/service.ts`, mantendo a ordem de fallback existente.

## Onde o Open Finance deverá se encaixar

`accounts.connection_type` já existe (migration 11), hoje só aceita `'manual'` (constraint no banco). Quando o Open Finance for implementado, o valor `'open_finance'` passa a ser aceito e uma nova interface (`FinancialAccountProvider`, ainda não criada) cobre sincronização de saldo/extrato — sem precisar alterar as contas manuais já existentes nem esta camada de dados públicos, que continua servindo a busca/seleção de banco independentemente da forma de conexão.
