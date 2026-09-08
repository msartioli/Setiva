import { z } from "zod";

export const cardFormSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome para o cartão.").max(60),
  limitCents: z.number().int().min(0),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
});
export type CardFormInput = z.infer<typeof cardFormSchema>;

export const cardPurchaseSchema = z.object({
  cardId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  description: z.string().trim().min(1).max(200),
  totalAmountCents: z.number().int().positive(),
  installmentsCount: z.number().int().min(1).max(48),
  purchaseDate: z.string(),
});
export type CardPurchaseInput = z.infer<typeof cardPurchaseSchema>;

export const invoicePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  accountId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  paymentDate: z.string(),
});
export type InvoicePaymentInput = z.infer<typeof invoicePaymentSchema>;
