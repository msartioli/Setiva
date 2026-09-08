import { z } from "zod";

export const createTransactionSchema = z.object({
  accountId: z.string().uuid("Escolha uma conta."),
  categoryId: z.string().uuid().nullable(),
  type: z.enum(["income", "expense"]),
  amountCents: z.number().int().positive("Informe um valor maior que zero."),
  description: z.string().trim().max(200).default(""),
  competenceDate: z.string(),
  status: z.enum(["pending", "completed"]).default("completed"),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().uuid(),
});
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const createTransferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amountCents: z.number().int().positive("Informe um valor maior que zero."),
  transferDate: z.string(),
  description: z.string().trim().max(200).default(""),
});
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
