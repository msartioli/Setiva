"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { formatCentsBRL } from "@/lib/finance/money";
import { deleteTransaction, deleteTransfer } from "@/actions/transactions";
import { EditTransactionDialog, type EditableTransaction } from "./edit-transaction-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface TransactionRow {
  id: string;
  type: "income" | "expense" | "transfer";
  transferId: string | null;
  transferLeg: "out" | "in" | null;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  amountCents: number;
  description: string;
  competenceDate: string;
}

interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  kind: "income" | "expense";
}

export function TransactionsTable({
  rows,
  accounts,
  categories,
}: {
  rows: TransactionRow[];
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const [editing, setEditing] = useState<EditableTransaction | null>(null);
  const [deletingRow, setDeletingRow] = useState<TransactionRow | null>(null);
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-foreground-muted">
        Nenhuma movimentação neste período. Use &ldquo;Novo lançamento&rdquo; para começar.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="whitespace-nowrap px-4 py-3 tabular-figures text-foreground-muted">
                  {formatDatePtBR(row.competenceDate)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={row.type} />
                    <span className="truncate">{row.description}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{row.categoryName ?? "—"}</td>
                <td className="px-4 py-3 text-foreground-muted">{row.accountName}</td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right tabular-figures font-medium ${
                    row.type === "expense" || row.transferLeg === "out"
                      ? "text-negative"
                      : row.type === "income" || row.transferLeg === "in"
                        ? "text-positive"
                        : "text-foreground"
                  }`}
                >
                  {row.type === "expense" || row.transferLeg === "out"
                    ? "-"
                    : row.type === "income" || row.transferLeg === "in"
                      ? "+"
                      : ""}
                  {formatCentsBRL(row.amountCents)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {row.type !== "transfer" && (
                      <button
                        type="button"
                        aria-label="Editar lançamento"
                        onClick={() =>
                          setEditing({
                            id: row.id,
                            type: row.type as "income" | "expense",
                            accountId: row.accountId,
                            categoryId: row.categoryId,
                            amountCents: row.amountCents,
                            description: row.description,
                            competenceDate: row.competenceDate,
                          })
                        }
                        className="rounded-[var(--radius-sm)] p-1.5 text-foreground-muted hover:bg-background hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Excluir lançamento"
                      onClick={() => setDeletingRow(row)}
                      className="rounded-[var(--radius-sm)] p-1.5 text-foreground-muted hover:bg-negative-soft hover:text-negative"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditTransactionDialog
        transaction={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        accounts={accounts}
        categories={categories}
      />

      <Dialog open={Boolean(deletingRow)} onOpenChange={(open) => !open && setDeletingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento?</DialogTitle>
            <DialogDescription>
              {deletingRow?.type === "transfer"
                ? "Isso remove as duas pernas da transferência. Essa ação não pode ser desfeita."
                : "Essa ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeletingRow(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (!deletingRow) return;
                startTransition(async () => {
                  if (deletingRow.type === "transfer" && deletingRow.transferId) {
                    await deleteTransfer(deletingRow.transferId);
                  } else {
                    await deleteTransaction(deletingRow.id);
                  }
                  setDeletingRow(null);
                });
              }}
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TypeIcon({ type }: { type: TransactionRow["type"] }) {
  if (type === "income") return <ArrowUpRight className="size-4 shrink-0 text-positive" aria-hidden="true" />;
  if (type === "expense") return <ArrowDownRight className="size-4 shrink-0 text-negative" aria-hidden="true" />;
  return <ArrowLeftRight className="size-4 shrink-0 text-info" aria-hidden="true" />;
}

function formatDatePtBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
