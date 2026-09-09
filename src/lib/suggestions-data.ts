import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import { addMonthsISO, todayISO } from "./dates";
import { generateSuggestions, type ActiveGoal, type CategorySpend, type OverBudget, type Suggestion } from "./finance/suggestions";

/**
 * Reunido aqui porque tanto /hoje (destaque a sugestao principal) quanto
 * /sugestoes (lista completa) precisam do mesmo levantamento.
 */
export async function computeSuggestions(
  supabase: SupabaseClient<Database>,
  userId: string,
  marginConfirmedCents: number
): Promise<Suggestion[]> {
  const today = todayISO();
  const previousMonthStart = addMonthsISO(today, -1).slice(0, 7) + "-01";
  const currentMonthStart = today.slice(0, 7) + "-01";

  const [{ data: budgets }, { data: monthTx }, { data: goals }] = await Promise.all([
    supabase.from("budget_progress").select("*, categories(name)"),
    supabase
      .from("transactions")
      .select("amount_cents, competence_date, type, origin, categories(name)")
      .eq("user_id", userId)
      .gte("competence_date", previousMonthStart)
      .eq("type", "expense")
      .neq("origin", "card_invoice_payment"),
    supabase
      .from("goals")
      .select("id, name, target_cents, reserved_cents")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("archived_at", null),
  ]);

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

  const activeGoals: ActiveGoal[] = (goals ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    targetCents: g.target_cents,
    reservedCents: g.reserved_cents,
  }));

  return generateSuggestions({ categorySpends, overBudgets, marginConfirmedCents, activeGoals });
}
