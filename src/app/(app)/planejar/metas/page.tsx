import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanejarTabs } from "@/components/layout/planejar-tabs";
import { GoalsView, type GoalRow } from "@/components/planning/goals-view";

export const metadata: Metadata = { title: "Metas" };

export default async function MetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: goals }, { data: accounts }, { data: profile }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, target_cents, reserved_cents, target_date, linked_account_id, cover_image_url")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at"),
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
    supabase.from("profiles").select("mascot_enabled").eq("user_id", user.id).single(),
  ]);

  const goalRows: GoalRow[] = await Promise.all(
    (goals ?? []).map(async (g) => {
      let coverUrl: string | null = null;
      if (g.cover_image_url) {
        const { data: signed } = await supabase.storage
          .from("goal-covers")
          .createSignedUrl(g.cover_image_url, 3600);
        coverUrl = signed?.signedUrl ?? null;
      }
      return {
        id: g.id,
        name: g.name,
        targetCents: g.target_cents,
        reservedCents: g.reserved_cents,
        targetDate: g.target_date,
        linkedAccountId: g.linked_account_id,
        coverUrl,
      };
    })
  );

  return (
    <div>
      <p className="text-sm font-medium text-brand">Planejar</p>
      <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Planejamento</h1>
      <PlanejarTabs />
      <GoalsView goals={goalRows} accounts={accounts ?? []} mascotEnabled={profile?.mascot_enabled ?? true} />
    </div>
  );
}
