import { z } from "zod";

export const importRowSchema = z.object({
  competenceDate: z.string(),
  description: z.string().trim().min(1).max(200),
  amountCents: z.number().int(),
  include: z.boolean(),
});
export type ImportRowInput = z.infer<typeof importRowSchema>;

export const confirmImportSchema = z.object({
  accountId: z.string().uuid(),
  sourceFilename: z.string().max(200),
  rows: z.array(importRowSchema).min(1),
});
export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
