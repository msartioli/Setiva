"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountFormSchema, type AccountFormInput } from "@/lib/validations/accounts";
import { getFinancialInstitutionByIspb } from "@/lib/integrations/financial-institutions/service";

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
    const institution = parsed.data.institutionIspb
      ? await getFinancialInstitutionByIspb(parsed.data.institutionIspb)
      : null;
    const { error } = await supabase.from("accounts").insert({
      user_id: userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      institution_ispb: institution?.ispb ?? null,
      institution_compe: institution?.compe ?? null,
      institution_display_name: institution?.shortName ?? institution?.name ?? null,
      institution_logo_url: institution?.logoUrl ?? null,
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
