"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signUpAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: ActionResult = {};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        hint="Pelo menos 8 caracteres, com letras e números."
        error={state.fieldErrors?.password}
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
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

      <Field label="Confirmar senha" htmlFor="confirmPassword" error={state.fieldErrors?.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
        />
      </Field>

      <label className="flex items-start gap-2.5 text-sm text-foreground-muted">
        <Checkbox name="acceptedTerms" required className="mt-0.5" />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="text-brand underline underline-offset-2">
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-brand underline underline-offset-2">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {state.fieldErrors?.acceptedTerms && (
        <p role="alert" className="-mt-3 text-xs font-medium text-negative">
          {state.fieldErrors.acceptedTerms}
        </p>
      )}

      {state.error && (
        <p role="alert" className="rounded-[var(--radius-md)] bg-negative-soft px-3.5 py-2.5 text-sm text-negative">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Criando conta..." : "Criar minha conta"}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-brand underline-offset-2 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
