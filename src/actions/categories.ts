"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };

const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["income", "expense"]),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario nao autenticado");
  return { supabase, userId: user.id };
}

export async function createCategory(input: z.infer<typeof categorySchema>): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Confira o nome da categoria." };

  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from("categories").insert({
      user_id: userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
    });
    if (error) throw error;
    revalidatePath("/configuracoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function archiveCategory(id: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from("categories")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/configuracoes");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
