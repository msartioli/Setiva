"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { Plus, Archive, Target, ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { addGoalContribution, archiveGoal, createGoal, removeGoalCover, updateGoalCover } from "@/actions/planning";
import { TivaCelebrate } from "@/components/mascot/tiva";

export interface GoalRow {
  id: string;
  name: string;
  targetCents: number;
  reservedCents: number;
  targetDate: string | null;
  linkedAccountId: string | null;
  coverUrl: string | null;
}
interface AccountOption {
  id: string;
  name: string;
}

export function GoalsView({
  goals,
  accounts,
  mascotEnabled,
}: {
  goals: GoalRow[];
  accounts: AccountOption[];
  mascotEnabled: boolean;
}) {
  const [newOpen, setNewOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<GoalRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Metas</h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nova meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova meta</DialogTitle>
            </DialogHeader>
            <NewGoalForm accounts={accounts} onDone={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-foreground-muted">
          Nenhuma meta cadastrada ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} mascotEnabled={mascotEnabled} onContribute={() => setContributingGoal(g)} />
          ))}
        </div>
      )}

      <Dialog open={Boolean(contributingGoal)} onOpenChange={(open) => !open && setContributingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aportar em {contributingGoal?.name}</DialogTitle>
          </DialogHeader>
          {contributingGoal && (
            <ContributionForm
              goal={contributingGoal}
              accounts={accounts}
              onDone={() => setContributingGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({
  goal,
  mascotEnabled,
  onContribute,
}: {
  goal: GoalRow;
  mascotEnabled: boolean;
  onContribute: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ratio = goal.targetCents > 0 ? Math.min(goal.reservedCents / goal.targetCents, 1) : 0;
  const isComplete = ratio >= 1;

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await updateGoalCover(goal.id, formData);
      if (!result.success) setCoverError(result.error);
    });
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      {goal.coverUrl && (
        <div className="relative h-28 w-full bg-background">
          <img src={goal.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Target className="size-4" aria-hidden="true" />
            Meta
          </div>
          <button
            type="button"
            aria-label="Arquivar meta"
            disabled={isPending}
            onClick={() => startTransition(async () => { await archiveGoal(goal.id); })}
            className="text-foreground-muted hover:text-negative"
          >
            <Archive className="size-4" />
          </button>
        </div>
        {isComplete && mascotEnabled && (
          <TivaCelebrate className="mx-auto mt-2 h-16 w-16" />
        )}
        <p className="mt-2 font-medium text-foreground">{goal.name}</p>
        <p className="mt-1 text-sm tabular-figures text-foreground-muted">
          {formatCentsBRL(goal.reservedCents)} de {formatCentsBRL(goal.targetCents)}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
          <div className="h-full rounded-full bg-accent" style={{ width: `${ratio * 100}%` }} />
        </div>
        {isComplete && <p className="mt-2 text-sm font-medium text-brand">Meta concluída.</p>}

        <div className="mt-3 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleCoverChange}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline disabled:opacity-60"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            {goal.coverUrl ? "Trocar capa" : "Adicionar capa"}
          </button>
          {goal.coverUrl && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await removeGoalCover(goal.id); })}
              className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-negative disabled:opacity-60"
            >
              <X className="size-3.5" aria-hidden="true" />
              Remover
            </button>
          )}
        </div>
        {coverError && (
          <p role="alert" className="mt-1 text-xs text-negative">
            {coverError}
          </p>
        )}

        <Button size="sm" variant="secondary" className="mt-3" onClick={onContribute}>
          Aportar
        </Button>
      </div>
    </div>
  );
}

function NewGoalForm({ accounts, onDone }: { accounts: AccountOption[]; onDone: () => void }) {
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
          const targetCents = parseBRLToCents(String(form.get("target") ?? ""));
          startTransition(async () => {
            const result = await createGoal({
              name: String(form.get("name")),
              targetCents,
              targetDate: String(form.get("targetDate") || ""),
              linkedAccountId: (form.get("linkedAccountId") as string) || null,
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <Field label="Nome da meta" htmlFor="goalName">
        <Input id="goalName" name="name" required placeholder="Ex: Viagem" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor alvo" htmlFor="target">
          <Input id="target" name="target" inputMode="decimal" placeholder="R$ 0,00" required />
        </Field>
        <Field label="Prazo" htmlFor="targetDate" optional>
          <Input id="targetDate" name="targetDate" type="date" />
        </Field>
      </div>
      <Field label="Conta vinculada" htmlFor="linkedAccountId" optional hint="Necessária para aportar por transferência.">
        <select id="linkedAccountId" name="linkedAccountId" className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
          <option value="">Nenhuma</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar meta"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ContributionForm({
  goal,
  accounts,
  onDone,
}: {
  goal: GoalRow;
  accounts: AccountOption[];
  onDone: () => void;
}) {
  const [kind, setKind] = useState<"reserved" | "transfer">(goal.linkedAccountId ? "transfer" : "reserved");
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
            const result = await addGoalContribution({
              goalId: goal.id,
              amountCents,
              contributionDate: new Date().toISOString().slice(0, 10),
              kind,
              fromAccountId: kind === "transfer" ? String(form.get("fromAccountId")) : null,
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
        <Button type="button" variant={kind === "reserved" ? "primary" : "secondary"} size="sm" onClick={() => setKind("reserved")}>
          Só marcar progresso
        </Button>
        <Button
          type="button"
          variant={kind === "transfer" ? "primary" : "secondary"}
          size="sm"
          disabled={!goal.linkedAccountId}
          onClick={() => setKind("transfer")}
        >
          Transferir dinheiro
        </Button>
      </div>
      {kind === "transfer" && (
        <Field label="Conta de origem" htmlFor="fromAccountId">
          <select id="fromAccountId" name="fromAccountId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            {accounts.filter((a) => a.id !== goal.linkedAccountId).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Valor do aporte" htmlFor="contribAmount">
        <Input id="contribAmount" name="amount" inputMode="decimal" placeholder="R$ 0,00" required />
      </Field>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Confirmar aporte"}
        </Button>
      </DialogFooter>
    </form>
  );
}
