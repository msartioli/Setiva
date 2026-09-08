import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanejarTabs } from "@/components/layout/planejar-tabs";
import { BudgetsView, type BudgetRow } from "@/components/planning/budgets-view";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function OrcamentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: progress }, { data: categories }] = await Promise.all([
    supabase.from("budget_progress").select("*, categories(name)"),
    supabase
      .from("categories")
      .select("id, name")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq("kind", "expense")
      .is("archived_at", null)
      .order("name"),
  ]);

  const budgetRows: BudgetRow[] = (progress ?? []).map((p) => ({
    id: p.budget_id as string,
    categoryId: p.category_id as string,
    categoryName: (p.categories as unknown as { name: string } | null)?.name ?? "",
    limitCents: p.limit_cents ?? 0,
    spentCents: p.spent_cents ?? 0,
  }));

  return (
    <div>
      <p className="text-sm font-medium text-brand">Planejar</p>
      <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Planejamento</h1>
      <PlanejarTabs />
      <BudgetsView budgets={budgetRows} categories={categories ?? []} />
    </div>
  );
}
