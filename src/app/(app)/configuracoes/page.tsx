import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsView, type SettingsProfile } from "@/components/settings/settings-view";
import type { AvatarFamilyKey } from "@/lib/avatars";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("categories")
      .select("id, name, kind")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("name"),
  ]);

  const settingsProfile: SettingsProfile = {
    displayName: profile?.display_name ?? "",
    nickname: profile?.nickname ?? "",
    avatarFamily: (profile?.avatar_family as AvatarFamilyKey) || "retratos",
    avatarSeed: profile?.avatar_seed || user.id,
    theme: profile?.theme ?? "system",
    density: (profile?.density as "comfortable" | "compact") ?? "comfortable",
    hideValues: profile?.hide_values ?? false,
    showCents: profile?.show_cents ?? true,
    firstDayOfWeek: (profile?.first_day_of_week as 0 | 1) ?? 0,
    animationsEnabled: profile?.animations_enabled ?? true,
    mascotEnabled: profile?.mascot_enabled ?? true,
  };

  return (
    <div>
      <p className="text-sm font-medium text-brand">Sua conta</p>
      <h1 className="mb-6 font-display text-2xl text-foreground sm:text-3xl">Configurações</h1>
      <SettingsView
        profile={settingsProfile}
        categories={(categories ?? []) as { id: string; name: string; kind: "income" | "expense" }[]}
      />
    </div>
  );
}
