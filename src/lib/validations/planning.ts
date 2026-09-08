import { z } from "zod";

export const recurrenceFormSchema = z.object({
  kind: z.enum(["income", "expense"]),
  description: z.string().trim().min(1).max(120),
  amountCents: z.number().int().positive(),
  anchorDay: z.number().int().min(1).max(31),
  categoryId: z.string().uuid().nullable(),
  accountId: z.string().uuid().nullable(),
  isEstimate: z.boolean().default(false),
});
export type RecurrenceFormInput = z.infer<typeof recurrenceFormSchema>;

export const budgetFormSchema = z.object({
  categoryId: z.string().uuid(),
  limitCents: z.number().int().positive(),
});
export type BudgetFormInput = z.infer<typeof budgetFormSchema>;

export const goalFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetCents: z.number().int().positive(),
  targetDate: z.string().optional(),
  linkedAccountId: z.string().uuid().nullable(),
});
export type GoalFormInput = z.infer<typeof goalFormSchema>;

export const goalContributionSchema = z.object({
  goalId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  contributionDate: z.string(),
  kind: z.enum(["reserved", "transfer"]),
  fromAccountId: z.string().uuid().nullable(),
});
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;

export const debtFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  currentBalanceCents: z.number().int().positive(),
  knownChargesCents: z.number().int().min(0).default(0),
  nextDueDate: z.string().optional(),
});
export type DebtFormInput = z.infer<typeof debtFormSchema>;

export const debtPaymentSchema = z.object({
  debtId: z.string().uuid(),
  accountId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  paymentDate: z.string(),
});
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
