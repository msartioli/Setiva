import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Confirme seu email",
};

export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell
      eyebrow="Falta pouco"
      title="Confira seu email"
      subtitle="Mandamos um link de confirmação. Ele expira depois de um tempo, então confirme logo."
    >
      <div className="flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <MailCheck className="size-8 text-brand" aria-hidden="true" />
        <p className="text-sm text-foreground">
          {email ? (
            <>
              Enviamos um link de confirmação para <strong>{email}</strong>.
            </>
          ) : (
            "Enviamos um link de confirmação para o email que você cadastrou."
          )}{" "}
          Abra o email e clique no link para ativar sua conta.
        </p>
        <p className="text-sm text-foreground-muted">
          Não chegou? Confira a caixa de spam ou tente entrar de novo daqui a alguns minutos para reenviar.
        </p>
        <Button asChild variant="secondary">
          <Link href="/entrar">Voltar para o login</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
