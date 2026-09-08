import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function CadastroPage() {
  return (
    <AuthShell
      eyebrow="Comece agora"
      title="Crie sua conta na Setiva"
      subtitle="Sem cartão de crédito, sem promessa de plano gratuito para sempre — só o cadastro para organizar o seu mês."
    >
      <SignUpForm />
    </AuthShell>
  );
}
