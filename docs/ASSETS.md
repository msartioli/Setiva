# Setiva: registro de ativos visuais

## Marca (logo, símbolo, ícones)

Fornecidos pelo dono do produto em `imagens/` (pasta local, não gerada por mim), com o mapa de uso em `imagens/aonde_me_usar.txt`. Copiados para `public/brand/` conforme usados:

| Arquivo em `public/brand/` | Origem | Uso |
|---|---|---|
| `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png` | `imagens/favicon/` | Favicon do site (`src/app/layout.tsx`) |
| `apple-touch-icon.png` | `imagens/app/dark/setiva_app_icon_dark_180x180.png` | Ícone iOS |
| `icon-192.png`, `icon-512.png` | `imagens/app/light/` | Ícones PWA/manifest |
| `logo-light.png`, `logo-dark.png` | `imagens/web/light/` e `imagens/web/dark/` | Logo em fundo claro/escuro |
| `symbol.png` | `imagens/symbol/setiva_symbol_256x256.png` | Símbolo isolado (auth shell, avatar de marca) |

Não tenho comprovante de licença desses arquivos porque não foram buscados por mim — são material próprio do dono do produto. Nenhuma edição de conteúdo foi feita, só redimensionamento/seleção de qual arquivo usar em cada tela.

## Avatares (DiceBear)

Gerados localmente com o pacote `@dicebear/core` + `@dicebear/collection` (`src/lib/avatars.ts`), nunca por chamada a uma API externa em tempo de execução. Três famílias visuais:

| Família (rótulo na UI) | Estilo DiceBear | Licença | Atribuição exigida |
|---|---|---|---|
| Retratos | `notionists` | CC0 1.0 | Não |
| Formas | `shapes` | CC0 1.0 | Não |
| Traços | `thumbs` | CC0 1.0 | Não |

Licenças conferidas em dicebear.com/licenses em 2026-09-08. Todas CC0 1.0: uso livre, sem exigência de crédito — por isso não há linha de atribuição na interface. Se novas famílias forem adicionadas no futuro, confira a licença de cada uma individualmente antes de usar (`Notionists`/`Shapes`/`Thumbs` são CC0, mas `Adventurer`, `Personas`, `Micah`, `Big Smile` e `Miniavs`, por exemplo, exigem atribuição).

Seed de cada avatar (`profiles.avatar_seed`) é uma string curta sorteada ou escolhida a partir de uma lista curada (`CURATED_SEEDS` em `src/lib/avatars.ts`) — nunca derivada de email, CPF ou nome completo do usuário.

## Mascote (Tiva)

**Parcial.** `src/components/mascot/tiva.tsx` tem o estado "boas-vindas" (`TivaWelcome`), um SVG original em formas simples (nunca baseado em personagem existente), usado no último passo do onboarding, condicionado a `mascotEnabled`. Os estados "dica", "comemoração" e "pausa" mencionados no PROMPT MESTRE ainda não existem — pendente para uma passada futura de design visual.

## Fotos de estilo de vida (landing, onboarding, capas de meta)

**Pendente.** Nenhuma foto foi buscada ou baixada ainda. Quando a Fase H começar, cada foto usada será registrada aqui com: URL de origem, autor, licença e o arquivo final salvo em `public/`. Até lá, a landing e o onboarding não usam fotos — usam apenas ilustração/tipografia, para não haver imagem quebrada nem alegação falsa de "fotos incluídas".
