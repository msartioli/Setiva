import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

export default function RedefinirSenhaPage() {
  return (
    <AuthShell
      eyebrow="Quase lá"
      title="Defina uma nova senha"
      subtitle="Escolha uma senha nova para voltar a acessar sua conta."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
