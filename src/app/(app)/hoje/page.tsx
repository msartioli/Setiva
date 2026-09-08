import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { addMonthsISO, endOfMonthISO, todayISO } from "@/lib/dates";
import { buildDailyBalanceLine, calculateMargin, findFirstNegativeDay, type PendingItem } from "@/lib/finance/projection";
import { formatCentsBRL } from "@/lib/finance/money";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";

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
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null),
    supabase.from("account_realized_balances").select("account_id, balance_cents"),
    supabase.from("upcoming_commitments").select("*").order("due_date").limit(50),
    supabase.from("goals").select("reserved_cents, linked_account_id").not("linked_account_id", "is", null),
  ]);

  const realizedTotalCents = sum((balances ?? []).map((b) => b.balance_cents ?? 0));
  const protectedReserveCents = sum((goals ?? []).map((g) => g.reserved_cents ?? 0));

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
              <BalanceLineChart data={dailyLine} />
            </section>

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
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

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
