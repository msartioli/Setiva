import { z } from "zod";

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome para a conta.").max(60),
  kind: z.enum(["checking", "savings", "wallet", "investment", "other"]),
  initialBalanceCents: z.number().int(),
  initialBalanceDate: z.string(),
});
export type AccountFormInput = z.infer<typeof accountFormSchema>;
