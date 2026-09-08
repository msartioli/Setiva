"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { deleteBudget, upsertBudget } from "@/actions/planning";
import { cn } from "@/lib/utils";

export interface BudgetRow {
  id: string;
  categoryId: string;
  categoryName: string;
  limitCents: number;
  spentCents: number;
}
interface CategoryOption {
  id: string;
  name: string;
}

export function BudgetsView({ budgets, categories }: { budgets: BudgetRow[]; categories: CategoryOption[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Orçamentos deste mês</h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableCategories.length === 0}>
              <Plus className="size-4" aria-hidden="true" />
              Novo limite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo limite de categoria</DialogTitle>
            </DialogHeader>
            <NewBudgetForm categories={availableCategories} onDone={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-foreground-muted">
          Nenhum orçamento definido para este mês ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {budgets.map((b) => (
            <BudgetItem key={b.id} budget={b} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BudgetItem({ budget }: { budget: BudgetRow }) {
  const [isPending, startTransition] = useTransition();
  const ratio = budget.limitCents > 0 ? budget.spentCents / budget.limitCents : 0;
  const over = ratio > 1;

  return (
    <li className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{budget.categoryName}</span>
        <div className="flex items-center gap-3">
          <span className={cn("tabular-figures", over ? "text-negative" : "text-foreground-muted")}>
            {formatCentsBRL(budget.spentCents)} de {formatCentsBRL(budget.limitCents)}
          </span>
          <button
            type="button"
            aria-label="Remover orçamento"
            disabled={isPending}
            onClick={() => startTransition(async () => { await deleteBudget(budget.id); })}
            className="text-foreground-muted hover:text-negative"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <div
          className={cn("h-full rounded-full transition-all", over ? "bg-negative" : "bg-brand")}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
    </li>
  );
}

function NewBudgetForm({ categories, onDone }: { categories: CategoryOption[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        try {
          const limitCents = parseBRLToCents(String(form.get("limit") ?? ""));
          startTransition(async () => {
            const result = await upsertBudget({ categoryId: String(form.get("categoryId")), limitCents });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <Field label="Categoria" htmlFor="budgetCategoryId">
        <select id="budgetCategoryId" name="categoryId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Limite mensal" htmlFor="limit">
        <Input id="limit" name="limit" inputMode="decimal" placeholder="R$ 0,00" required />
      </Field>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar limite"}
        </Button>
      </DialogFooter>
    </form>
  );
}
