"use client";

import { useTransition } from "react";
import { Bell, BellOff, AlertTriangle, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { cn } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

const ICONS: Record<string, typeof Bell> = {
  due_soon: AlertTriangle,
  budget_limit: Wallet,
  goal_milestone: Target,
};

export function NotificationsView({ notifications }: { notifications: NotificationRow[] }) {
  const [isPending, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">Notificações</h1>
        {hasUnread && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(async () => { await markAllNotificationsRead(); })}
          >
            Marcar tudo como lido
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-foreground-muted">
          <BellOff className="size-6" aria-hidden="true" />
          Nada por aqui ainda.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-[var(--radius-lg)] border p-4",
                  n.readAt ? "border-border bg-surface" : "border-brand/30 bg-background"
                )}
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-foreground-muted">{n.body}</p>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await markNotificationRead(n.id); })}
                    className="shrink-0 text-xs font-medium text-brand hover:underline"
                  >
                    Marcar como lida
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
