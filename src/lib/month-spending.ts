import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

export interface CategorySpending {
  categoryId: string | null;
  name: string;
  icon: string | null;
  spentCents: number;
}

interface EmbeddedCategory {
  name: string;
  icon: string | null;
}

/**
 * Gasto do mes por categoria, por competencia.
 *
 * Soma as mesmas duas fontes que a view `budget_progress`: transacoes de
 * despesa (menos pagamento de fatura, que so move dinheiro) e parcelas de
 * cartao pelo mes da compra. Se somasse so `transactions`, o grafico
 * mostraria um numero menor que a barra de orcamento da mesma categoria,
 * e as duas telas se contradiriam.
 */
export async function getMonthSpendingByCategory(
  supabase: SupabaseClient<Database>,
  userId: string,
  monthStart: string,
  monthEnd: string
): Promise<CategorySpending[]> {
  const [{ data: transactions }, { data: installments }] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount_cents, category_id, categories(name, icon)")
      .eq("user_id", userId)
      .eq("type", "expense")
      .neq("origin", "card_invoice_payment")
      .gte("competence_date", monthStart)
      .lte("competence_date", monthEnd),
    supabase
      .from("card_installments")
      .select("amount_cents, card_purchases!inner(category_id, purchase_date, categories(name, icon))")
      .eq("user_id", userId)
      .not("status", "in", "(refunded,canceled)")
      .gte("card_purchases.purchase_date", monthStart)
      .lte("card_purchases.purchase_date", monthEnd),
  ]);

  const totals = new Map<string, CategorySpending>();

  function add(categoryId: string | null, category: EmbeddedCategory | null, amountCents: number) {
    const key = categoryId ?? "__none__";
    const existing = totals.get(key);
    if (existing) {
      existing.spentCents += amountCents;
      return;
    }
    totals.set(key, {
      categoryId,
      name: category?.name ?? "Sem categoria",
      icon: category?.icon ?? null,
      spentCents: amountCents,
    });
  }

  for (const t of transactions ?? []) {
    add(t.category_id, t.categories as unknown as EmbeddedCategory | null, t.amount_cents);
  }

  for (const i of installments ?? []) {
    const purchase = i.card_purchases as unknown as
      | { category_id: string | null; categories: EmbeddedCategory | null }
      | null;
    add(purchase?.category_id ?? null, purchase?.categories ?? null, i.amount_cents);
  }

  return Array.from(totals.values())
    .filter((c) => c.spentCents > 0)
    .sort((a, b) => b.spentCents - a.spentCents);
}
