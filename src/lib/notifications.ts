import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import { addMonthsISO, todayISO } from "./dates";

/**
 * Gera notificacoes idempotentes (vencimento proximo, limite de orcamento
 * estourado, meta concluida) a partir do estado atual. Seguro chamar em
 * toda carga de pagina: o indice unico em notifications
 * (user_id, type, related_entity_type, related_entity_id) evita duplicar.
 */
export async function ensureNotifications(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!prefs) return;

  const today = todayISO();
  const rows: Database["public"]["Tables"]["notifications"]["Insert"][] = [];

  if (prefs.due_soon_enabled) {
    const horizon = addMonthsISO(today, 1);
    const { data: commitments } = await supabase
      .from("upcoming_commitments")
      .select("*")
      .lte("due_date", horizon);

    for (const c of commitments ?? []) {
      if (!c.due_date || !c.id) continue;
      const daysUntil = daysBetween(today, c.due_date);
      if (daysUntil >= 0 && daysUntil <= prefs.due_soon_days_before) {
        rows.push({
          user_id: userId,
          type: "due_soon",
          title: `${c.description} vence em breve`,
          body: `Vencimento em ${formatDatePtBR(c.due_date)}.`,
          related_entity_type: c.source,
          related_entity_id: c.id,
        });
      }
    }
  }

  if (prefs.budget_limit_enabled) {
    const { data: budgets } = await supabase.from("budget_progress").select("*, categories(name)");
    for (const b of budgets ?? []) {
      if (!b.budget_id || !b.limit_cents) continue;
      if ((b.spent_cents ?? 0) >= b.limit_cents) {
        rows.push({
          user_id: userId,
          type: "budget_limit",
          title: `Orçamento de ${(b.categories as unknown as { name: string } | null)?.name ?? "categoria"} estourou`,
          body: "O valor gasto já atingiu o limite definido para este mês.",
          related_entity_type: "budget",
          related_entity_id: b.budget_id,
        });
      }
    }
  }

  if (prefs.goal_milestone_enabled) {
    const { data: goals } = await supabase
      .from("goals")
      .select("id, name, status")
      .eq("status", "completed");
    for (const g of goals ?? []) {
      rows.push({
        user_id: userId,
        type: "goal_milestone",
        title: `Meta "${g.name}" concluída`,
        body: "Você já reservou o valor total desta meta.",
        related_entity_type: "goal",
        related_entity_id: g.id,
      });
    }
  }

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from("notifications").upsert(rows, {
      onConflict: "user_id,type,related_entity_type,related_entity_id",
      ignoreDuplicates: true,
    });
    if (upsertError) {
      console.error("[ensureNotifications] falha ao gravar notificacoes:", upsertError.message);
    }
  }
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00Z`).getTime();
  const to = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function formatDatePtBR(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
