import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      eyebrow="Recuperação de acesso"
      title="Esqueceu sua senha?"
      subtitle="Informe o email da sua conta para receber um link de redefinição."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
