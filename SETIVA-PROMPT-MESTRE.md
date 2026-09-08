# Setiva: prompt mestre para Claude Code

Instruções preparadas em 08/09/2026. Este arquivo especifica o trabalho a executar. Não representa um aplicativo implementado ou validado.

## Preparação no Windows

1. Tenha Git para Windows, Node.js LTS e Claude Code instalados. Se já funcionam, não reinstale. Instalações oficiais: https://git-scm.com/downloads/win e https://nodejs.org/en/download.
2. No CMD, confira `git --version`, `node --version`, `npm --version` e `claude --version`.
3. Se faltar somente o Claude Code, execute no CMD o instalador oficial abaixo. Depois feche e reabra o terminal.

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

4. Se já existe um projeto Setiva ou finance-saas, abra essa pasta. Não crie um segundo aplicativo por engano. Use `cd /d "CAMINHO_REAL_DO_PROJETO"`, substituindo o caminho. Se está começando do zero, escolha uma pasta vazia, por exemplo:

```bat
mkdir "%USERPROFILE%\setiva"
cd /d "%USERPROFILE%\setiva"
```

5. Salve este arquivo na raiz dessa pasta. Ainda não execute create-next-app: o Claude deve verificar o que existe antes de criar a estrutura.
6. Instale os plugins oficiais uma vez, pelo CMD:

```bat
claude plugin marketplace add anthropics/skills
claude plugin install example-skills@anthropic-agent-skills
claude plugin marketplace add supabase/agent-skills
claude plugin install supabase@supabase-agent-skills
claude plugin install postgres-best-practices@supabase-agent-skills
```

O pacote da Anthropic disponibiliza frontend-design e webapp-testing. As duas skills do Supabase cobrem integração e PostgreSQL. Instalar um pacote não significa carregar todas as suas skills em cada tarefa. Não instale coleções adicionais agora. Se uma instalação falhar, informe o erro ao Claude para conferir a documentação e prosseguir com o que estiver disponível.

7. No painel do projeto Supabase, obtenha Project URL e Publishable key pelo diálogo Connect ou pelas configurações de API. Na raiz do projeto, crie `.env.local` com:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=COLE_A_URL_DO_SEU_PROJETO
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=COLE_A_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Substitua os valores. Não coloque service_role, secret key ou senha do banco em variável NEXT_PUBLIC. Não é necessário enviar senha do banco ao Claude para ele escrever migrations. A publishable key é destinada ao cliente; a proteção dos dados depende também das políticas RLS e da autorização correta.

8. Em Supabase Auth, configure o Site URL de desenvolvimento e as URLs de retorno locais exigidas pelas rotas que o Claude implementar. Ele deve entregar os caminhos exatos no guia SUPABASE-SETUP.md. Mantenha confirmação de email habilitada. Configure domínio de produção, retornos e SMTP antes de liberar cadastro público. Não confunda login funcionando em desenvolvimento com entrega de emails validada em produção.
9. Abra o Claude e envie a instrução curta abaixo. Use o modo que permite editar e executar comandos. Não deixe em um modo que somente planeja.

```bat
claude
```

```text
Leia SETIVA-PROMPT-MESTRE.md. Execute integralmente o PROMPT MESTRE deste arquivo no projeto atual. Comece pelo diagnóstico e implemente na sequência, sem parar na entrega de um plano. Reaproveite o que já funciona, use as skills instaladas quando relevantes e deixe as migrations separadas para eu aplicar manualmente no Supabase. Registre o progresso para conseguir retomar sem repetir trabalho.
```

Se precisar reiniciar o computador, entre na mesma pasta e execute `claude --continue` para retomar a conversa mais recente. O arquivo de progresso abaixo também permite reconstruir o estado se a conversa não estiver disponível.

---

# PROMPT MESTRE

## 1. Missão e definição de sucesso

Você está implementando Setiva, um aplicativo web responsivo de finanças pessoais para o Brasil. Quero profundidade funcional comparável às necessidades atendidas por Contas Online e Organizze, com identidade visual original, dados reais no Supabase e acabamento profissional. A referência é a abrangência de problemas resolvidos, sem copiar marca, textos, imagens, componentes ou composição de telas.

Meu objetivo é ter a versão mais completa, funcional e verificável possível hoje. Execute o trabalho, não me entregue somente sugestões, arquitetura ou um protótipo visual. O prazo orienta eficiência, mas não autoriza cálculos errados, falsos testes, botões decorativos ou alegações de produção sem evidências. Não reduza silenciosamente o escopo. Se houver limite de tempo, contexto, ferramentas ou serviços externos, mantenha uma lista precisa de concluído, pendente e bloqueado. Um módulo só está concluído quando interface, persistência, regras e verificação estão conectadas.

Tome decisões de implementação autonomamente. Pergunte apenas quando faltar acesso indispensável, houver risco real de perda de dados ou uma decisão comercial/legal depender do proprietário. Agrupe perguntas de configuração em uma única lista curta. Continue os itens independentes enquanto aguarda. Não use aprovação de cada tela como rotina.

## 2. Primeiro: diagnóstico curto e preservação

Leia CLAUDE.md, AGENTS.md, package.json, lockfile, estrutura de rotas, migrations e estado do Git, se existirem. Verifique o estado das variáveis sem imprimir seus valores. Respeite trabalho existente e instruções aplicáveis. Não apague o aplicativo, não reinicialize banco, não force reset de Git e não substitua um módulo funcional apenas para reorganizar pastas.

Este documento define a direção atual do produto. Registre conflitos com decisões anteriores e resolva preferências de produto pela instrução atual. Não altere regras de acesso ou permissões para contornar restrições. Não repita naming, criação de equipes ou governança extensa.

Se a pasta estiver vazia, crie o projeto com versões estáveis compatíveis após conferir documentação oficial. Como ela pode conter este prompt, configure um scaffold temporário e copie somente os arquivos necessários se o gerador exigir pasta vazia. Nunca exclua este documento nem `.env.local` para satisfazer o gerador.

Crie docs/PROGRESS.md com fases, decisões, alterações do banco, testes executados e próximo passo. Mantenha CLAUDE.md curto, com comandos e invariantes. Evite duplicar a especificação em vários arquivos.

## 3. Economia de tokens e tempo

Use frontend-design para direção visual e componentes de assinatura, webapp-testing para fluxos no navegador, supabase para Auth/SSR/Storage e supabase-postgres-best-practices para schema/RLS/queries. Confirme a disponibilidade real; não afirme usar uma skill inexistente. Leia referências específicas quando necessárias. Se algo não estiver instalado, use documentação oficial e registre a limitação sem bloquear trabalho independente.

Trabalhe por entregas verticais: banco, regra, interface e teste do mesmo fluxo. Reutilize componentes, validadores, consultas e formulários. Não crie 12 agentes nem faça cada especialidade analisar o repositório inteiro. Se instruções locais exigirem agentes, delimite arquivos e resultados para evitar leituras repetidas e conflitos.

Pesquise documentação somente onde reduz dúvida concreta. Use buscas direcionadas; não despeje node_modules, bundles, lockfiles ou logs completos no contexto. Rode testes focados durante implementação e a suíte necessária ao final. Não execute builds repetidos sem alteração relevante. Não troque bibliotecas por preferência estética depois que uma integração funciona.

Use o modelo de implementação disponível com melhor equilíbrio de custo e capacidade. Se houver recurso de seleção, reserve raciocínio mais caro para arquitetura financeira, segurança e bugs difíceis. Não invente nomes de modelos, preços ou comandos. Não prometa percentual de economia.

Atualize PROGRESS.md antes de encerrar ou compactar o contexto. Em retomadas, leia o progresso e os arquivos relevantes em vez de replanejar tudo. Uma única especificação persistida orienta a execução inteira.

## 4. Produto: decisões financeiras que o Setiva ajuda a tomar

Antes de codificar as regras, produza docs/FINANCIAL-MODEL.md conciso, com definições, fórmulas, exemplos, limitações e fontes. Faça pesquisa delimitada em materiais oficiais de educação financeira do Banco Central e documentação pública dos concorrentes. Separe fatos consultados de hipóteses próprias de produto. Não alegue pesquisa com usuários, estudos clínicos, conformidade ou superioridade comprovada.

O diferencial é responder com dados da própria pessoa:

1. Quanto ainda posso gastar neste mês considerando compromissos cadastrados?
2. Em quais dias meu saldo pode ficar negativo antes da próxima entrada?
3. Quais despesas mudaram e que ajuste cabe na minha realidade?
4. Quanto falta para minha meta e como uma mudança altera o prazo?
5. O que preciso revisar agora, sem vasculhar dez relatórios?

Construa o Mapa do mês: uma linha do tempo de entradas, pagamentos, faturas e saldo projetado diário. Mostre saldo atual, compromissos pendentes, dinheiro reservado e margem estimada separadamente. Explique a composição por interação, inclusive a diferença entre valor confirmado e previsto.

Não crie score arbitrário de saúde financeira nem trate limite de cartão como renda. Não interprete ausência de lançamentos como economia. Dados insuficientes devem gerar uma orientação específica para completar o cadastro, não uma conclusão inventada.

## 5. Direção visual obrigatória

Conceito: um caderno financeiro contemporâneo com mapa temporal e uma identidade acolhedora de marca. Composição editorial, assimetria controlada, tipografia expressiva nos títulos, densidade útil nas áreas operacionais e fotos bem escolhidas. Evitar aparência de template de SaaS.

Paleta inicial definida: papel quente #F4F1E8, tinta #202A25, verde oliva profundo #46533A, lima suave #DCEB9B, argila #B9674F e azul névoa #CCDCE3. Oliva ancora a marca; argila e azul distinguem contextos; lima destaca ações. Valide contraste e ajuste os tokens necessários. Cor de marca não substitui cores semânticas de erro, sucesso e alerta. Não usar roxo, dourado ou gradientes neon como solução padrão.

Use no máximo duas famílias tipográficas licenciadas: uma com personalidade nos títulos e outra muito legível em formulários e tabelas, com números tabulares. Pode escolher entre fontes abertas após conferir licença e carregamento. A escolha final deve ser única e registrada, sem me pedir para escolher entre cinco layouts.

Desktop: cabeçalho compacto com marca e seletor de período; navegação principal em cápsula flutuante central com Hoje, Movimentações, Planejar e Visão geral. Configurações pelo perfil e ação explícita de Novo lançamento, sempre na mesma posição contextual. Navegação interna dos módulos com abas e breadcrumbs quando úteis. Não usar sidebar fixa ocupando toda a lateral.

Mobile: navegação inferior de quatro destinos com texto e ícone, respeitando área segura, com criação de lançamento acessível e sem cobrir dados. Não comprima a navegação desktop. Formularios complexos podem ocupar tela inteira; lançamentos rápidos podem usar um painel adaptado à tela.

Dashboard: área principal ampla com previsão do mês e linha do tempo; uma faixa de próximos compromissos; visão visual das contas; uma sugestão explicável; acesso a metas e revisão semanal. Evitar grade de quatro cards iguais no topo seguida de gráficos genéricos. A diferença está na composição, não em esconder ações ou trocar a posição de salvar entre telas.

Tokens de espaço, raio, sombra, tipografia e cor devem atender todo o aplicativo. Customize primitivas do shadcn/Radix; não entregue o estilo padrão inalterado. Gráficos devem compartilhar a mesma linguagem visual, com alternativas em tabela.

## 6. Imagens, ícones, avatares e mascote

Use fotos reais licenciadas de cenas cotidianas e objetivos: casa, viagem, estudo, lazer e pequenos planos. Pessoas diversas em situações naturais, sem alegar que são clientes do Setiva. Landing com imagem principal e duas ou três composições secundárias; onboarding com imagens por tema; metas com capas opcionais. Dentro de tabelas financeiras, priorize leitura, não decoração.

Busque em fontes cuja licença comercial possa ser verificada. Não use Google Imagens como autorização de uso. Baixe e otimize ativos permitidos, mantenha dimensões, alt e créditos exigidos. Registre URL de origem, autor, licença e arquivo em docs/ASSETS.md. Não use links aleatórios, URLs temporárias, marcas-d'água ou hotlink frágil. Se não conseguir baixar imagens, entregue uma alternativa local honesta e registre o que faltou; nunca afirme que fotos foram incluídas se não foram.

Use uma biblioteca consistente de ícones SVG, como Lucide, depois de confirmar integração e licença. Ícones decorativos ficam ocultos para leitores de tela; ações possuem nomes acessíveis. Zero emojis em qualquer tela.

Avatares: use DiceBear localmente, com seed aleatória persistida e estilos cuja licença foi verificada individualmente. Não derive seed de email, CPF ou nome completo. Ofereça pelo menos 24 variações organizadas em três famílias visuais coerentes. Se as licenças dos estilos escolhidos exigirem atribuição, implemente os créditos. Alternativa de foto própria com recorte, compressão, validação e remoção.

Sugira apelidos editáveis sem associação a riqueza, raça, aparência ou condição financeira. Exemplos de direção: Capivara do Café, Gato de Domingo, Raposa de Mochila, Pinguim de Férias. O usuário pode usar seu próprio nome. Apelido não é identificador único nem autenticação. Os estilos disponíveis devem realmente corresponder às famílias exibidas; não chame um avatar humano de animal sem relação visual.

Mascote original discreto: Tiva, uma pequena capivara em formas simples, desenhada em SVG próprio se não houver ferramenta de ilustração. Estados de boas-vindas, dica, comemoração e pausa. Não copiar personagens existentes. Não tratar ilustração simples como fotografia gerada. Mascote opcional, desativável, nunca sobreposto a formulários ou números importantes.

## 7. Movimento e acessibilidade

Use Motion quando adequado e CSS para transições simples. Entradas suaves, mudança de etapas, cartão de conta aparecendo após salvar, seleção de avatar com retorno visual, transição de períodos e confete breve ao concluir onboarding ou meta. Transições de aproximadamente 120 a 250 ms; animações de celebração curtas e não repetitivas. Waves discretas em áreas institucionais, sem movimento constante atrás de conteúdo financeiro.

Respeite prefers-reduced-motion e configuração interna de reduzir animações. Nada de bloqueio por animação ou som automático. Operação por teclado, foco visível, labels reais, mensagens associadas ao campo, diálogos com foco controlado, alvos de toque confortáveis e contraste WCAG AA. Não diferenciar ganhos e gastos somente por cor. Testar 360, 390, 768 e 1440 px sem overflow horizontal de página.

## 8. Linguagem e conteúdo final

Português brasileiro natural. Zero emojis. Não usar travessões ou hífens como recurso estilístico nos textos de interface. Isso não proíbe sinal matemático de menos, sintaxe de código, identificadores ou ortografia necessária. Não fazer substituição automática que corrompa valores negativos.

Proibidos: lorem ipsum, textos de template, depoimentos inventados, quantidades falsas de clientes, selos de segurança sem fundamento, 'revolucione suas finanças', 'desbloqueie seu potencial', 'em breve' como tela vazia e comentários internos expostos ao usuário.

Escreva conteúdo específico para cada etapa, estado vazio, erro, sucesso, ajuda e confirmação. Exemplos de tom: 'Veja o que cabe no seu mês', 'Qual conta você usa para receber?', 'Esse valor já saiu da sua conta?', 'Seu mês começa aqui'. Não transformar esses exemplos em slogans repetidos em toda parte.

Não prometer economia fixa, integração bancária inexistente ou investimento com retorno garantido. Exemplos educativos devem ser identificados como exemplos. Dados fictícios somente em demonstração isolada e explicitamente identificada, nunca dentro da conta real de quem acabou de se cadastrar.

## 9. Stack e organização

Preferência para projeto novo: Next.js App Router, TypeScript strict, Tailwind CSS, primitivas acessíveis shadcn/Radix, Supabase PostgreSQL/Auth/Storage, React Hook Form e Zod, biblioteca de gráficos adequada, Motion, Vitest e Playwright. Confirme compatibilidade atual e preserve versões boas em projeto existente. Um gerenciador de pacotes e um lockfile.

Não criar microserviços, backend paralelo em outra linguagem, Redux desnecessário ou ORM extra sem necessidade concreta. Use server components por padrão onde faz sentido e client components somente para interação. Separar domínio financeiro puro, acesso ao banco, componentes e validação.

Dinheiro não usa aritmética de ponto flutuante. Preferir centavos inteiros com restrições e limites, ou numeric com conversão decimal segura. Tipar dados do banco; marcar tipos provisórios até geração contra schema aplicado. Validar no servidor, não apenas no browser. Nunca confiar em user_id enviado pelo cliente.

Supabase SSR com clientes distintos de servidor e navegador e validação de identidade conforme documentação da versão instalada. Não confiar somente na presença de cookie ou getSession para autorização. Não compartilhar cache de dados privados entre usuários. Nenhuma chamada de LLM é necessária para os cálculos e sugestões da primeira versão.

## 10. Banco e migrations: entregar primeiro

O projeto Supabase já existe. Você vai preparar SQL em arquivos separados para eu aplicar manualmente. Não executar migrations no banco remoto, db push, reset ou alterações pelo MCP. Não assumir que o banco existente está vazio. Se não houver schema disponível, explicitar a premissa e entregar consulta de inspeção somente leitura antes da aplicação.

Diretório canônico: supabase/migrations. Nomes com timestamp real e sufixo descritivo, em ordem. Separar responsabilidades, por exemplo:

1. profiles e preferências, com vínculos a auth.users.
2. categorias, instituições e contas.
3. lançamentos, transferências e integridade de saldos.
4. cartões, compras parceladas, faturas e pagamentos.
5. recorrências e geração de ocorrências.
6. orçamentos, metas, contribuições e dívidas.
7. onboarding, notificações e preferências de ajuda.
8. importações, auditoria mínima e consentimentos versionados.
9. storage policies, índices e funções adicionais que dependam das anteriores.

Toda migration que introduz tabela privada já deve ativar RLS, definir privilégios e suas policies na mesma unidade transacional, antes de qualquer acesso pela aplicação. Não deixar a proteção apenas para o último arquivo. Tabelas públicas de referência precisam de leitura e escrita explicitamente delimitadas.

Use auth.uid() e autorização consistente em leitura, inserção, edição e exclusão. Garanta também propriedade de entidades relacionadas: um lançamento não pode apontar para conta, categoria privada, cartão ou meta de outro usuário. Não basta proteger só a linha filha. Use constraints compostas, validação transacional ou mecanismo equivalente verificável.

Funções financeiras devem validar proprietário, entradas e concorrência. SECURITY DEFINER somente quando indispensável, com search_path controlado, privilégios mínimos e prevenção de contorno de RLS. Regras idempotentes em onboarding, transferências, importação, geração de parcelas e recorrências.

Entregue docs/SUPABASE-SETUP.md com a lista exata de arquivos e ordem; pré-condições; o que colar no SQL Editor; resultado esperado; consultas de verificação; configuração de Auth e Storage; instruções para projeto vazio e banco existente. Seeds de desenvolvimento ficam separados e jamais inserem gastos fictícios em contas reais.

Explique que execução manual no SQL Editor não mantém automaticamente o histórico da CLI. Escolha o fluxo manual como padrão pedido e documente uma futura reconciliação verificada de histórico antes de qualquer db push. Não misture rotas de aplicação silenciosamente. Não use IF NOT EXISTS para esconder divergências de schema. Não recomendar rodar tudo novamente ao ocorrer erro; identificar o último arquivo aplicado e a causa.

Disponibilize essas migrations cedo, antes de gastar todo o tempo em acabamento. Se eu ainda não as apliquei, continue UI e testes locais possíveis, mas não anuncie integração real validada. Fixtures de teste são isoladas do caminho de produção.

## 11. Invariantes financeiros

Saldo inicial tem data de corte; lançamentos anteriores não podem ser contados novamente. Ajustes de saldo são explícitos e auditáveis. Saldo realizado usa movimentos efetivados; previsto considera os pendentes do horizonte, sem duplicação.

Receita, despesa e transferência são conceitos distintos. Transferir entre contas próprias não aumenta receita nem despesa, precisa ser atômico e conservar o total. Repetir requisição não duplica lançamento. Edição ou exclusão de transferência atualiza ambos os lados na mesma transação.

Compra no cartão participa de despesas por competência, mas não reduz saldo bancário na data da compra. Pagamento de fatura reduz caixa e dívida do cartão, sem contar a compra outra vez como despesa. Relatórios distinguem competência e caixa. Estorno, cancelamento e pagamento parcial têm regras explícitas e testes. Juros são lançamentos reais informados; nunca presumir taxa do banco.

Fechamento e vencimento são configuráveis. Defina o tratamento de compra no dia do fechamento; apresente a fatura de destino e permita correção. Parcelamento distribui centavos sem perda, preserva soma e contempla meses curtos. Ocorrências mensais em dia 29, 30 ou 31 são ajustadas ao último dia válido, preservando o dia âncora das próximas. Datas civis financeiras usam tipo date quando apropriado; timestamps de auditoria usam timezone. Padrão de exibição America/Sao_Paulo, configurável.

Recorrência não cria pagamentos fictícios. Gera ocorrências previstas com unicidade e só efetiva por ação explícita, salvo opção de efetivação automática conscientemente habilitada. Deve funcionar por materialização idempotente no período consultado ou scheduler realmente configurado; não depender de job imaginário. Edição oferece somente esta ocorrência ou próximas; histórico não muda silenciosamente.

Orçamentos têm categoria, período, limite e realizado. Avisos são calculados com gastos reais; não duplicar despesas de cartão e fatura. Metas distinguem dinheiro já reservado, intenção futura e transferência de caixa. Vincular reserva a conta não cria patrimônio novo. Dívidas distinguem principal, encargos informados, pagamentos e saldo; ausência de taxa não autoriza projeção de juros.

Excluir ou arquivar entidades com histórico preserva integridade e explica impacto. Não apagar lançamentos em cascata ao remover uma categoria. Importação usa prévia, mapeamento, normalização pt-BR, detecção de duplicatas e confirmação. Duplicatas ambíguas são apresentadas; não excluir uma compra legítima só por coincidir data e valor. CSV exportado deve neutralizar fórmulas perigosas em campos de texto.

## 12. Cadastro e onboarding completo

Cadastro acessível com email, senha, confirmação, recuperação de acesso, reenvio com limite e tratamento de sessão expirada. Não mostrar OAuth se não estiver configurado. Formulários com preenchimento automático do navegador adequado, opção de mostrar senha e estados de erro que não exponham contas existentes.

Após criar conta e estabelecer sessão válida, onboarding progressivo, salvável e retomável, com indicador de etapa. Nome e avatar podem ser escolhidos já no cadastro, usando metadados seguros; dados financeiros só são persistidos com usuário autenticado. Não tentar escrever como autenticado antes de confirmar email quando isso for exigido.

Etapas:

1. Como você quer ser chamado? Nome de exibição, avatar ou foto e apelido opcional.
2. O que quer organizar primeiro? Gastos do mês, evitar atrasos, guardar, quitar dívidas ou visualizar tudo. Pode marcar mais de um.
3. Como entra seu dinheiro? Renda fixa ou variável, fontes, valor estimado, frequência e datas. Valores incertos ficam identificados.
4. Onde seu dinheiro fica? Banco ou carteira, nome da conta, tipo, saldo e data de referência. Busca por instituição com alternativa manual. Catálogo local e atualizável; eventual API externa nunca bloqueia cadastro. Não dizer que existe conexão ao banco.
5. Usa cartão? Banco, apelido, limite, fechamento, vencimento e compromissos existentes. Não solicitar número completo, CVV ou senha. Cartões visuais funcionais, não imitações exatas de marcas.
6. Quais contas fazem parte do seu mês? Sugestões editáveis e campo livre com Enter para adicionar várias. Valor, categoria, vencimento, frequência e conta opcional. Mostrar aluguel, internet e transporte como sugestões, sem cadastrar valores automaticamente.
7. Há parcelas ou dívidas em andamento? Saldo, parcelas restantes, próximo vencimento e encargos conhecidos. Permitir pular. Distinguir parcela já incluída na fatura para impedir duplicação.
8. Onde você quer colocar limites? Categorias selecionadas, valores sugeridos a partir dos dados existentes e aprovação explícita. A soma dos limites não é uma cobrança prevista adicional.
9. Quanto quer guardar e para quê? Meta, prazo, valor já reservado e aporte desejado. Sugestão baseada na margem estimada, sem impor regra de porcentagem única.
10. Deixe com a sua cara. Tema, densidade, privacidade de valores, primeiro dia da semana, animações, mascote e lembretes internos. Não solicitar permissão de notificações externas sem função implementada.
11. Confira seu primeiro mês. Resumo editável do que será criado, incluindo renda, saldos, vencimentos, limites e metas; alertas de inconsistência compreensíveis.
12. Boas-vindas. Finalização atômica e idempotente, confete breve opcional e CTA para o mapa do mês já preenchido com os dados informados.

Não obrigar renda, dívida ou foto para entrar. Não confundir pular com registrar zero. Não fazer a pessoa perder tudo ao voltar uma etapa ou recarregar. O cadastro inicial cria registros de verdade nos módulos correspondentes. Onboarding não é um JSON isolado que o resto do aplicativo ignora.

Depois do onboarding, oferecer passeio guiado curto com até cinco pontos, opção de pular e reabrir na ajuda. Explicar mapa, novo lançamento, fatura, orçamento e meta sobre componentes reais. Disponibilizar guias mais completos sob demanda, não uma sequência obrigatória de vinte popups.

## 13. Telas e módulos que devem funcionar

Públicas: landing editorial completa, como funciona, recursos, perguntas frequentes, login, cadastro, confirmação, recuperação, termos, privacidade e créditos. Não inventar planos, preços ou suporte. Sem política comercial definida, CTA de criar conta sem promessa de gratuidade permanente e sem checkout cenográfico.

Autenticadas:

1. Hoje: mapa do mês, realizado e previsto, próximos compromissos, sugestão acionável e revisão semanal.
2. Movimentações: tabela responsiva, busca, filtros combináveis, paginação, criação, edição, exclusão confirmada, transferência e ações em lote adequadas.
3. Contas: cartões de contas, saldo, histórico, conciliação manual e arquivamento.
4. Cartões: configuração, compras, parcelamento, faturas abertas e fechadas, pagamento integral/parcial e estornos.
5. Calendário: vencimentos, recebimentos e saldo projetado por dia, com navegação para itens.
6. Planejamento: orçamentos por categoria, metas e projeção de aportes.
7. Recorrências: receitas, contas e assinaturas, próximas ocorrências e edição de série.
8. Dívidas: saldos, parcelas e plano de pagamento com premissas editáveis.
9. Relatórios: evolução de receitas/despesas, categorias, comparação de períodos, patrimônio e caixa versus competência, com filtros consistentes e exportação.
10. Importar e exportar: CSV com prévia, mapeamento de colunas, detecção de duplicatas, resultado e reversão segura do lote quando não houver dependências posteriores. Se houver, explicar e bloquear reversão destrutiva.
11. Sugestões: cartões de oportunidade explicáveis com simulação e ação real para orçamento, meta ou revisão de recorrência.
12. Central de notificações internas: próximos vencimentos, limites e marcos de metas, lido/não lido e preferências.
13. Ajuda: primeira conta, primeiro lançamento, cartão, parcelamento, transferência, orçamento, meta, importação e leitura de previsão, com links diretos e exemplos identificados.
14. Configurações: perfil/avatar, tema claro/escuro/sistema, densidade, exibição de centavos, valores ocultos, animações, mascote, categorias, notificações internas, senha, logout, exportação dos dados e exclusão da conta.

Cada tela deve ter loading, conteúdo, vazio útil e erro recuperável. Nenhuma rota de módulo pode ser apenas um título. Configuração exibida precisa persistir e alterar o comportamento. Filtros e período precisam refletir nos totais e exportação. Não mostrar botão de baixar PDF se somente CSV foi implementado.

Escopo de hoje é web responsiva. Open Finance automático, conectores de bancos, aplicativo nativo, cobrança SaaS e cotações em tempo real exigem trabalho e dependências próprios. Não os simule nem anuncie como disponíveis. Registro manual completo e importação CSV são caminhos reais. Histórico de investimentos pode ser informado manualmente como posição patrimonial, sem confundir valorização com entrada de caixa.

## 14. Motor de sugestões e simulações

Implemente regras determinísticas auditáveis. Cada sugestão possui dados usados, período, fórmula, hipótese, impacto estimado e ação. Usuário pode dispensar, adiar ou alterar premissas. Não mostrar 'IA analisou' se é cálculo local.

Margem estimada do mês: saldo líquido disponível hoje + entradas pendentes selecionadas até o fim do período − saídas pendentes até o fim do período − reserva protegida ainda contida no saldo disponível. Um valor já segregado fora desse saldo não é subtraído novamente. Orçamento não gasto é um limite, não uma saída pendente adicional. Mostrar separadamente folga contratada e cenário de gasto variável estimado.

Ofereça cenário confirmado e cenário incluindo renda esperada. Teste a linha diária: terminar o mês positivo não significa que todos os vencimentos cabem antes da próxima renda. Se houver dia negativo, o alerta temporal tem prioridade. Projeção nunca promete segurança ou garantia.

Sugestões concretas: revisar aumento em categoria comparável; visualizar soma de assinaturas cadastradas; reservar aporte compatível com margem; lembrar despesa anual; alertar concentração de vencimentos; simular redução de gasto opcional escolhida pelo usuário. Comparações usam períodos equivalentes e indicam histórico incompleto. Não presumir que uma assinatura está sem uso apenas por haver cobrança.

Simulador 'E se eu mudar isso?': alterar valor de despesa, aporte ou data prevista e recalcular caixa e prazo de meta sem salvar. Exigir ação explícita para aplicar mudanças. Diferenciar antecipação de pagamento de desconto efetivamente oferecido. Não recomendar produto financeiro específico ou regras tributárias improvisadas.

Apresentar números positivos e difíceis com respeito. Nada de culpa por gastar, ranking de riqueza ou gamificação que pressione aportes. Celebrações são por organização e objetivos definidos pela própria pessoa.

## 15. Privacidade, termos e segurança operacional

Criar termos e política de privacidade específicos para funcionalidades realmente implementadas. Não inventar razão social, CNPJ, contato, base legal, prazo de retenção, certificação ou parecer jurídico. Usar configuração tipada para dados do operador. Se faltarem informações essenciais, preparar o conteúdo e listar bloqueio de publicação no relatório interno. Não expor placeholders num site público nem alegar validade jurídica automática.

Registrar versão e data dos termos apresentados/aceitos quando aplicável. Não tratar todo tratamento de dados como consentimento obrigatório nem misturar marketing com criação de conta. Não instalar rastreamento de terceiros sem necessidade. Dados financeiros não devem aparecer em logs, analytics, URLs ou mensagens de erro. Segredos só no servidor e fora do Git.

Upload: tamanho/tipo limitados, verificação de conteúdo, nomes aleatórios, políticas por proprietário e processamento seguro. Preferir raster para foto enviada; SVG de usuário não é aceito sem sanitização especializada. Remover metadados desnecessários e garantir exclusão do ativo ao removê-lo conforme fluxo definido.

Excluir conta deve exigir reautenticação/confirmacão adequada e tratar registros, storage e Auth de forma recuperável contra falha parcial. Se precisar chave privilegiada, documentar env somente de servidor e nunca expô-la ao browser. Não mostrar sucesso antes de concluir a operação. Exportação deve coletar apenas dados do titular.

Rate limiting real para operações sensíveis conforme infraestrutura disponível, sem fingir que contador em memória de função serverless é proteção distribuída. Validar redirecionamentos, permissões de funções, tamanho dos payloads e origem de ações quando aplicável. Revisar dependências e registrar achados relevantes sem quebrar o projeto com atualizações forçadas indiscriminadas.

## 16. Desempenho e produção

Paginar listas; indexar filtros por proprietário e data; evitar consultas N+1; agregar no servidor onde apropriado; otimizar imagens e lazy loading. Não enviar toda a vida financeira ao browser para filtrar uma tela. Evitar bibliotecas grandes para uma única animação.

Gerar `.env.example` sem segredos, README com setup, scripts reais de dev/build/test, CI de verificações essenciais, documentação de deploy e configuração de Auth/SMTP. Se houver service worker/PWA, nunca cachear respostas autenticadas sensíveis de forma compartilhada. PWA é opcional; não criar sincronização offline financeira improvisada.

Tratar erros de rede, sessão expirada, banco indisponível, duplicação de clique e concorrência. Pagamentos e transferências devem retornar estado consistente. Mensagem de sucesso somente depois da confirmação do servidor.

Sem domínio/hosting configurado, deixar o deploy preparado e documentar o passo exato. Não declarar publicado. Sem SMTP validado, não declarar cadastro público operacional. Sem migrations aplicadas, não declarar persistência ponta a ponta verificada. Não executar publicação externa sem autorização correspondente.

## 17. Verificação obrigatória

Escreva testes de domínio relevantes, não testes que apenas reproduzem a implementação. Casos mínimos:

1. Transferir R$ 100 entre duas contas conserva o patrimônio e não vira receita/despesa.
2. Compra de R$ 100 no cartão e pagamento da fatura geram R$ 100 de despesa, não R$ 200.
3. R$ 100 divididos em três parcelas somam exatamente R$ 100.
4. Regra mensal em dia 31 atravessa fevereiro e volta ao dia âncora seguinte.
5. Repetir conclusão do onboarding ou geração de recorrências não duplica registros.
6. Renda incerta não aparece no cenário confirmado sem escolha explícita.
7. Saldo positivo no fim do mês não esconde dia intermediário negativo.
8. Reserva vinculada a conta não duplica saldo nem é descontada duas vezes.
9. Estorno, edição, cancelamento e pagamento parcial mantêm saldos coerentes.
10. Importar o mesmo lote não duplica lançamentos e não elimina falsos positivos silenciosamente.

Teste RLS com dois usuários reais de teste e cliente anônimo: negar leitura e escrita cruzada, vínculo a conta alheia, acesso indevido a Storage e RPC; permitir operações válidas. Não validar RLS usando somente service_role, pois ela pode contornar políticas.

Playwright: cadastro/confirmacão quando o ambiente permitir, login, retomada de onboarding, novo lançamento, transferência, compra parcelada, fatura, orçamento, meta, filtros, importação e logout. Use fixtures isoladas e descarte apenas os dados de teste criados. Se confirmação por email impedir automação, registre o trecho manual necessário sem afirmar que foi testado.

Inspecione screenshots reais de landing, cadastro, onboarding, dashboard e movimentações em desktop e mobile. Corrija overflow, contraste, foco, menus cobrindo conteúdo, gráficos vazios sem explicação, imagens quebradas e textos truncados. Não basta gerar screenshot; examine a renderização.

Rodar lint, typecheck, testes e build usando scripts existentes/criados. Não inventar resultado nem afirmar '100% seguro'. Se banco local exigir Docker ausente, testar o que for possível e registrar a validação SQL que depende desse ambiente. Não executar testes destrutivos no banco remoto do usuário.

## 18. Ordem de execução

A. Diagnóstico, modelo financeiro conciso, mapa de rotas e direção visual única.
B. Schema, RLS, migrations separadas e guia de configuração entregues cedo.
C. Auth, perfil e onboarding conectados a registros reais.
D. Contas, lançamentos, transferências e dashboard com cálculo real.
E. Cartões, faturas, parcelas e recorrências.
F. Orçamentos, metas, dívidas, sugestões e simulador.
G. Relatórios, importação/exportação, ajuda e configurações.
H. Landing, imagens, mascote, animações e conteúdo final, aproveitando o design já aplicado aos módulos. deixei algumas imagens do projeto (so as logos e icones na pasta C:\Users\matheus.artioli\Documents\Setiva\imagens utilize elas ) e deixei um arquivo para você saber aonde usar cada personagem
I. Testes financeiros, autorização, fluxos, revisão visual e preparação de publicação.

Aplicar o design desde as primeiras telas; não construir tudo cinza para redesenhar do zero depois. Não gastar horas na landing enquanto o lançamento básico não persiste.

## 19. Entrega e verdade sobre o estado

Ao terminar, entregar caminhos reais para migrations e docs, comando exato para abrir o app, status dos módulos, testes executados com resultados e pendências externas agrupadas. Separar claramente implementado, testado localmente, testado com Supabase e publicado. Não usar 'pronto para produção' como sinônimo de build passou.

Se algo depende de mim, informe: o que falta, onde configurar, valor ou arquivo esperado e qual verificação fazer depois. Não mandar uma lista vaga de 'configure o Supabase'. Não pedir mais prompts para trabalho já especificado aqui. Continue autonomamente até cumprir o escopo ou atingir um bloqueio real que esteja registrado.

Comece agora pelo diagnóstico breve e implemente. Não responda apenas com um plano.

---

## Fontes verificadas para esta preparação

Os detalhes de produto, paleta e fluxo acima são uma proposta original para o Setiva, não funcionalidades atribuídas aos serviços consultados. Reconfira versões e licenças no momento da instalação.

1. Claude Code, instalação: https://code.claude.com/docs/en/setup
2. Claude Code, custos e contexto: https://code.claude.com/docs/en/costs
3. Skills oficiais Anthropic e instalação: https://github.com/anthropics/skills
4. Frontend design: https://github.com/anthropics/skills/tree/main/skills/frontend-design
5. Web app testing: https://github.com/anthropics/skills/tree/main/skills/webapp-testing
6. Skills oficiais Supabase: https://github.com/supabase/agent-skills
7. Supabase SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
8. Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
9. DiceBear, licenças por estilo: https://www.dicebear.com/licenses/
10. Referência funcional Organizze: https://www.organizze.com.br/
11. Referência funcional Contas Online: https://www.contasonline.com.br/
12. Educação financeira do Banco Central, ponto de partida para a pesquisa do implementador: https://www.bcb.gov.br/cidadaniafinanceira
