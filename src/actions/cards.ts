"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  cardFormSchema,
  cardPurchaseSchema,
  invoicePaymentSchema,
  type CardFormInput,
  type CardPurchaseInput,
  type InvoicePaymentInput,
} from "@/lib/validations/cards";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

export async function createCard(input: CardFormInput): Promise<ActionResult> {
  const parsed = cardFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do cartão." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("cards").insert({
      user_id: userId,
      name: parsed.data.name,
      limit_cents: parsed.data.limitCents,
      closing_day: parsed.data.closingDay,
      due_day: parsed.data.dueDay,
    });
    if (error) throw error;
    revalidatePath("/visao-geral/cartoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function archiveCard(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("cards")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/visao-geral/cartoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createCardPurchase(input: CardPurchaseInput): Promise<ActionResult> {
  const parsed = cardPurchaseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da compra." };

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("create_card_purchase", {
      p_card_id: parsed.data.cardId,
      p_category_id: (parsed.data.categoryId ?? null) as unknown as string,
      p_description: parsed.data.description,
      p_total_amount_cents: parsed.data.totalAmountCents,
      p_installments_count: parsed.data.installmentsCount,
      p_purchase_date: parsed.data.purchaseDate,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidatePath("/visao-geral/cartoes");
    revalidatePath("/hoje");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function payCardInvoice(input: InvoicePaymentInput): Promise<ActionResult> {
  const parsed = invoicePaymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do pagamento." };

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("pay_card_invoice", {
      p_invoice_id: parsed.data.invoiceId,
      p_account_id: parsed.data.accountId,
      p_amount_cents: parsed.data.amountCents,
      p_payment_date: parsed.data.paymentDate,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidatePath("/visao-geral/cartoes");
    revalidatePath("/visao-geral");
    revalidatePath("/hoje");
    revalidatePath("/movimentacoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
