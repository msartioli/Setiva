"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  budgetFormSchema,
  debtFormSchema,
  debtPaymentSchema,
  goalContributionSchema,
  goalFormSchema,
  recurrenceFormSchema,
  type BudgetFormInput,
  type DebtFormInput,
  type DebtPaymentInput,
  type GoalContributionInput,
  type GoalFormInput,
  type RecurrenceFormInput,
} from "@/lib/validations/planning";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

function revalidatePlanejar() {
  revalidatePath("/planejar/orcamentos");
  revalidatePath("/planejar/metas");
  revalidatePath("/planejar/recorrencias");
  revalidatePath("/planejar/dividas");
  revalidatePath("/hoje");
}

// --- Recorrências ---

export async function createRecurrence(input: RecurrenceFormInput): Promise<ActionResult> {
  const parsed = recurrenceFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da recorrência." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("recurrences").insert({
      user_id: userId,
      kind: parsed.data.kind,
      description: parsed.data.description,
      amount_cents: parsed.data.amountCents,
      frequency: "monthly",
      anchor_day: parsed.data.anchorDay,
      category_id: parsed.data.categoryId,
      account_id: parsed.data.accountId,
      is_estimate: parsed.data.isEstimate,
      start_date: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function archiveRecurrence(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("recurrences")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function effectuateOccurrence(occurrenceId: string, accountId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("effectuate_recurrence_occurrence", {
      p_occurrence_id: occurrenceId,
      p_account_id: accountId,
    });
    if (error) throw error;
    revalidatePlanejar();
    revalidatePath("/movimentacoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function skipOccurrence(occurrenceId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("skip_recurrence_occurrence", { p_occurrence_id: occurrenceId });
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// --- Orçamentos ---

export async function upsertBudget(input: BudgetFormInput): Promise<ActionResult> {
  const parsed = budgetFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira o limite informado." };

  try {
    const { supabase, userId } = await requireUser();
    const periodMonth = new Date();
    periodMonth.setDate(1);
    const periodMonthStr = periodMonth.toISOString().slice(0, 10);

    const { error } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: userId,
          category_id: parsed.data.categoryId,
          period_month: periodMonthStr,
          limit_cents: parsed.data.limitCents,
        },
        { onConflict: "user_id,category_id,period_month" }
      );
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// --- Metas ---

export async function createGoal(input: GoalFormInput): Promise<ActionResult> {
  const parsed = goalFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da meta." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      name: parsed.data.name,
      target_cents: parsed.data.targetCents,
      target_date: parsed.data.targetDate || null,
      linked_account_id: parsed.data.linkedAccountId,
    });
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addGoalContribution(input: GoalContributionInput): Promise<ActionResult> {
  const parsed = goalContributionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do aporte." };

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("add_goal_contribution", {
      p_goal_id: parsed.data.goalId,
      p_amount_cents: parsed.data.amountCents,
      p_contribution_date: parsed.data.contributionDate,
      p_kind: parsed.data.kind,
      p_from_account_id: (parsed.data.fromAccountId ?? null) as unknown as string,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidatePlanejar();
    revalidatePath("/visao-geral");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function archiveGoal(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("goals")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// --- Dívidas ---

export async function createDebt(input: DebtFormInput): Promise<ActionResult> {
  const parsed = debtFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados da dívida." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("debts").insert({
      user_id: userId,
      name: parsed.data.name,
      principal_cents: parsed.data.currentBalanceCents,
      current_balance_cents: parsed.data.currentBalanceCents,
      known_charges_cents: parsed.data.knownChargesCents,
      next_due_date: parsed.data.nextDueDate || null,
    });
    if (error) throw error;
    revalidatePlanejar();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function registerDebtPayment(input: DebtPaymentInput): Promise<ActionResult> {
  const parsed = debtPaymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do pagamento." };

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("register_debt_payment", {
      p_debt_id: parsed.data.debtId,
      p_account_id: parsed.data.accountId,
      p_amount_cents: parsed.data.amountCents,
      p_payment_date: parsed.data.paymentDate,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidatePlanejar();
    revalidatePath("/visao-geral");
    revalidatePath("/movimentacoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
