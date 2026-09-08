# Setiva: modelo financeiro

Este documento define, em linguagem precisa, as fórmulas e conceitos que o Setiva calcula. Serve de referência para quem implementa e para quem revisa o código de domínio (`src/lib/finance/`). Separamos fatos consultados em fontes públicas de decisões de produto tomadas para este aplicativo.

## Fontes consultadas

Educação financeira geral (conceitos de orçamento, reserva de emergência, competência versus caixa) segue a linha da Cidadania Financeira do Banco Central (https://www.bcb.gov.br/cidadaniafinanceira), sem citar estudo específico nem número de pesquisa: são princípios amplamente estabelecidos de educação financeira, não uma citação textual de um documento único. A abrangência de funcionalidades (contas, cartões, faturas, recorrências, orçamentos, metas, dívidas, relatórios) é inspirada na cobertura funcional pública de Organizze e Contas Online, sem reproduzir texto, layout ou marca desses produtos. Nenhuma pesquisa com usuários, estudo clínico ou comprovação de eficácia é alegada.

## Decisões de produto (não são fatos externos)

Tudo abaixo desta linha é uma escolha de design do Setiva, não uma norma do Banco Central nem uma funcionalidade comprovada de terceiros.

### Dinheiro é inteiro

Todo valor monetário é armazenado em centavos inteiros (`bigint`, sufixo `_cents`). Nunca usamos `float`/`double` para dinheiro. Conversão para exibição (R$ 1.234,56) acontece só na camada de apresentação.

### Competência versus caixa

- **Competência**: quando o compromisso existe, independente de quando o dinheiro sai da conta. Uma compra parcelada no cartão é despesa por competência na data da compra (rateada pelas parcelas), não na data em que a fatura é paga.
- **Caixa**: quando o dinheiro efetivamente sai ou entra numa conta. Pagar a fatura do cartão é saída de caixa; a compra em si não é.
- Um relatório que soma "despesas do mês" por competência conta a parcela; um relatório de "saída de caixa do mês" conta o pagamento da fatura. Somar as duas visões incondicionalmente duplicaria a despesa — por isso `origin = 'card_invoice_payment'` nunca carrega categoria e é excluído das agregações por categoria de competência (ver `budget_progress` na migration 06).

### Saldo realizado de uma conta

```
saldo_realizado(conta, data) =
  saldo_inicial
  + soma(lançamentos completed, efetivados entre initial_balance_date e data)
```

Lançamentos anteriores a `initial_balance_date` nunca entram na soma — já estão embutidos no saldo inicial. Ver view `account_realized_balances`.

### Margem estimada do mês (Hoje / Mapa do mês)

```
margem_confirmada =
  saldo_realizado_hoje(todas as contas não arquivadas)
  + entradas_pendentes_confirmadas_ate_fim_do_periodo
  - saidas_pendentes_ate_fim_do_periodo
  - reserva_protegida_ainda_dentro_do_saldo
```

- "Entradas pendentes confirmadas" são ocorrências de recorrência de receita com `status = 'pending'` que o usuário marcou como certas (não estimativas). Renda incerta (declarada como variável/estimada no onboarding) só entra em um segundo cenário, nunca no confirmado, a menos que o usuário selecione explicitamente incluí-la.
- "Saídas pendentes" somam ocorrências de recorrência de despesa pendentes e faturas de cartão em aberto/fechadas não pagas (`upcoming_commitments`), sempre limitadas ao fim do período (padrão: fim do mês corrente, editável pelo seletor de período).
- "Reserva protegida" é a soma de `goals.reserved_cents` para metas cujo `linked_account_id` está entre as contas somadas no saldo — dinheiro que já está fisicamente na conta mas tem destino declarado. Uma meta com aporte do tipo `reserved` (sem conta vinculada) não é subtraída aqui, porque não está dentro do saldo bancário: é só uma intenção.
- Orçamento não gasto (limite menos realizado, se positivo) **não** entra como saída pendente: é um teto, não um compromisso.

```
margem_cenario_esperado = margem_confirmada + renda_estimada_incerta_selecionada_pelo_usuario
```

Os dois cenários são sempre mostrados lado a lado, nunca só o mais otimista.

### Linha diária do mês (detecção de dia negativo)

Para cada dia `d` do período, a partir de hoje:

```
saldo_projetado(d) = saldo_realizado_hoje
  + soma(entradas com due_date <= d)
  - soma(saídas com due_date <= d)
```

Se existe algum `d` com `saldo_projetado(d) < 0`, o alerta de "dia negativo" tem prioridade sobre qualquer mensagem de "mês fecha positivo" — terminar o mês no azul não significa que todos os vencimentos cabem antes da próxima renda, principalmente quando salário e aluguel, por exemplo, não caem no mesmo dia.

### Cartão de crédito

- **Compra**: cria `card_installments` vinculadas a `card_invoices`, nunca uma linha em `transactions`. Não afeta saldo bancário.
- **Fatura**: fecha no dia configurado (`closing_day`), ajustado ao último dia do mês quando o mês não tem esse dia (dia 31 em abril vira dia 30). Compra feita no dia do fechamento ou antes entra na fatura do mês corrente; depois do fechamento, entra na fatura seguinte.
- **Pagamento**: gera uma única saída de caixa (`transactions.origin = 'card_invoice_payment'`), sem categoria, que não é somada de novo nos relatórios de despesa por categoria.
- **Parcelamento**: `total_amount_cents` é dividido por `installments_count` com divisão inteira; o resto (em centavos) é distribuído nas primeiras parcelas, garantindo que a soma das parcelas seja sempre exatamente igual ao total, mesmo quando a divisão não é exata (ex: R$ 100,00 em 3x vira 33,34 + 33,33 + 33,33).

### Transferência entre contas próprias

Não é receita nem despesa. `public.create_transfer` cria duas pernas (`transfer_leg = 'out'` e `'in'`) na mesma transação SQL, então o patrimônio total do usuário (soma de todas as contas) não muda. Editar ou excluir usa `edit_transfer` / `delete_transfer`, que tocam as duas pernas juntas — nunca uma só.

### Recorrência

Uma recorrência é uma definição (valor, frequência, dia âncora). Ela não é um pagamento. `public.materialize_recurrence_occurrences` gera linhas em `recurrence_occurrences` com `status = 'pending'` para o horizonte pedido; rodar de novo no mesmo horizonte não duplica (restrição `unique (recurrence_id, due_date)`). Uma ocorrência só vira lançamento real (`transactions`) quando o usuário aciona `effectuate_recurrence_occurrence`, ou automaticamente se `auto_effectuate` estiver ligado conscientemente. Não existe um "job" implícito: a materialização roda quando a aplicação a chama (ao abrir o calendário/mapa do mês, por exemplo) ou por um agendamento real, se configurado — nunca é assumida como já tendo acontecido.

Dia âncora 29, 30 ou 31: em meses mais curtos, a ocorrência cai no último dia válido daquele mês (`clamp_day_to_month`), mas o mês seguinte volta a tentar o dia âncora original (recorrência em dia 31 gera dia 28/29 em fevereiro e volta para dia 31 em março).

### Orçamento

```
realizado(categoria, mês) =
  soma(transactions.amount_cents onde category_id = categoria, type = 'expense',
       origin <> 'card_invoice_payment', competência no mês)
  + soma(card_installments.amount_cents onde a compra é da categoria,
         status not in ('refunded','canceled'), compra no mês)
```

O aviso de orçamento ("60% usado", "estourou") compara `realizado` com `limit_cents`. Nunca conta o pagamento da fatura como despesa adicional.

### Meta

```
progresso = reserved_cents / target_cents
```

`reserved_cents` cresce por `add_goal_contribution`. Um aporte tipo `transfer` move dinheiro de verdade (chama `create_transfer`) para a conta vinculada da meta; um aporte tipo `reserved` só marca intenção/progresso sobre dinheiro que já está em alguma conta, sem duplicar patrimônio. Vincular uma meta a uma conta não cria saldo novo — é só onde o dinheiro fisicamente mora.

### Dívida

```
saldo_atual -= valor_pago (a cada pagamento, nunca abaixo de zero)
```

`known_charges_cents` (encargos/juros) só existe se o usuário informar um valor conhecido. Na ausência de taxa informada, o Setiva não projeta juros futuros — mostrar uma projeção sem taxa real seria inventar um número.

## As cinco perguntas que o Setiva responde com dados da própria pessoa

1. **Quanto ainda posso gastar neste mês?** → margem estimada do mês (acima), sempre com os dois cenários.
2. **Em quais dias meu saldo pode ficar negativo?** → linha diária do mês, com alerta de prioridade no primeiro dia negativo.
3. **Quais despesas mudaram?** → comparação de categorias entre períodos equivalentes (mesmo número de dias/mesmo mês do calendário), sinalizando quando o histórico é incompleto em vez de presumir tendência.
4. **Quanto falta para minha meta?** → `target_cents - reserved_cents`, com simulação de novo prazo ao mudar o aporte mensal (simulador "E se eu mudar isso?", sem salvar até confirmação explícita).
5. **O que revisar agora?** → motor de sugestões determinístico (ver `docs/PROGRESS.md` para o que já está implementado), nunca chamando isso de "análise de IA" quando é regra local auditável.

## O que o Setiva explicitamente não faz

Não calcula um "score de saúde financeira" arbitrário. Não trata limite de cartão como renda disponível. Não interpreta a ausência de lançamentos como economia — gera uma orientação para completar o cadastro. Não promete rendimento de investimento, não projeta juros sem taxa informada, e não anuncia integração bancária automática (Open Finance) que não existe nesta versão.
