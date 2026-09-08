import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Bem-vindo de volta"
      title="Entrar na Setiva"
      subtitle="Seu mês, atualizado do jeito que você deixou."
    >
      {params.erro === "link_invalido" && (
        <p className="mb-4 rounded-[var(--radius-md)] bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
          Esse link expirou ou já foi usado. Faça login normalmente ou peça um novo.
        </p>
      )}
      <LoginForm proximo={params.proximo} />
    </AuthShell>
  );
}
