"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { success: true } | { success: false; error: string };

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  density: z.enum(["comfortable", "compact"]),
  hideValues: z.boolean(),
  showCents: z.boolean(),
  firstDayOfWeek: z.union([z.literal(0), z.literal(1)]),
  animationsEnabled: z.boolean(),
  mascotEnabled: z.boolean(),
});

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  avatarFamily: z.string().max(40),
  avatarSeed: z.string().max(80),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, user };
}

export async function updateProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira os dados do perfil." };

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        nickname: parsed.data.nickname || null,
        avatar_family: parsed.data.avatarFamily,
        avatar_seed: parsed.data.avatarSeed,
      })
      .eq("user_id", user.id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updatePreferences(input: z.infer<typeof preferencesSchema>): Promise<ActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados invalidos." };

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        theme: parsed.data.theme,
        density: parsed.data.density,
        hide_values: parsed.data.hideValues,
        show_cents: parsed.data.showCents,
        first_day_of_week: parsed.data.firstDayOfWeek,
        animations_enabled: parsed.data.animationsEnabled,
        mascot_enabled: parsed.data.mascotEnabled,
      })
      .eq("user_id", user.id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function changePassword(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { success: false, error: "A senha precisa ter pelo menos 8 caracteres." };
  }
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Exclui a conta em duas etapas explicitas: primeiro o Storage do usuario
 * (avatares e capas de meta), depois o usuario em auth.users — o que
 * arrasta todos os dados via "on delete cascade". Reautenticacao (senha)
 * e exigida antes de chamar esta funcao.
 */
export async function deleteAccount(password: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { success: false, error: "Usuario nao autenticado." };

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (reauthError) {
      return { success: false, error: "Senha incorreta. Confirme sua senha para excluir a conta." };
    }

    const admin = createAdminClient();

    for (const bucket of ["avatars", "goal-covers"] as const) {
      const { data: files } = await admin.storage.from(bucket).list(user.id);
      if (files && files.length > 0) {
        await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    // O usuario ja foi removido de auth.users: invalidar o refresh token dele
    // no GoTrue pode falhar (sessao "orfa"), mas isso nao desfaz a exclusao
    // nem deve ser reportado como erro — so limpamos os cookies locais.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignorado de proposito, ver comentario acima
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
