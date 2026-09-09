import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Lightbulb, Target, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addMonthsISO, endOfMonthISO, todayISO } from "@/lib/dates";
import {
  buildDailyBalanceLine,
  buildMonthBalanceLine,
  calculateMargin,
  findFirstNegativeDay,
  type PendingItem,
  type RealizedMovement,
} from "@/lib/finance/projection";
import { formatCentsBRL } from "@/lib/finance/money";
import { computeSuggestions } from "@/lib/suggestions-data";
import { getMonthSpendingByCategory } from "@/lib/month-spending";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { MonthFlowChart } from "@/components/dashboard/month-flow-chart";
import { BudgetAlerts, type BudgetAlertRow } from "@/components/dashboard/budget-alerts";

export const metadata: Metadata = { title: "Hoje" };

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayISO();
  const periodEnd = endOfMonthISO(today);
  const horizon = addMonthsISO(today, 2);

  await supabase.rpc("materialize_recurrence_occurrences", { p_horizon_end: horizon });

  const [{ data: accounts }, { data: balances }, { data: commitments }, { data: goals }] = await Promise.all([
    supabase.from("accounts").select("id, name, kind").eq("user_id", user.id).is("archived_at", null),
    supabase.from("account_realized_balances").select("account_id, balance_cents"),
    supabase.from("upcoming_commitments").select("*").order("due_date").limit(50),
    supabase
      .from("goals")
      .select("id, name, target_cents, reserved_cents, linked_account_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .is("archived_at", null)
      .order("created_at")
      .limit(3),
  ]);

  const balanceByAccount = new Map((balances ?? []).map((b) => [b.account_id, b.balance_cents ?? 0]));
  const realizedTotalCents = sum([...balanceByAccount.values()]);
  const protectedReserveCents = sum(
    (goals ?? []).filter((g) => g.linked_account_id).map((g) => g.reserved_cents ?? 0)
  );

  const pendingItems: PendingItem[] = (commitments ?? [])
    .filter((c): c is typeof c & { due_date: string; amount_cents: number } => Boolean(c.due_date) && c.amount_cents != null)
    .map((c) => ({
      dueDate: c.due_date,
      amountCents: c.amount_cents,
      kind: c.kind as "income" | "expense",
      certain: !c.is_estimate,
    }));

  const margin = calculateMargin({
    realizedBalanceCents: realizedTotalCents,
    pendingItems,
    periodEnd,
    protectedReserveCents,
    includeEstimated: false,
  });
  const marginExpected = calculateMargin({
    realizedBalanceCents: realizedTotalCents,
    pendingItems,
    periodEnd,
    protectedReserveCents,
    includeEstimated: true,
  });

  const dailyLine = buildDailyBalanceLine(realizedTotalCents, pendingItems, today, periodEnd);
  const negativeDay = findFirstNegativeDay(dailyLine);
  const hasAccounts = (accounts ?? []).length > 0;
  const nextCommitments = (commitments ?? []).slice(0, 5);

  const suggestions = hasAccounts ? await computeSuggestions(supabase, user.id, margin.confirmedCents) : [];
  const topSuggestion = suggestions[0] ?? null;

  const monthStart = `${today.slice(0, 7)}-01`;
  const [spendingByCategory, { data: budgetProgress }, { data: monthIncome }, { data: settledMovements }] =
    hasAccounts
      ? await Promise.all([
          getMonthSpendingByCategory(supabase, user.id, monthStart, periodEnd),
          supabase.from("budget_progress").select("*, categories(name, icon)"),
          supabase
            .from("transactions")
            .select("amount_cents")
            .eq("user_id", user.id)
            .eq("type", "income")
            .gte("competence_date", monthStart)
            .lte("competence_date", periodEnd),
          // A linha do saldo segue a mesma regra da view account_realized_balances:
          // so lancamento efetivado, datado por effective_at. Transferencia fica de
          // fora de proposito: as duas pernas se anulam no total das contas.
          supabase
            .from("transactions")
            .select("amount_cents, type, effective_at")
            .eq("user_id", user.id)
            .in("type", ["income", "expense"])
            .eq("status", "completed")
            .not("effective_at", "is", null)
            .gte("effective_at", `${monthStart}T00:00:00`)
            .lte("effective_at", `${today}T23:59:59.999`),
        ])
      : [[], { data: null }, { data: null }, { data: null }];

  const expenseTotalCents = sum(spendingByCategory.map((c) => c.spentCents));
  const incomeTotalCents = sum((monthIncome ?? []).map((t) => t.amount_cents));

  const realizedMovements: RealizedMovement[] = (settledMovements ?? [])
    .filter((t): t is typeof t & { effective_at: string } => Boolean(t.effective_at))
    .map((t) => ({
      date: t.effective_at.slice(0, 10),
      deltaCents: t.type === "income" ? t.amount_cents : -t.amount_cents,
    }));

  const monthLine = buildMonthBalanceLine(
    realizedTotalCents,
    realizedMovements,
    pendingItems,
    monthStart,
    today,
    periodEnd
  );

  // No maximo 6 fatias nomeadas: acima disso a rosca vira um arco-iris
  // ilegivel e o resto some no meio de fatias de 1%.
  const topSlices = spendingByCategory.slice(0, 6).map((c) => ({ name: c.name, spentCents: c.spentCents }));
  const restCents = sum(spendingByCategory.slice(6).map((c) => c.spentCents));
  const donutSlices = restCents > 0 ? [...topSlices, { name: "Outras", spentCents: restCents }] : topSlices;

  const budgetRows: BudgetAlertRow[] = (budgetProgress ?? []).map((b) => {
    const category = b.categories as unknown as { name: string; icon: string | null } | null;
    return {
      categoryId: b.category_id as string,
      categoryName: category?.name ?? "",
      categoryIcon: category?.icon ?? null,
      limitCents: b.limit_cents ?? 0,
      spentCents: b.spent_cents ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-brand">Seu mês</p>
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">Veja o que cabe no seu mês</h1>
      </div>

      {!hasAccounts && (
        <EmptyState
          title="Comece cadastrando uma conta"
          description="Sem uma conta, não temos de onde partir para calcular sua margem do mês."
          actionHref="/visao-geral"
          actionLabel="Cadastrar conta"
        />
      )}

      {hasAccounts && (
        <>
          {negativeDay && (
            <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-negative/30 bg-negative-soft px-4 py-3.5 text-sm text-negative">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p>
                Seu saldo pode ficar negativo em{" "}
                <strong>{formatDatePtBR(negativeDay.date)}</strong> ({formatCentsBRL(negativeDay.balanceCents)}),
                mesmo que o mês feche no positivo. Vale olhar os vencimentos até lá.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-6">
              <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm text-foreground-muted">Margem confirmada até o fim do mês</p>
                    <p className="font-display text-3xl tabular-figures text-foreground">
                      {formatCentsBRL(margin.confirmedCents)}
                    </p>
                  </div>
                  {marginExpected.expectedCents !== margin.confirmedCents && (
                    <p className="text-sm text-foreground-muted">
                      Com renda estimada:{" "}
                      <span className="font-medium text-foreground tabular-figures">
                        {formatCentsBRL(marginExpected.expectedCents)}
                      </span>
                    </p>
                  )}
                </div>
                <BalanceLineChart data={monthLine} />
                <p className="mt-2 text-xs text-foreground-muted">
                  Linha cheia é o que já aconteceu no mês. Tracejada é o previsto até o dia {periodEnd.slice(8, 10)}.
                </p>
              </section>

              {budgetRows.length > 0 && <BudgetAlerts rows={budgetRows} />}

              {donutSlices.length > 0 && (
                <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
                  <p className="font-display text-lg font-bold text-foreground">Para onde foi seu dinheiro</p>
                  <p className="mb-5 text-sm text-foreground-muted">
                    Despesas deste mês por categoria, incluindo as compras no cartão.
                  </p>
                  <CategoryDonut slices={donutSlices} totalCents={expenseTotalCents} />
                </section>
              )}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Suas contas</p>
                  <Link href="/visao-geral" className="text-sm text-brand hover:underline">
                    Ver todas
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(accounts ?? []).map((a) => (
                    <div key={a.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                      <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <Wallet className="size-3.5" aria-hidden="true" />
                        {KIND_LABELS[a.kind] ?? a.kind}
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">{a.name}</p>
                      <p className="mt-1 font-display text-lg tabular-figures text-foreground">
                        {formatCentsBRL(balanceByAccount.get(a.id) ?? 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {topSuggestion && (
                <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-brand">Sugestão</p>
                      <p className="font-medium text-foreground">{topSuggestion.title}</p>
                      <p className="mt-1 text-sm text-foreground-muted">{topSuggestion.explanation}</p>
                      <Link href={topSuggestion.actionHref} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                        {topSuggestion.actionLabel} →
                      </Link>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Wallet className="size-4" aria-hidden="true" />
                  Saldo em contas
                </div>
                <p className="mt-1 font-display text-2xl tabular-figures text-foreground">
                  {formatCentsBRL(realizedTotalCents)}
                </p>
                {protectedReserveCents > 0 && (
                  <p className="mt-1 text-xs text-foreground-muted">
                    Inclui {formatCentsBRL(protectedReserveCents)} já reservado para metas
                  </p>
                )}
              </div>

              {(incomeTotalCents > 0 || expenseTotalCents > 0) && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <p className="mb-1 text-sm font-medium text-foreground">Entrou e saiu no mês</p>
                  <p className="mb-2 text-xs text-foreground-muted">Por competência, já registrado.</p>
                  <MonthFlowChart incomeCents={incomeTotalCents} expenseCents={expenseTotalCents} />
                  {incomeTotalCents === 0 && (
                    <p className="mt-2 text-xs text-foreground-muted">
                      Nenhuma receita efetivada ainda neste mês. O que está previsto aparece em próximos
                      compromissos.
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <p className="mb-3 text-sm font-medium text-foreground">Próximos compromissos</p>
                {nextCommitments.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Nada previsto por enquanto.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {nextCommitments.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 text-foreground">
                          {c.kind === "income" ? (
                            <ArrowUpRight className="size-4 shrink-0 text-positive" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="size-4 shrink-0 text-negative" aria-hidden="true" />
                          )}
                          <span className="truncate">{c.description}</span>
                        </div>
                        <span className="shrink-0 tabular-figures text-foreground-muted">
                          {formatDatePtBR(c.due_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {goals && goals.length > 0 && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Metas</p>
                    <Link href="/planejar/metas" className="text-xs text-brand hover:underline">
                      Ver todas
                    </Link>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {goals.map((g) => {
                      const ratio = g.target_cents > 0 ? Math.min(g.reserved_cents / g.target_cents, 1) : 0;
                      return (
                        <li key={g.id}>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Target className="size-3.5 shrink-0 text-foreground-muted" aria-hidden="true" />
                            <span className="truncate">{g.name}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${ratio * 100}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

const KIND_LABELS: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira",
  investment: "Investimento",
  other: "Outra",
};

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center">
      <p className="font-display text-xl text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-foreground-muted">{description}</p>
      <Link
        href={actionHref}
        className="mt-5 inline-flex items-center rounded-[var(--radius-pill)] bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-strong"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function formatDatePtBR(iso: string | null): string {
  if (!iso) return "—";
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
