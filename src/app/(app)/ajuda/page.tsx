import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ajuda" };

const TOPICS: { title: string; body: string; href: string; linkLabel: string }[] = [
  {
    title: "Cadastrar sua primeira conta",
    body: "Uma conta representa onde seu dinheiro fica de verdade: banco, carteira ou investimento. Informe o saldo atual e a data desse saldo — lançamentos anteriores a essa data não entram na conta.",
    href: "/visao-geral",
    linkLabel: "Ir para Visão geral",
  },
  {
    title: "Registrar um lançamento",
    body: "Use o botão Novo lançamento, disponível em qualquer tela. Escolha Despesa ou Receita, a conta, e opcionalmente uma categoria. O valor só afeta o saldo quando o lançamento está marcado como efetivado.",
    href: "/movimentacoes",
    linkLabel: "Ver movimentações",
  },
  {
    title: "Cadastrar um cartão e uma compra parcelada",
    body: "Em Visão geral > Cartões, cadastre o cartão com dia de fechamento e vencimento. Uma compra parcelada divide o valor total em parcelas (a última parcela absorve eventual diferença de centavos) e cada parcela cai na fatura do mês certo, considerando o fechamento.",
    href: "/visao-geral/cartoes",
    linkLabel: "Ir para Cartões",
  },
  {
    title: "Entender a fatura e o pagamento",
    body: "Comprar no cartão não tira dinheiro da sua conta na hora — isso conta como despesa por competência. Só quando você paga a fatura o dinheiro sai de verdade (saída de caixa). Por isso o pagamento nunca aparece como despesa duplicada.",
    href: "/relatorios",
    linkLabel: "Ver caixa x competência",
  },
  {
    title: "Transferir entre suas contas",
    body: "Uma transferência move dinheiro entre duas contas suas. Ela não é receita nem despesa — o total do seu patrimônio não muda. Use a aba Transferência dentro de Novo lançamento.",
    href: "/movimentacoes",
    linkLabel: "Ver movimentações",
  },
  {
    title: "Definir um orçamento",
    body: "Em Planejar > Orçamentos, escolha uma categoria de despesa e um limite mensal. O valor gasto é somado automaticamente a partir dos seus lançamentos e compras no cartão daquela categoria.",
    href: "/planejar/orcamentos",
    linkLabel: "Ir para Orçamentos",
  },
  {
    title: "Criar uma meta",
    body: "Uma meta tem um valor alvo e, opcionalmente, uma conta vinculada. Você pode aportar só marcando progresso (sem mexer no saldo) ou transferindo dinheiro de verdade de outra conta para a conta da meta.",
    href: "/planejar/metas",
    linkLabel: "Ir para Metas",
  },
  {
    title: "Importar um extrato em CSV",
    body: "Em Importar e exportar, envie um arquivo CSV, indique quais colunas são data, descrição e valor, e revise a prévia antes de confirmar. Linhas parecidas com lançamentos que já existem são marcadas como possível duplicata, mas você decide se inclui ou não.",
    href: "/importar",
    linkLabel: "Ir para Importar",
  },
  {
    title: "Ler a previsão do mês (Hoje)",
    body: "A margem confirmada usa só entradas e saídas certas até o fim do período. Se você tiver renda estimada (variável), ela só entra num segundo número, separado, e nunca se mistura com o confirmado sem você escolher. Um alerta de dia negativo aparece se o saldo puder ficar negativo em algum dia do meio do mês, mesmo que o mês feche no positivo.",
    href: "/hoje",
    linkLabel: "Ir para Hoje",
  },
];

export default function AjudaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-brand">Central de ajuda</p>
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">Como usar a Setiva</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <div key={topic.title} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="font-medium text-foreground">{topic.title}</h2>
            <p className="mt-2 text-sm text-foreground-muted">{topic.body}</p>
            <Link href={topic.href} className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
              {topic.linkLabel} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
