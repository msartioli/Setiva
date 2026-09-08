import { z } from "zod";

export const signUpSchema = z
  .object({
    email: z.email("Informe um email valido."),
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .regex(/[a-zA-Z]/, "A senha precisa ter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha precisa ter pelo menos um numero."),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      error: "Voce precisa aceitar os termos e a privacidade para continuar.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.email("Informe um email valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Informe um email valido."),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .regex(/[a-zA-Z]/, "A senha precisa ter pelo menos uma letra.")
      .regex(/[0-9]/, "A senha precisa ter pelo menos um numero."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
