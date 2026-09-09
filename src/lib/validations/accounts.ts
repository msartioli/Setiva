import { z } from "zod";

export const accountFormSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome para a conta.").max(60),
  kind: z.enum(["checking", "savings", "wallet", "investment", "other"]),
  // So o ISPB; nome/logo da instituicao sao resolvidos no servidor a partir
  // dele, nunca aceitos do cliente (ver createAccount).
  institutionIspb: z
    .string()
    .regex(/^\d{8}$/, "ISPB invalido")
    .nullable()
    .optional(),
  initialBalanceCents: z.number().int(),
  initialBalanceDate: z.string(),
});
export type AccountFormInput = z.infer<typeof accountFormSchema>;
