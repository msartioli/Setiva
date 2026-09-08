"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { confirmImportSchema, type ConfirmImportInput } from "@/lib/validations/import";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

export interface DuplicateCheckInput {
  accountId: string;
  candidates: { competenceDate: string; amountCents: number }[];
}

/**
 * Marca como possivel duplicata qualquer linha da importacao cujo par
 * (data, valor absoluto) ja exista em um lancamento da mesma conta. So
 * sinaliza — quem decide excluir e o usuario na revisao, nunca o import
 * sozinho (evita apagar uma compra legitima so por coincidencia).
 */
export async function checkDuplicates(input: DuplicateCheckInput): Promise<boolean[]> {
  const { supabase, userId } = await requireUser();
  const dates = Array.from(new Set(input.candidates.map((c) => c.competenceDate)));

  const { data: existing } = await supabase
    .from("transactions")
    .select("competence_date, amount_cents")
    .eq("user_id", userId)
    .eq("account_id", input.accountId)
    .in("competence_date", dates.length > 0 ? dates : ["1900-01-01"]);

  const existingKeys = new Set((existing ?? []).map((t) => `${t.competence_date}|${t.amount_cents}`));

  return input.candidates.map((c) => existingKeys.has(`${c.competenceDate}|${Math.abs(c.amountCents)}`));
}

export interface ConfirmImportResult {
  success: true;
  imported: number;
  batchId: string;
}

export async function confirmImport(
  input: ConfirmImportInput
): Promise<ConfirmImportResult | { success: false; error: string }> {
  const parsed = confirmImportSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da importação." };

  const included = parsed.data.rows.filter((r) => r.include);
  if (included.length === 0) return { success: false, error: "Nenhuma linha selecionada para importar." };

  try {
    const { supabase, userId } = await requireUser();

    if (!(await accountBelongsToUser(supabase, parsed.data.accountId, userId))) {
      return { success: false, error: "Conta inválida." };
    }

    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        user_id: userId,
        account_id: parsed.data.accountId,
        source_filename: parsed.data.sourceFilename,
        status: "confirmed",
        row_count: included.length,
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (batchError) throw batchError;

    // Duplicatas ficam marcadas para revisao (import_duplicate_reviewed=false)
    // em vez de excluidas — o usuario ja decidiu incluir ao marcar o
    // checkbox, mas o rotulo continua visivel no historico para auditoria.
    const dates = included.map((r) => r.competenceDate);
    const { data: existing } = await supabase
      .from("transactions")
      .select("competence_date, amount_cents")
      .eq("user_id", userId)
      .eq("account_id", parsed.data.accountId)
      .in("competence_date", dates.length > 0 ? dates : ["1900-01-01"]);
    const existingKeys = new Set((existing ?? []).map((t) => `${t.competence_date}|${t.amount_cents}`));

    const rows = included.map((r) => {
      const isDuplicate = existingKeys.has(`${r.competenceDate}|${Math.abs(r.amountCents)}`);
      return {
        user_id: userId,
        account_id: parsed.data.accountId,
        category_id: null,
        type: r.amountCents < 0 ? ("expense" as const) : ("income" as const),
        status: "completed" as const,
        amount_cents: Math.abs(r.amountCents),
        description: r.description,
        competence_date: r.competenceDate,
        effective_at: new Date().toISOString(),
        origin: "import" as const,
        import_batch_id: batch.id,
        import_duplicate_reviewed: !isDuplicate,
      };
    });

    const { error: insertError } = await supabase.from("transactions").insert(rows);
    if (insertError) throw insertError;

    revalidatePath("/importar");
    revalidatePath("/movimentacoes");
    revalidatePath("/hoje");

    return { success: true, imported: included.length, batchId: batch.id };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function reverseImportBatch(batchId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("reverse_import_batch", { p_batch_id: batchId });
    if (error) throw error;
    revalidatePath("/importar");
    revalidatePath("/movimentacoes");
    revalidatePath("/hoje");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function accountBelongsToUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.from("accounts").select("id").eq("id", accountId).eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
