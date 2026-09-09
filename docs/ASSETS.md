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

## Ícones de instituição (seletor de banco no onboarding)

`src/lib/institution-visuals.ts`. Onboarding pede para o usuário indicar o banco de cada conta (referência visual enviada pelo dono: grade de logos de banco). Verificado se havia logo real com licença livre para as 12 instituições do catálogo (`supabase/migrations/20260908100002...sql`); resultado, checado localmente instalando o pacote (depois removido, só usamos os 3 valores extraídos como constante):

| Instituição | Logo real? |
|---|---|
| Nubank, PicPay, Mercado Pago | Sim — path SVG e cor oficial extraídos do pacote `simple-icons` v16.30.0 (CC0 1.0 Universal; a licença cobre o desenho do ícone, a marca em si continua de cada empresa) |
| Carteira, Banco do Brasil, Caixa Econômica Federal, Bradesco, Itaú, Santander, Inter, C6 Bank, Outra instituição | Não — sem fonte com licença livre encontrada. Sigla curta sobre círculo colorido (paleta `cat-*` já usada nas categorias), nunca um logo recriado à mão (reproduziria marca registrada de terceiro sem licença verificada). |

Se uma fonte de logo com licença livre para os bancos tradicionais aparecer no futuro, atualizar `BY_NAME` em `institution-visuals.ts` seguindo o mesmo padrão dos três já resolvidos.

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

**Completa.** `src/components/mascot/tiva.tsx` tem os quatro estados pedidos pelo PROMPT MESTRE, todos SVG originais em formas simples, nunca baseados em personagem existente:

| Componente | Estado | Onde aparece |
|---|---|---|
| `TivaWelcome` | boas-vindas | Último passo do onboarding |
| `TivaTip` | dica (segurando uma lâmpada) | `/sugestoes`, ao lado do título, só quando há alguma sugestão para mostrar |
| `TivaCelebrate` | comemoração (patas para cima, confete) | `/planejar/metas`, no cartão de uma meta que atingiu 100% do valor alvo |
| `TivaPause` | pausa (deitada, "zzz") | Página 404 |

Todos condicionados à preferência `mascot_enabled` do perfil (nunca aparecem se o usuário desligou a mascote em Configurações).

A mascote vive só dentro do produto. As telas públicas (landing, entrar, cadastrar, 404) usam as ilustrações de pessoas acima: uma capivara não comunica "esta é a sua rotina financeira" tão bem quanto uma pessoa usando o app, e o dono pediu explicitamente personagens humanos nessas telas.

## Fotos (landing)

Buscadas no Unsplash, com confirmação individual do domínio e da licença de cada foto **antes** de baixar. **Atenção para quem for buscar a próxima**: `images.unsplash.com` é a licença gratuita; `plus.unsplash.com` é a camada paga Unsplash+, e resultados marcados "Getty Images (Premium)" na busca também são pagos. Duas candidatas já foram descartadas por isso ao longo do projeto.

| Arquivo em `public/images/` | Origem | Autor | Licença |
|---|---|---|---|
| `portrait-user.jpg` | https://unsplash.com/photos/Op66j3yM28M | HamZa NOUASRIA (@hamza01nsr) | Unsplash License (uso comercial livre, sem exigência de atribuição) |

Usada na seção "Conheça a plataforma", recortada em círculo, com cartões do produto sobrepostos. Essa pessoa não é cliente da Setiva: é foto de banco de imagens, usada conforme a licença permite. Não usar em contexto que sugira depoimento, número de clientes ou identidade real associada ao produto.

Fotos removidas ao longo das revisões de design, todas por não dizerem nada sobre o produto (cena genérica de café/notebook em vez de uma pessoa ou da própria tela): `hero-planning.jpg`, `feature-hands-coffee.jpg`, `feature-phone-outdoors.jpg`. Os espaços que elas ocupavam viraram peças da própria interface (abaixo) ou ilustrações de personagem.

## Capa de meta

Diferente de todo o resto deste documento, a capa de meta (`/planejar/metas`) **não é uma foto buscada por mim**: é um upload próprio do usuário (a foto que ele quiser, do próprio objetivo) via `src/actions/planning.ts` (`updateGoalCover`/`removeGoalCover`), guardada no bucket privado `goal-covers` que já existia desde a migration 9 (`docs/SUPABASE-SETUP.md`) mas nunca tinha UI. Path `{user_id}/{goal_id}.{ext}`, RLS já restringia cada usuário à própria pasta. Como o bucket é privado, a tela lê com `createSignedUrl` (validade de 1 hora, gerada a cada carregamento da página, nunca guardada). Por ser conteúdo do próprio usuário sobre a própria vida financeira, não há questão de licença a verificar aqui.

## Mockups de interface (landing)

`src/components/marketing/product-mockup.tsx` recria trechos reais de tela do produto em HTML/CSS puro: o resumo do dia em celular (`PhoneMockup`), a agenda do mês (`AgendaMockup`, a tela que dá nome ao "mapa do mês"), a fatura do cartão (`CardsMockup`) e os orçamentos por categoria (`BudgetMockup`). Não são capturas de tela nem imagens, então não têm questão de licenciamento. Usam a paleta de marca com valores fixos, independentes do tema claro/escuro do visitante, de propósito: assim aparecem sempre como o app aparece no tema padrão, do mesmo jeito que uma captura de tela apareceria. Os números exibidos são exemplos ilustrativos, não dados de um cliente real.
