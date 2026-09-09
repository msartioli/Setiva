"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { setThemeCookie } from "@/lib/theme-cookie";
import {
  accountsStepSchema,
  budgetsStepSchema,
  cardsStepSchema,
  debtsStepSchema,
  goalStepSchema,
  goalsIntentSchema,
  incomeStepSchema,
  monthlyBillsStepSchema,
  preferencesStepSchema,
  profileStepSchema,
  type AccountsStepInput,
  type BudgetsStepInput,
  type CardsStepInput,
  type DebtsStepInput,
  type GoalStepInput,
  type GoalsIntentInput,
  type IncomeStepInput,
  type MonthlyBillsStepInput,
  type PreferencesStepInput,
  type ProfileStepInput,
} from "@/lib/validations/onboarding";

export type StepResult = { success: true } | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

async function advanceStep(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, step: number) {
  const { error } = await supabase
    .from("onboarding_state")
    .update({ current_step: step })
    .eq("user_id", userId)
    .lt("current_step", step);
  if (error) throw error;
}

export async function saveOnboardingDraft(key: string, value: unknown): Promise<StepResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { data: current } = await supabase
      .from("onboarding_state")
      .select("draft")
      .eq("user_id", userId)
      .single();
    const draft = { ...(current?.draft as Record<string, Json> | null), [key]: value as Json };
    const { error } = await supabase.from("onboarding_state").update({ draft }).eq("user_id", userId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveProfileStep(input: ProfileStepInput): Promise<StepResult> {
  const parsed = profileStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados invalidos." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        nickname: parsed.data.nickname || null,
        avatar_family: parsed.data.avatarFamily,
        avatar_style: parsed.data.avatarStyle,
        avatar_seed: parsed.data.avatarSeed,
      })
      .eq("user_id", userId);
    if (error) throw error;
    await advanceStep(supabase, userId, 2);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveGoalsIntentStep(input: GoalsIntentInput): Promise<StepResult> {
  const parsed = goalsIntentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Selecione ao menos uma opcao." };
  try {
    const { supabase, userId } = await requireUser();
    await saveOnboardingDraft("intents", parsed.data.intents);
    await advanceStep(supabase, userId, 3);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveIncomeStep(input: IncomeStepInput): Promise<StepResult> {
  const parsed = incomeStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os valores informados." };

  try {
    const { supabase, userId } = await requireUser();

    if (parsed.data.sources.length > 0) {
      const { data: incomeCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("kind", "income")
        .is("user_id", null)
        .ilike("name", "salario")
        .maybeSingle();

      const rows = parsed.data.sources.map((source) => ({
        user_id: userId,
        category_id: incomeCategory?.id ?? null,
        kind: "income" as const,
        description: source.description,
        amount_cents: source.amountCents,
        frequency: source.frequency,
        anchor_day: source.frequency !== "weekly" ? source.anchorDay ?? 1 : null,
        weekday: source.frequency === "weekly" ? source.weekday ?? 1 : null,
        start_date: new Date().toISOString().slice(0, 10),
        is_estimate: source.isEstimate,
      }));

      const { error } = await supabase.from("recurrences").insert(rows);
      if (error) throw error;
    }
    await advanceStep(supabase, userId, 4);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveAccountsStep(input: AccountsStepInput): Promise<StepResult> {
  const parsed = accountsStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira as contas informadas." };

  try {
    const { supabase, userId } = await requireUser();
    if (parsed.data.accounts.length > 0) {
      const rows = parsed.data.accounts.map((a) => ({
        user_id: userId,
        name: a.name,
        kind: a.kind,
        institution_id: a.institutionId,
        initial_balance_cents: a.initialBalanceCents,
        initial_balance_date: a.initialBalanceDate,
      }));
      const { error } = await supabase.from("accounts").insert(rows);
      if (error) throw error;
    }
    await advanceStep(supabase, userId, 5);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveCardsStep(input: CardsStepInput): Promise<StepResult> {
  const parsed = cardsStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os cartoes informados." };

  try {
    const { supabase, userId } = await requireUser();

    for (const card of parsed.data.cards) {
      const { data: created, error } = await supabase
        .from("cards")
        .insert({
          user_id: userId,
          name: card.name,
          institution_id: card.institutionId,
          limit_cents: card.limitCents,
          closing_day: card.closingDay,
          due_day: card.dueDay,
        })
        .select()
        .single();
      if (error) throw error;

      if (card.existingInvoiceCents && card.existingInvoiceCents > 0) {
        const { error: purchaseError } = await supabase.rpc("create_card_purchase", {
          p_card_id: created.id,
          // A funcao aceita NULL (compra sem categoria); o tipo gerado exige
          // string porque o parametro tem default no SQL mas nao e opcional
          // posicionalmente. Ver supabase/migrations/...cards....sql.
          p_category_id: null as unknown as string,
          p_description: "Fatura em aberto ao cadastrar o cartao",
          p_total_amount_cents: card.existingInvoiceCents,
          p_installments_count: 1,
          p_purchase_date: new Date().toISOString().slice(0, 10),
        });
        if (purchaseError) throw purchaseError;
      }
    }

    await advanceStep(supabase, userId, 6);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveMonthlyBillsStep(input: MonthlyBillsStepInput): Promise<StepResult> {
  const parsed = monthlyBillsStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira as contas do mes." };

  try {
    const { supabase, userId } = await requireUser();
    if (parsed.data.bills.length > 0) {
      const rows = parsed.data.bills.map((bill) => ({
        user_id: userId,
        category_id: bill.categoryId,
        account_id: bill.accountId,
        kind: "expense" as const,
        description: bill.description,
        amount_cents: bill.amountCents,
        frequency: "monthly" as const,
        anchor_day: bill.anchorDay,
        start_date: new Date().toISOString().slice(0, 10),
      }));
      const { error } = await supabase.from("recurrences").insert(rows);
      if (error) throw error;
    }
    await advanceStep(supabase, userId, 7);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveDebtsStep(input: DebtsStepInput): Promise<StepResult> {
  const parsed = debtsStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira as dividas informadas." };

  try {
    const { supabase, userId } = await requireUser();
    if (parsed.data.debts.length > 0) {
      const rows = parsed.data.debts.map((debt) => ({
        user_id: userId,
        name: debt.name,
        principal_cents: debt.currentBalanceCents,
        current_balance_cents: debt.currentBalanceCents,
        known_charges_cents: debt.knownChargesCents ?? 0,
        installments_total: debt.installmentsTotal ?? null,
        installments_paid: debt.installmentsPaid ?? 0,
        next_due_date: debt.nextDueDate || null,
      }));
      const { error } = await supabase.from("debts").insert(rows);
      if (error) throw error;
    }
    await advanceStep(supabase, userId, 8);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveBudgetsStep(input: BudgetsStepInput): Promise<StepResult> {
  const parsed = budgetsStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os limites informados." };

  try {
    const { supabase, userId } = await requireUser();
    if (parsed.data.limits.length > 0) {
      const periodMonth = new Date();
      periodMonth.setDate(1);
      const periodMonthStr = periodMonth.toISOString().slice(0, 10);

      const rows = parsed.data.limits.map((limit) => ({
        user_id: userId,
        category_id: limit.categoryId,
        period_month: periodMonthStr,
        limit_cents: limit.limitCents,
      }));
      const { error } = await supabase.from("budgets").insert(rows);
      if (error) throw error;
    }
    await advanceStep(supabase, userId, 9);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveGoalStep(input: GoalStepInput | null): Promise<StepResult> {
  try {
    const { supabase, userId } = await requireUser();
    if (input) {
      const parsed = goalStepSchema.safeParse(input);
      if (!parsed.success) return { success: false, error: "Confira os dados da meta." };
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        name: parsed.data.name,
        target_cents: parsed.data.targetCents,
        target_date: parsed.data.targetDate || null,
        reserved_cents: parsed.data.reservedCents,
      });
      if (error) throw error;
    }
    await advanceStep(supabase, userId, 10);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function savePreferencesStep(input: PreferencesStepInput): Promise<StepResult> {
  const parsed = preferencesStepSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados invalidos." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        theme: parsed.data.theme,
        density: parsed.data.density,
        hide_values: parsed.data.hideValues,
        show_cents: parsed.data.showCents,
        first_day_of_week: parsed.data.firstDayOfWeek,
        animations_enabled: parsed.data.animationsEnabled,
        mascot_enabled: parsed.data.mascotEnabled,
      })
      .eq("user_id", userId);
    if (error) throw error;
    await setThemeCookie(parsed.data.theme);
    await advanceStep(supabase, userId, 11);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function advanceToReview(): Promise<StepResult> {
  try {
    const { supabase, userId } = await requireUser();
    await advanceStep(supabase, userId, 12);
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function finishOnboarding(): Promise<StepResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("complete_onboarding");
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function goBackToStep(step: number): Promise<StepResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("onboarding_state")
      .update({ current_step: step })
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/onboarding");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
