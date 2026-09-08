import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { addMonthsISO, endOfMonthISO, todayISO } from "@/lib/dates";
import { calculateMargin, type PendingItem } from "@/lib/finance/projection";
import { generateSuggestions, type ActiveGoal, type CategorySpend, type OverBudget } from "@/lib/finance/suggestions";
import { SuggestionsView } from "@/components/suggestions/suggestions-view";

export const metadata: Metadata = { title: "Sugestões" };

export default async function SugestoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayISO();
  const periodEnd = endOfMonthISO(today);
  const previousMonthStart = addMonthsISO(today, -1).slice(0, 7) + "-01";
  const currentMonthStart = today.slice(0, 7) + "-01";

  const [{ data: balances }, { data: commitments }, { data: goalsReserve }, { data: budgets }, { data: monthTx }] =
    await Promise.all([
      supabase.from("account_realized_balances").select("balance_cents"),
      supabase.from("upcoming_commitments").select("due_date, amount_cents, kind, is_estimate"),
      supabase.from("goals").select("reserved_cents, linked_account_id").not("linked_account_id", "is", null),
      supabase.from("budget_progress").select("*, categories(name)"),
      supabase
        .from("transactions")
        .select("amount_cents, competence_date, type, origin, categories(name)")
        .eq("user_id", user.id)
        .gte("competence_date", previousMonthStart)
        .eq("type", "expense")
        .neq("origin", "card_invoice_payment"),
    ]);

  const realizedTotalCents = sum((balances ?? []).map((b) => b.balance_cents ?? 0));
  const protectedReserveCents = sum((goalsReserve ?? []).map((g) => g.reserved_cents ?? 0));

  const pendingItems: PendingItem[] = (commitments ?? [])
    .filter((c): c is typeof c & { due_date: string; amount_cents: number } => Boolean(c.due_date) && c.amount_cents != null)
    .map((c) => ({ dueDate: c.due_date, amountCents: c.amount_cents, kind: c.kind as "income" | "expense", certain: !c.is_estimate }));

  const margin = calculateMargin({
    realizedBalanceCents: realizedTotalCents,
    pendingItems,
    periodEnd,
    protectedReserveCents,
    includeEstimated: false,
  });

  const overBudgets: OverBudget[] = (budgets ?? [])
    .filter((b) => (b.spent_cents ?? 0) >= (b.limit_cents ?? Infinity))
    .map((b) => ({
      categoryName: (b.categories as unknown as { name: string } | null)?.name ?? "",
      spentCents: b.spent_cents ?? 0,
      limitCents: b.limit_cents ?? 0,
    }));

  const byCategory = new Map<string, { current: number; previous: number }>();
  for (const t of monthTx ?? []) {
    const name = (t.categories as unknown as { name: string } | null)?.name ?? "Sem categoria";
    const entry = byCategory.get(name) ?? { current: 0, previous: 0 };
    if (t.competence_date >= currentMonthStart) entry.current += t.amount_cents;
    else entry.previous += t.amount_cents;
    byCategory.set(name, entry);
  }
  const categorySpends: CategorySpend[] = Array.from(byCategory.entries()).map(([categoryName, v]) => ({
    categoryName,
    currentCents: v.current,
    previousCents: v.previous,
  }));

  const { data: goals } = await supabase
    .from("goals")
    .select("id, name, target_cents, reserved_cents")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("archived_at", null);

  const activeGoals: ActiveGoal[] = (goals ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    targetCents: g.target_cents,
    reservedCents: g.reserved_cents,
  }));

  const suggestions = generateSuggestions({
    categorySpends,
    overBudgets,
    marginConfirmedCents: margin.confirmedCents,
    activeGoals,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-brand">Calculado localmente</p>
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">Sugestões</h1>
      </div>
      <SuggestionsView suggestions={suggestions} marginConfirmedCents={margin.confirmedCents} />
    </div>
  );
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
