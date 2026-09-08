"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

const initialState: ActionResult = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-4 text-sm text-foreground">
        Se esse email tiver uma conta na Setiva, enviamos um link para redefinir a senha. Confira sua
        caixa de entrada e o spam.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field label="Email da sua conta" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        <Link href="/entrar" className="font-medium text-brand underline-offset-2 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
