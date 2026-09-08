"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountFormSchema, type AccountFormInput } from "@/lib/validations/accounts";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

export async function createAccount(input: AccountFormInput): Promise<ActionResult> {
  const parsed = accountFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da conta." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("accounts").insert({
      user_id: userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      initial_balance_cents: parsed.data.initialBalanceCents,
      initial_balance_date: parsed.data.initialBalanceDate,
    });
    if (error) throw error;
    revalidatePath("/visao-geral");
    revalidatePath("/hoje");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function archiveAccount(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("accounts")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/visao-geral");
    revalidatePath("/hoje");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
