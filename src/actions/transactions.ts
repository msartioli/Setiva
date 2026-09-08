"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createTransactionSchema,
  createTransferSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type CreateTransferInput,
  type UpdateTransactionInput,
} from "@/lib/validations/transactions";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

export async function createTransaction(input: CreateTransactionInput): Promise<ActionResult> {
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do lançamento." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      account_id: parsed.data.accountId,
      category_id: parsed.data.categoryId,
      type: parsed.data.type,
      status: parsed.data.status,
      amount_cents: parsed.data.amountCents,
      description: parsed.data.description,
      competence_date: parsed.data.competenceDate,
      effective_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
      origin: "manual",
      idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidatePath("/hoje");
    revalidatePath("/movimentacoes");
    revalidatePath("/visao-geral");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTransaction(input: UpdateTransactionInput): Promise<ActionResult> {
  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do lançamento." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("transactions")
      .update({
        account_id: parsed.data.accountId,
        category_id: parsed.data.categoryId,
        type: parsed.data.type,
        status: parsed.data.status,
        amount_cents: parsed.data.amountCents,
        description: parsed.data.description,
        competence_date: parsed.data.competenceDate,
        effective_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/hoje");
    revalidatePath("/movimentacoes");
    revalidatePath("/visao-geral");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/hoje");
    revalidatePath("/movimentacoes");
    revalidatePath("/visao-geral");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createTransfer(input: CreateTransferInput): Promise<ActionResult> {
  const parsed = createTransferSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da transferência." };
  if (parsed.data.fromAccountId === parsed.data.toAccountId) {
    return { success: false, error: "Escolha contas diferentes para origem e destino." };
  }

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("create_transfer", {
      p_from_account_id: parsed.data.fromAccountId,
      p_to_account_id: parsed.data.toAccountId,
      p_amount_cents: parsed.data.amountCents,
      p_transfer_date: parsed.data.transferDate,
      p_description: parsed.data.description,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidatePath("/hoje");
    revalidatePath("/movimentacoes");
    revalidatePath("/visao-geral");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTransfer(transferId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("delete_transfer", { p_transfer_id: transferId });
    if (error) throw error;
    revalidatePath("/hoje");
    revalidatePath("/movimentacoes");
    revalidatePath("/visao-geral");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
