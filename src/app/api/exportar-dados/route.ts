import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exportacao dos dados do titular (LGPD). RLS garante que cada consulta so
 * traz linhas do proprio usuario autenticado — nenhum filtro adicional por
 * user_id e necessario aqui, e nenhuma chave de servico e usada.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const tables = [
    "profiles",
    "accounts",
    "transactions",
    "transfers",
    "cards",
    "card_purchases",
    "card_installments",
    "card_invoices",
    "card_payments",
    "recurrences",
    "recurrence_occurrences",
    "budgets",
    "goals",
    "goal_contributions",
    "debts",
    "debt_payments",
    "notifications",
    "consent_records",
    "categories",
  ] as const;

  const results = await Promise.all(tables.map((table) => supabase.from(table).select("*")));

  const data: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
  };

  tables.forEach((table, i) => {
    data[table] = results[i].data ?? [];
  });

  const json = JSON.stringify(data, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="setiva-meus-dados-${todayStamp()}.json"`,
    },
  });
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
