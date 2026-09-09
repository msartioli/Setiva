import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { endOfMonthISO, todayISO } from "@/lib/dates";
import { calculateMargin, type PendingItem } from "@/lib/finance/projection";
import { computeSuggestions } from "@/lib/suggestions-data";
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

  const [{ data: balances }, { data: commitments }, { data: goalsReserve }] = await Promise.all([
    supabase.from("account_realized_balances").select("balance_cents"),
    supabase.from("upcoming_commitments").select("due_date, amount_cents, kind, is_estimate"),
    supabase.from("goals").select("reserved_cents, linked_account_id").not("linked_account_id", "is", null),
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

  const suggestions = await computeSuggestions(supabase, user.id, margin.confirmedCents);

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
