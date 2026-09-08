import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TransactionsTable, type TransactionRow } from "@/components/transactions/transactions-table";
import { addMonthsISO, todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Movimentações" };

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; contaId?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const startDate = addMonthsISO(todayISO(), -3);

  let query = supabase
    .from("transactions")
    .select(
      "id, type, transfer_id, transfer_leg, account_id, category_id, amount_cents, description, competence_date, accounts(name), categories(name)"
    )
    .eq("user_id", user.id)
    .gte("competence_date", startDate)
    .order("competence_date", { ascending: false })
    .limit(200);

  if (params.tipo === "income" || params.tipo === "expense" || params.tipo === "transfer") {
    query = query.eq("type", params.tipo);
  }
  if (params.contaId) {
    query = query.eq("account_id", params.contaId);
  }
  if (params.q) {
    query = query.ilike("description", `%${params.q}%`);
  }

  const [{ data: transactions }, { data: accounts }, { data: categories }] = await Promise.all([
    query,
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
    supabase
      .from("categories")
      .select("id, name, kind")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .order("name"),
  ]);

  const rows: TransactionRow[] = (transactions ?? []).map((t) => ({
    id: t.id,
    type: t.type as TransactionRow["type"],
    transferId: t.transfer_id,
    transferLeg: t.transfer_leg,
    accountId: t.account_id,
    accountName: (t.accounts as unknown as { name: string } | null)?.name ?? "",
    categoryId: t.category_id,
    categoryName: (t.categories as unknown as { name: string } | null)?.name ?? null,
    amountCents: t.amount_cents,
    description: t.description,
    competenceDate: t.competence_date,
  }));

  const typedCategories = (categories ?? []) as { id: string; name: string; kind: "income" | "expense" }[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-brand">Últimos 90 dias</p>
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">Movimentações</h1>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium text-foreground">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q}
            placeholder="Descrição..."
            className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipo" className="text-sm font-medium text-foreground">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={params.tipo ?? ""}
            className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="transfer">Transferências</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contaId" className="text-sm font-medium text-foreground">
            Conta
          </label>
          <select
            id="contaId"
            name="contaId"
            defaultValue={params.contaId ?? ""}
            className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
          >
            <option value="">Todas</option>
            {(accounts ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-11 rounded-[var(--radius-md)] bg-brand px-5 text-sm font-medium text-brand-foreground hover:bg-brand-strong"
        >
          Filtrar
        </button>
      </form>

      <TransactionsTable rows={rows} accounts={accounts ?? []} categories={typedCategories} />
    </div>
  );
}
