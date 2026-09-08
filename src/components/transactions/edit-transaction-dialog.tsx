"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { parseBRLToCents } from "@/lib/finance/money";
import { updateTransaction } from "@/actions/transactions";

interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  kind: "income" | "expense";
}
export interface EditableTransaction {
  id: string;
  type: "income" | "expense";
  accountId: string;
  categoryId: string | null;
  amountCents: number;
  description: string;
  competenceDate: string;
}

export function EditTransactionDialog({
  transaction,
  onOpenChange,
  accounts,
  categories,
}: {
  transaction: EditableTransaction | null;
  onOpenChange: (open: boolean) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!transaction) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }

  const relevantCategories = categories.filter((c) => c.kind === transaction.type);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setError(null);
            try {
              const amountCents = parseBRLToCents(String(form.get("amount") ?? ""));
              startTransition(async () => {
                const result = await updateTransaction({
                  id: transaction.id,
                  accountId: String(form.get("accountId")),
                  categoryId: (form.get("categoryId") as string) || null,
                  type: transaction.type,
                  amountCents,
                  description: String(form.get("description") ?? ""),
                  competenceDate: String(form.get("date")),
                  status: "completed",
                });
                if (result.success) onOpenChange(false);
                else setError(result.error);
              });
            } catch {
              setError("Valor inválido.");
            }
          }}
        >
          <Field label="Descrição" htmlFor="edit-description">
            <Input id="edit-description" name="description" defaultValue={transaction.description} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor" htmlFor="edit-amount">
              <Input
                id="edit-amount"
                name="amount"
                inputMode="decimal"
                defaultValue={(transaction.amountCents / 100).toFixed(2).replace(".", ",")}
                required
              />
            </Field>
            <Field label="Data" htmlFor="edit-date">
              <Input id="edit-date" name="date" type="date" defaultValue={transaction.competenceDate} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Conta" htmlFor="edit-accountId">
              <select
                id="edit-accountId"
                name="accountId"
                defaultValue={transaction.accountId}
                required
                className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoria" htmlFor="edit-categoryId" optional>
              <select
                id="edit-categoryId"
                name="categoryId"
                defaultValue={transaction.categoryId ?? ""}
                className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
              >
                <option value="">Sem categoria</option>
                {relevantCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {error && <p role="alert" className="text-sm text-negative">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
