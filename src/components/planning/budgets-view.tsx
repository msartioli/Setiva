"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { deleteBudget, upsertBudget } from "@/actions/planning";
import { categoryVisual } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

export interface BudgetRow {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  limitCents: number;
  spentCents: number;
}
interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
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
  const visual = categoryVisual(budget.categoryIcon, budget.categoryName);
  const Icon = visual.icon;

  const ratio = budget.limitCents > 0 ? budget.spentCents / budget.limitCents : 0;
  const remainingCents = budget.limitCents - budget.spentCents;
  // Tres faixas: dentro do limite, perto do limite (>=80%) e estourado. O
  // aviso de 80% e o ponto util: depois de estourar, avisar ja nao evita nada.
  const zone = ratio >= 1 ? "over" : ratio >= 0.8 ? "near" : "safe";

  return (
    <li className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", visual.className)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{budget.categoryName}</p>
          <p className="text-xs tabular-figures text-foreground-muted">
            {formatCentsBRL(budget.spentCents)} de {formatCentsBRL(budget.limitCents)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-figures",
            zone === "over" && "bg-negative-soft text-negative",
            zone === "near" && "bg-warning-soft text-warning",
            zone === "safe" && "bg-positive-soft text-positive"
          )}
        >
          {Math.round(ratio * 100)}%
        </span>
        <button
          type="button"
          aria-label={`Remover orçamento de ${budget.categoryName}`}
          disabled={isPending}
          onClick={() => startTransition(async () => { await deleteBudget(budget.id); })}
          className="shrink-0 text-foreground-muted hover:text-negative"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            zone === "over" && "bg-negative",
            zone === "near" && "bg-warning",
            zone === "safe" && "bg-brand"
          )}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>

      {zone === "over" && (
        <p className="mt-2.5 flex items-start gap-2 text-xs font-medium text-negative">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Estourou {formatCentsBRL(Math.abs(remainingCents))} do limite. Vale segurar novos gastos aqui até o mês
          virar.
        </p>
      )}
      {zone === "near" && (
        <p className="mt-2.5 flex items-start gap-2 text-xs font-medium text-warning">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Sobram só {formatCentsBRL(remainingCents)} deste limite.
        </p>
      )}
    </li>
  );
}

function NewBudgetForm({ categories, onDone }: { categories: CategoryOption[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        if (!categoryId) {
          setError("Escolha uma categoria.");
          return;
        }
        try {
          const limitCents = parseBRLToCents(String(form.get("limit") ?? ""));
          startTransition(async () => {
            const result = await upsertBudget({ categoryId, limitCents });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Categoria</legend>
        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {categories.map((c) => {
            const visual = categoryVisual(c.icon, c.name);
            const Icon = visual.icon;
            const selected = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border p-3 text-center transition-colors",
                  selected
                    ? "border-brand bg-brand/8 ring-2 ring-brand"
                    : "border-border bg-surface hover:border-border-strong"
                )}
              >
                <span className={cn("flex size-10 items-center justify-center rounded-xl", visual.className)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-medium leading-tight text-foreground">{c.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
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
