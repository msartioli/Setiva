import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShellClient } from "@/components/layout/app-shell-client";
import { avatarDataUri, type AvatarFamilyKey } from "@/lib/avatars";
import { ensureNotifications } from "@/lib/notifications";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  await ensureNotifications(supabase, user.id);

  const [{ data: accounts }, { data: categories }, { count: unreadCount }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
    supabase
      .from("categories")
      .select("id, name, kind")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .order("name"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

  const familyKey = (profile.avatar_family as AvatarFamilyKey) || "retratos";
  const avatarUri = avatarDataUri(familyKey, profile.avatar_seed || user.id);

  return (
    <AppShellClient
      displayName={profile.display_name || profile.nickname || "Você"}
      avatarUri={avatarUri}
      accounts={accounts ?? []}
      categories={(categories ?? []) as { id: string; name: string; kind: "income" | "expense" }[]}
      unreadNotifications={unreadCount ?? 0}
    >
      {children}
    </AppShellClient>
  );
}
