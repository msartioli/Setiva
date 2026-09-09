import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AccountsView, type AccountWithBalance } from "@/components/accounts/accounts-view";
import { VisaoGeralTabs } from "@/components/layout/visao-geral-tabs";
import { getFinancialInstitutions } from "@/lib/integrations/financial-institutions/service";

export const metadata: Metadata = { title: "Visão geral" };

export default async function VisaoGeralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: accounts }, { data: balances }, institutions] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, kind, institution_display_name, institution_logo_url")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at"),
    supabase.from("account_realized_balances").select("account_id, balance_cents"),
    getFinancialInstitutions(),
  ]);

  const balanceByAccount = new Map((balances ?? []).map((b) => [b.account_id, b.balance_cents]));

  const items: AccountWithBalance[] = (accounts ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    balanceCents: balanceByAccount.get(a.id) ?? 0,
    institutionName: a.institution_display_name,
    institutionLogoUrl: a.institution_logo_url,
  }));

  return (
    <div>
      <p className="text-sm font-medium text-brand">Visão geral</p>
      <h1 className="mb-4 font-display text-2xl text-foreground sm:text-3xl">Contas e cartões</h1>
      <VisaoGeralTabs />
      <AccountsView accounts={items} institutions={institutions} />
    </div>
  );
}
