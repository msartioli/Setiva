import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VisaoGeralTabs } from "@/components/layout/visao-geral-tabs";
import { CardsView, type CardWithInvoices } from "@/components/cards/cards-view";

export const metadata: Metadata = { title: "Cartões" };

export default async function CartoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cards } = await supabase
    .from("cards")
    .select("id, name, limit_cents, closing_day, due_day")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at");

  const currentMonth = new Date();
  currentMonth.setDate(1);
  const referenceMonth = currentMonth.toISOString().slice(0, 10);
  const previousMonth = new Date(currentMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthReference = previousMonth.toISOString().slice(0, 10);

  await Promise.all(
    (cards ?? []).map((c) =>
      supabase.rpc("ensure_card_invoice", { p_card_id: c.id, p_reference_month: referenceMonth })
    )
  );

  const { data: invoices } = await supabase
    .from("card_invoice_totals")
    .select("*")
    .order("reference_month", { ascending: true });

  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq("kind", "expense")
      .is("archived_at", null)
      .order("name"),
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
  ]);

  const cardsWithInvoices: CardWithInvoices[] = (cards ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    limitCents: c.limit_cents,
    closingDay: c.closing_day,
    dueDay: c.due_day,
    invoices: (invoices ?? [])
      .filter((i) => i.card_id === c.id && i.reference_month && i.reference_month >= previousMonthReference)
      .slice(0, 4)
      .map((i) => ({
        id: i.invoice_id as string,
        referenceMonth: i.reference_month as string,
        dueDate: i.due_date as string,
        status: i.status as string,
        totalCents: i.total_cents ?? 0,
        paidAmountCents: i.paid_amount_cents ?? 0,
      })),
  }));

  return (
    <div>
      <p className="text-sm font-medium text-brand">Visão geral</p>
      <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Contas e cartões</h1>
      <VisaoGeralTabs />
      <CardsView cards={cardsWithInvoices} categories={categories ?? []} accounts={accounts ?? []} />
    </div>
  );
}
