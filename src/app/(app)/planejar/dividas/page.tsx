import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanejarTabs } from "@/components/layout/planejar-tabs";
import { DebtsView, type DebtRow } from "@/components/planning/debts-view";

export const metadata: Metadata = { title: "Dívidas" };

export default async function DividasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: debts }, { data: accounts }] = await Promise.all([
    supabase
      .from("debts")
      .select("id, name, current_balance_cents, known_charges_cents, next_due_date, status")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at"),
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
  ]);

  const debtRows: DebtRow[] = (debts ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    currentBalanceCents: d.current_balance_cents,
    knownChargesCents: d.known_charges_cents,
    nextDueDate: d.next_due_date,
    status: d.status,
  }));

  return (
    <div>
      <p className="text-sm font-medium text-brand">Planejar</p>
      <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Planejamento</h1>
      <PlanejarTabs />
      <DebtsView debts={debtRows} accounts={accounts ?? []} />
    </div>
  );
}
