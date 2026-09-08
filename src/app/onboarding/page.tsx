import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Configurar minha conta",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const [{ data: profile }, { data: state }, { data: categories }, { data: institutions }, { data: accounts }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("onboarding_state").select("*").eq("user_id", user.id).single(),
      supabase.from("categories").select("id, name, kind").is("user_id", null).order("name"),
      supabase.from("institutions").select("id, name, kind").order("sort_order"),
      supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null),
    ]);

  if (profile?.onboarding_completed_at) {
    redirect("/hoje");
  }

  return (
    <OnboardingFlow
      initialStep={state?.current_step ?? 1}
      profile={{
        displayName: profile?.display_name ?? "",
        nickname: profile?.nickname ?? "",
        avatarSeed: profile?.avatar_seed ?? user.id,
        avatarStyle: profile?.avatar_style ?? "notionists",
      }}
      incomeCategories={(categories ?? []).filter((c) => c.kind === "income")}
      expenseCategories={(categories ?? []).filter((c) => c.kind === "expense")}
      institutions={institutions ?? []}
      existingAccounts={accounts ?? []}
    />
  );
}
