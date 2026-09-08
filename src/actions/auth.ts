"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordSignupConsents } from "@/lib/legal";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/validations/auth";

export interface ActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function firstFieldErrors(tree: Record<string, { errors: string[] } | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (value?.errors?.[0]) out[key] = value.errors[0];
  }
  return out;
}

export async function signUpAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });

  if (!parsed.success) {
    const tree = parsed.error.flatten().fieldErrors;
    return {
      error: "Confira os campos destacados.",
      fieldErrors: firstFieldErrors(tree as Record<string, { errors: string[] } | undefined>),
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: traduzErroAuth(error.message) };
  }

  if (data.session) {
    await recordSignupConsents(supabase);
    redirect("/onboarding");
  }

  redirect("/auth/confirmar?email=" + encodeURIComponent(parsed.data.email));
}

export async function logInAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const tree = parsed.error.flatten().fieldErrors;
    return {
      error: "Confira os campos destacados.",
      fieldErrors: firstFieldErrors(tree as Record<string, { errors: string[] } | undefined>),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: traduzErroAuth(error.message) };
  }

  const proximo = formData.get("proximo");
  redirect(typeof proximo === "string" && proximo.startsWith("/") ? proximo : "/hoje");
}

export async function logOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Informe um email valido." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/redefinir-senha`,
  });

  // Nunca revelar se o email existe ou nao: mesma resposta de sucesso sempre.
  return { success: true };
}

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const tree = parsed.error.flatten().fieldErrors;
    return {
      error: "Confira os campos destacados.",
      fieldErrors: firstFieldErrors(tree as Record<string, { errors: string[] } | undefined>),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: traduzErroAuth(error.message) };
  }

  redirect("/hoje");
}

function traduzErroAuth(message: string): string {
  const mapa: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos.",
    "User already registered": "Ja existe uma conta com este email.",
    "Email not confirmed": "Confirme seu email antes de entrar.",
    "Password should be at least 6 characters": "A senha e muito curta.",
    "For security purposes, you can only request this after some seconds.":
      "Por seguranca, aguarde alguns segundos antes de tentar de novo.",
  };
  return mapa[message] ?? "Nao foi possivel completar a operacao. Tente novamente.";
}
