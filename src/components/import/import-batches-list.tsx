"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { reverseImportBatch } from "@/actions/import";

export interface ImportBatchRow {
  id: string;
  sourceFilename: string | null;
  rowCount: number;
  status: string;
  createdAt: string;
}

export function ImportBatchesList({ batches }: { batches: ImportBatchRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (batches.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
      <h2 className="mb-4 font-display text-lg text-foreground">Lotes importados</h2>
      <ul className="flex flex-col gap-2">
        {batches.map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-background px-4 py-3 text-sm">
            <div>
              <p className="text-foreground">{b.sourceFilename ?? "Arquivo"}</p>
              <p className="text-xs text-foreground-muted">
                {b.rowCount} lançamento(s) · {new Date(b.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                {b.status === "reverted" ? "revertido" : "confirmado"}
              </p>
            </div>
            {b.status === "confirmed" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => startTransition(async () => { await reverseImportBatch(b.id); })}
              >
                Reverter
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
