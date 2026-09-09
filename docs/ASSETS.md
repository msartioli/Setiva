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

## Ilustrações de personagens (landing, autenticação, 404)

`src/components/marketing/illustrations.tsx`: quatro personagens em vetor plano, desenhados aqui como SVG próprio (sem base em ilustração de terceiros, sem biblioteca externa, sem licença a cumprir). Estilo: formas cheias sem contorno, rosto sem traços faciais, paleta da marca mais tons de pele.

| Componente | Onde aparece |
|---|---|
| `PersonPointing` | Herói da landing, apontando para o celular |
| `PersonWithPhone` | Painel lateral de entrar/cadastrar |
| `PersonCelebrating` | Chamada final da landing |
| `PersonSearching` | Página 404 |

Dois tons de pele diferentes entre os personagens, de propósito, para não representar um público único.

## Mascote (Tiva)

**Parcial.** `src/components/mascot/tiva.tsx` tem os estados "boas-vindas" (`TivaWelcome`, último passo do onboarding, condicionado a `mascotEnabled`) e "pausa" (`TivaPause`, deitada e tranquila). Ambos SVG originais em formas simples, nunca baseados em personagem existente. Os estados "dica" e "comemoração" mencionados no PROMPT MESTRE ainda não existem.

A mascote vive só dentro do produto. As telas públicas (landing, entrar, cadastrar, 404) usam as ilustrações de pessoas acima: uma capivara não comunica "esta é a sua rotina financeira" tão bem quanto uma pessoa usando o app, e o dono pediu explicitamente personagens humanos nessas telas.

## Fotos (landing)

Buscadas no Unsplash, com confirmação individual do domínio e da licença de cada foto **antes** de baixar. **Atenção para quem for buscar a próxima**: `images.unsplash.com` é a licença gratuita; `plus.unsplash.com` é a camada paga Unsplash+, e resultados marcados "Getty Images (Premium)" na busca também são pagos. Duas candidatas já foram descartadas por isso ao longo do projeto.

| Arquivo em `public/images/` | Origem | Autor | Licença |
|---|---|---|---|
| `portrait-user.jpg` | https://unsplash.com/photos/Op66j3yM28M | HamZa NOUASRIA (@hamza01nsr) | Unsplash License (uso comercial livre, sem exigência de atribuição) |

Usada na seção "Conheça a plataforma", recortada em círculo, com cartões do produto sobrepostos. Essa pessoa não é cliente da Setiva: é foto de banco de imagens, usada conforme a licença permite. Não usar em contexto que sugira depoimento, número de clientes ou identidade real associada ao produto.

Fotos removidas ao longo das revisões de design, todas por não dizerem nada sobre o produto (cena genérica de café/notebook em vez de uma pessoa ou da própria tela): `hero-planning.jpg`, `feature-hands-coffee.jpg`, `feature-phone-outdoors.jpg`. Os espaços que elas ocupavam viraram peças da própria interface (abaixo) ou ilustrações de personagem.

## Mockups de interface (landing)

`src/components/marketing/product-mockup.tsx` recria trechos reais de tela do produto em HTML/CSS puro: o resumo do dia em celular (`PhoneMockup`), a agenda do mês (`AgendaMockup`, a tela que dá nome ao "mapa do mês"), a fatura do cartão (`CardsMockup`) e os orçamentos por categoria (`BudgetMockup`). Não são capturas de tela nem imagens, então não têm questão de licenciamento. Usam a paleta de marca com valores fixos, independentes do tema claro/escuro do visitante, de propósito: assim aparecem sempre como o app aparece no tema padrão, do mesmo jeito que uma captura de tela apareceria. Os números exibidos são exemplos ilustrativos, não dados de um cliente real.
