import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { addMonthsISO, todayISO } from "@/lib/dates";
import { formatCentsBRL } from "@/lib/finance/money";
import { MonthlyBarChart, CategoryBreakdown, type CategoryTotal, type MonthlyTotal } from "@/components/reports/reports-view";
import { VisaoGeralTabs } from "@/components/layout/visao-geral-tabs";

export const metadata: Metadata = { title: "Relatórios" };

const MONTH_LABELS = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
];

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const startDate = addMonthsISO(todayISO(), -5);
  const currentMonth = todayISO().slice(0, 7);

  const [{ data: transactions }, { data: installments }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount_cents, competence_date, origin, category_id, categories(name)")
      .eq("user_id", user.id)
      .gte("competence_date", startDate)
      .neq("type", "transfer"),
    supabase
      .from("card_installments")
      .select("amount_cents, status, card_purchases(purchase_date, category_id, categories(name))")
      .eq("user_id", user.id)
      .not("status", "in", "(refunded,canceled)"),
  ]);

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(addMonthsISO(todayISO(), -i).slice(0, 7));
  }

  const accrual = new Map<string, { income: number; expense: number }>();
  const cash = new Map<string, { income: number; expense: number }>();
  for (const m of months) {
    accrual.set(m, { income: 0, expense: 0 });
    cash.set(m, { income: 0, expense: 0 });
  }

  const categoryTotalsCurrentMonth = new Map<string, number>();

  for (const t of transactions ?? []) {
    const month = t.competence_date.slice(0, 7);
    if (!accrual.has(month)) continue;
    if (t.type === "income") {
      accrual.get(month)!.income += t.amount_cents;
      cash.get(month)!.income += t.amount_cents;
    } else if (t.type === "expense") {
      cash.get(month)!.expense += t.amount_cents;
      if (t.origin !== "card_invoice_payment") {
        accrual.get(month)!.expense += t.amount_cents;
        if (month === currentMonth) {
          const name = (t.categories as unknown as { name: string } | null)?.name ?? "Sem categoria";
          categoryTotalsCurrentMonth.set(name, (categoryTotalsCurrentMonth.get(name) ?? 0) + t.amount_cents);
        }
      }
    }
  }

  for (const ins of installments ?? []) {
    const purchase = ins.card_purchases as unknown as {
      purchase_date: string;
      category_id: string | null;
      categories: { name: string } | null;
    } | null;
    if (!purchase) continue;
    const month = purchase.purchase_date.slice(0, 7);
    if (!accrual.has(month)) continue;
    accrual.get(month)!.expense += ins.amount_cents;
    if (month === currentMonth) {
      const name = purchase.categories?.name ?? "Sem categoria";
      categoryTotalsCurrentMonth.set(name, (categoryTotalsCurrentMonth.get(name) ?? 0) + ins.amount_cents);
    }
  }

  const monthlyData: MonthlyTotal[] = months.map((m) => {
    const [year, monthNum] = m.split("-").map(Number);
    return {
      month: m,
      label: `${MONTH_LABELS[monthNum - 1]}/${String(year).slice(2)}`,
      incomeCents: accrual.get(m)!.income,
      expenseCents: accrual.get(m)!.expense,
    };
  });

  const categoryData: CategoryTotal[] = Array.from(categoryTotalsCurrentMonth.entries())
    .map(([categoryName, amountCents]) => ({ categoryName, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 8);

  const currentAccrual = accrual.get(currentMonth)!;
  const currentCash = cash.get(currentMonth)!;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-brand">Visão geral</p>
        <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Relatórios</h1>
        <VisaoGeralTabs />
        <p className="mt-4 text-sm text-foreground-muted">Últimos 6 meses.</p>
      </div>

      <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Receitas x despesas por mês (competência)</h2>
        <MonthlyBarChart data={monthlyData} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-lg text-foreground">Despesas por categoria este mês</h2>
          <CategoryBreakdown data={categoryData} />
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-lg text-foreground">Caixa x competência este mês</h2>
          <p className="mb-4 text-sm text-foreground-muted">
            Competência conta a compra do cartão no mês em que ela aconteceu. Caixa conta o pagamento da fatura no
            mês em que o dinheiro realmente saiu.
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-foreground-muted">Despesa por competência</dt>
              <dd className="font-display text-xl tabular-figures text-foreground">{formatCentsBRL(currentAccrual.expense)}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Saída de caixa</dt>
              <dd className="font-display text-xl tabular-figures text-foreground">{formatCentsBRL(currentCash.expense)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
