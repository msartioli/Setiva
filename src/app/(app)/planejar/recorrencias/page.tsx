import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanejarTabs } from "@/components/layout/planejar-tabs";
import { RecurrencesView, type OccurrenceRow, type RecurrenceRow } from "@/components/planning/recurrences-view";
import { addMonthsISO, todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Recorrências" };

export default async function RecorrenciasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await supabase.rpc("materialize_recurrence_occurrences", { p_horizon_end: addMonthsISO(todayISO(), 2) });

  const [{ data: recurrences }, { data: occurrences }, { data: categories }, { data: accounts }] = await Promise.all([
    supabase
      .from("recurrences")
      .select("id, kind, description, amount_cents, anchor_day, is_estimate")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("description"),
    supabase
      .from("recurrence_occurrences")
      .select("id, due_date, amount_cents, status, recurrences(description, kind)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("due_date")
      .limit(30),
    supabase
      .from("categories")
      .select("id, name, kind")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .order("name"),
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
  ]);

  const recurrenceRows: RecurrenceRow[] = (recurrences ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as "income" | "expense",
    description: r.description,
    amountCents: r.amount_cents,
    anchorDay: r.anchor_day ?? 1,
    isEstimate: r.is_estimate,
  }));

  const occurrenceRows: OccurrenceRow[] = (occurrences ?? []).map((o) => {
    const rec = o.recurrences as unknown as { description: string; kind: string } | null;
    return {
      id: o.id,
      recurrenceDescription: rec?.description ?? "",
      kind: (rec?.kind as "income" | "expense") ?? "expense",
      dueDate: o.due_date,
      amountCents: o.amount_cents,
    };
  });

  return (
    <div>
      <p className="text-sm font-medium text-brand">Planejar</p>
      <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Planejamento</h1>
      <PlanejarTabs />
      <RecurrencesView
        recurrences={recurrenceRows}
        occurrences={occurrenceRows}
        categories={(categories ?? []) as { id: string; name: string; kind: "income" | "expense" }[]}
        accounts={accounts ?? []}
      />
    </div>
  );
}
