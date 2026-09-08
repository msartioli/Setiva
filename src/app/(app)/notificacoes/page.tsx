import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NotificationsView, type NotificationRow } from "@/components/notifications/notifications-view";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: NotificationRow[] = (notifications ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));

  return <NotificationsView notifications={rows} />;
}
