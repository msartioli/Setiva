"use client";

import { useState, useTransition } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Archive, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { archiveRecurrence, createRecurrence, effectuateOccurrence, skipOccurrence } from "@/actions/planning";

export interface RecurrenceRow {
  id: string;
  kind: "income" | "expense";
  description: string;
  amountCents: number;
  anchorDay: number;
  isEstimate: boolean;
}
export interface OccurrenceRow {
  id: string;
  recurrenceDescription: string;
  kind: "income" | "expense";
  dueDate: string;
  amountCents: number;
}
interface CategoryOption {
  id: string;
  name: string;
  kind: "income" | "expense";
}
interface AccountOption {
  id: string;
  name: string;
}

export function RecurrencesView({
  recurrences,
  occurrences,
  categories,
  accounts,
}: {
  recurrences: RecurrenceRow[];
  occurrences: OccurrenceRow[];
  categories: CategoryOption[];
  accounts: AccountOption[];
}) {
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Próximas ocorrências</h2>
        </div>
        {occurrences.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-foreground-muted">
            Nada pendente por enquanto.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {occurrences.map((occ) => (
              <OccurrenceItem key={occ.id} occurrence={occ} accounts={accounts} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">Recorrências cadastradas</h2>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" aria-hidden="true" />
                Nova recorrência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova recorrência</DialogTitle>
              </DialogHeader>
              <NewRecurrenceForm categories={categories} accounts={accounts} onDone={() => setNewOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {recurrences.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-foreground-muted">
            Nenhuma recorrência cadastrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recurrences.map((r) => (
              <RecurrenceItem key={r.id} recurrence={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OccurrenceItem({ occurrence, accounts }: { occurrence: OccurrenceRow; accounts: AccountOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-foreground">
        {occurrence.kind === "income" ? (
          <ArrowUpRight className="size-4 text-positive" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="size-4 text-negative" aria-hidden="true" />
        )}
        <span>{occurrence.recurrenceDescription}</span>
        <span className="text-foreground-muted">· {formatDatePtBR(occurrence.dueDate)}</span>
        <span className="font-medium tabular-figures">{formatCentsBRL(occurrence.amountCents)}</span>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="h-9 rounded-[var(--radius-md)] border border-border bg-background px-2 text-xs"
          aria-label="Conta para efetivar"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={isPending || !accountId}
          onClick={() => startTransition(async () => { await effectuateOccurrence(occurrence.id, accountId); })}
        >
          <Check className="size-4" aria-hidden="true" />
          Efetivar
        </Button>
        <button
          type="button"
          aria-label="Dispensar ocorrência"
          disabled={isPending}
          onClick={() => startTransition(async () => { await skipOccurrence(occurrence.id); })}
          className="rounded-[var(--radius-sm)] p-1.5 text-foreground-muted hover:bg-background"
        >
          <X className="size-4" />
        </button>
      </div>
    </li>
  );
}

function RecurrenceItem({ recurrence }: { recurrence: RecurrenceRow }) {
  const [isPending, startTransition] = useTransition();
  return (
    <li className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        {recurrence.kind === "income" ? (
          <ArrowUpRight className="size-4 text-positive" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="size-4 text-negative" aria-hidden="true" />
        )}
        <span>{recurrence.description}</span>
        <span className="text-foreground-muted">· todo dia {recurrence.anchorDay}</span>
        {recurrence.isEstimate && <span className="text-xs text-warning">estimado</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium tabular-figures">{formatCentsBRL(recurrence.amountCents)}</span>
        <button
          type="button"
          aria-label="Arquivar recorrência"
          disabled={isPending}
          onClick={() => startTransition(async () => { await archiveRecurrence(recurrence.id); })}
          className="text-foreground-muted hover:text-negative"
        >
          <Archive className="size-4" />
        </button>
      </div>
    </li>
  );
}

function NewRecurrenceForm({
  categories,
  accounts,
  onDone,
}: {
  categories: CategoryOption[];
  accounts: AccountOption[];
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"income" | "expense">("expense");
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
          const amountCents = parseBRLToCents(String(form.get("amount") ?? ""));
          startTransition(async () => {
            const result = await createRecurrence({
              kind,
              description: String(form.get("description")),
              amountCents,
              anchorDay: Number(form.get("anchorDay")) || 1,
              categoryId: (form.get("categoryId") as string) || null,
              accountId: (form.get("accountId") as string) || null,
              isEstimate: form.get("isEstimate") === "on",
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <div className="flex gap-2">
        <Button type="button" variant={kind === "expense" ? "primary" : "secondary"} size="sm" onClick={() => setKind("expense")}>
          Despesa
        </Button>
        <Button type="button" variant={kind === "income" ? "primary" : "secondary"} size="sm" onClick={() => setKind("income")}>
          Receita
        </Button>
      </div>
      <Field label="Descrição" htmlFor="recDescription">
        <Input id="recDescription" name="description" required placeholder="Ex: Internet" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor" htmlFor="recAmount">
          <Input id="recAmount" name="amount" inputMode="decimal" placeholder="R$ 0,00" required />
        </Field>
        <Field label="Dia do mês" htmlFor="anchorDay">
          <Input id="anchorDay" name="anchorDay" type="number" min={1} max={31} defaultValue={10} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria" htmlFor="recCategoryId" optional>
          <select id="recCategoryId" name="categoryId" className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            <option value="">Sem categoria</option>
            {categories.filter((c) => c.kind === kind).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Conta" htmlFor="recAccountId" optional>
          <select id="recAccountId" name="accountId" className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            <option value="">Sem conta definida</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {kind === "income" && (
        <label className="flex items-center gap-2 text-sm text-foreground-muted">
          <input type="checkbox" name="isEstimate" className="size-4 accent-[var(--color-brand)]" />
          Valor variável / estimado
        </label>
      )}
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar recorrência"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function formatDatePtBR(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
