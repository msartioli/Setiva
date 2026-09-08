import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/csv";
import { formatCentsBRL } from "@/lib/finance/money";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("competence_date, type, description, amount_cents, accounts(name), categories(name)")
    .eq("user_id", user.id)
    .order("competence_date", { ascending: false })
    .limit(5000);

  const header = ["Data", "Tipo", "Descrição", "Categoria", "Conta", "Valor"];
  const rows = (transactions ?? []).map((t) => [
    t.competence_date,
    t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Transferência",
    t.description,
    (t.categories as unknown as { name: string } | null)?.name ?? "",
    (t.accounts as unknown as { name: string } | null)?.name ?? "",
    formatCentsBRL(t.amount_cents),
  ]);

  const csv = "﻿" + toCSV([header, ...rows]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="setiva-movimentacoes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
