import { z } from "zod";

export const profileStepSchema = z.object({
  displayName: z.string().trim().min(1, "Diga como quer ser chamado.").max(80),
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  avatarFamily: z.string().max(40).optional(),
  avatarStyle: z.string().max(40).optional(),
  avatarSeed: z.string().max(80).optional(),
});
export type ProfileStepInput = z.infer<typeof profileStepSchema>;

export const goalsIntentSchema = z.object({
  intents: z.array(z.enum(["gastos", "atrasos", "guardar", "dividas", "visao-geral"])).min(1),
});
export type GoalsIntentInput = z.infer<typeof goalsIntentSchema>;

export const incomeSourceSchema = z.object({
  description: z.string().trim().min(1).max(120),
  amountCents: z.number().int().positive(),
  frequency: z.enum(["monthly", "weekly", "yearly"]),
  anchorDay: z.number().int().min(1).max(31).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  isEstimate: z.boolean(),
});
export const incomeStepSchema = z.object({
  sources: z.array(incomeSourceSchema),
});
export type IncomeStepInput = z.infer<typeof incomeStepSchema>;

export const accountSchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["checking", "savings", "wallet", "investment", "other"]),
  institutionId: z.string().uuid().nullable(),
  initialBalanceCents: z.number().int(),
  initialBalanceDate: z.string(),
});
export const accountsStepSchema = z.object({
  accounts: z.array(accountSchema),
});
export type AccountsStepInput = z.infer<typeof accountsStepSchema>;

export const cardSchema = z.object({
  name: z.string().trim().min(1).max(60),
  institutionId: z.string().uuid().nullable(),
  limitCents: z.number().int().min(0),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  existingInvoiceCents: z.number().int().min(0).optional(),
});
export const cardsStepSchema = z.object({
  cards: z.array(cardSchema),
});
export type CardsStepInput = z.infer<typeof cardsStepSchema>;

export const monthlyBillSchema = z.object({
  description: z.string().trim().min(1).max(120),
  amountCents: z.number().int().positive(),
  categoryId: z.string().uuid().nullable(),
  anchorDay: z.number().int().min(1).max(31),
  accountId: z.string().uuid().nullable(),
});
export const monthlyBillsStepSchema = z.object({
  bills: z.array(monthlyBillSchema),
});
export type MonthlyBillsStepInput = z.infer<typeof monthlyBillsStepSchema>;

export const debtSchema = z.object({
  name: z.string().trim().min(1).max(80),
  currentBalanceCents: z.number().int().positive(),
  installmentsTotal: z.number().int().min(1).optional(),
  installmentsPaid: z.number().int().min(0).optional(),
  nextDueDate: z.string().optional(),
  knownChargesCents: z.number().int().min(0).optional(),
});
export const debtsStepSchema = z.object({
  debts: z.array(debtSchema),
});
export type DebtsStepInput = z.infer<typeof debtsStepSchema>;

export const budgetLimitSchema = z.object({
  categoryId: z.string().uuid(),
  limitCents: z.number().int().positive(),
});
export const budgetsStepSchema = z.object({
  limits: z.array(budgetLimitSchema),
});
export type BudgetsStepInput = z.infer<typeof budgetsStepSchema>;

export const goalStepSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetCents: z.number().int().positive(),
  targetDate: z.string().optional(),
  reservedCents: z.number().int().min(0),
});
export type GoalStepInput = z.infer<typeof goalStepSchema>;

export const preferencesStepSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  density: z.enum(["comfortable", "compact"]),
  hideValues: z.boolean(),
  showCents: z.boolean(),
  firstDayOfWeek: z.union([z.literal(0), z.literal(1)]),
  animationsEnabled: z.boolean(),
  mascotEnabled: z.boolean(),
});
export type PreferencesStepInput = z.infer<typeof preferencesStepSchema>;
