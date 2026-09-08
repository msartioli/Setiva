"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { logInAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

const initialState: ActionResult = {};

export function LoginForm({ proximo }: { proximo?: string }) {
  const [state, formAction, isPending] = useActionState(logInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {proximo && <input type="hidden" name="proximo" value={proximo} />}

      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Senha" htmlFor="password" error={state.fieldErrors?.password}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground-muted hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <div className="-mt-2 text-right">
        <Link href="/auth/recuperar-senha" className="text-sm text-brand underline-offset-2 hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius-md)] bg-negative-soft px-3.5 py-2.5 text-sm text-negative">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand underline-offset-2 hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
