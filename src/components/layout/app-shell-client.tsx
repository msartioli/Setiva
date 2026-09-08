"use client";

import { useState } from "react";
import { AppShell } from "./app-shell";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";

interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  kind: "income" | "expense";
}

export function AppShellClient({
  displayName,
  avatarUri,
  accounts,
  categories,
  unreadNotifications,
  children,
}: {
  displayName: string;
  avatarUri: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShell
      displayName={displayName}
      avatarUri={avatarUri}
      unreadNotifications={unreadNotifications}
      onNewTransaction={() => setDialogOpen(true)}
    >
      {children}
      <NewTransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} accounts={accounts} categories={categories} />
    </AppShell>
  );
}
