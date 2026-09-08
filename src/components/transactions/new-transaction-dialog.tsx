"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { parseBRLToCents } from "@/lib/finance/money";
import { createTransaction, createTransfer } from "@/actions/transactions";

interface AccountOption {
  id: string;
  name: string;
}
interface CategoryOption {
  id: string;
  name: string;
  kind: "income" | "expense";
}

export function NewTransactionDialog({
  open,
  onOpenChange,
  accounts,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const [tab, setTab] = useState<"expense" | "income" | "transfer">("expense");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>Esse valor já saiu (ou entrou) da sua conta?</DialogDescription>
        </DialogHeader>

        {accounts.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
            Cadastre uma conta em Visão geral antes de lançar movimentações.
          </p>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="expense">Despesa</TabsTrigger>
              <TabsTrigger value="income">Receita</TabsTrigger>
              <TabsTrigger value="transfer">Transferência</TabsTrigger>
            </TabsList>
            <TabsContent value="expense">
              <TransactionForm
                type="expense"
                accounts={accounts}
                categories={categories.filter((c) => c.kind === "expense")}
                onDone={() => onOpenChange(false)}
              />
            </TabsContent>
            <TabsContent value="income">
              <TransactionForm
                type="income"
                accounts={accounts}
                categories={categories.filter((c) => c.kind === "income")}
                onDone={() => onOpenChange(false)}
              />
            </TabsContent>
            <TabsContent value="transfer">
              <TransferForm accounts={accounts} onDone={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  type,
  accounts,
  categories,
  onDone,
}: {
  type: "income" | "expense";
  accounts: AccountOption[];
  categories: CategoryOption[];
  onDone: () => void;
}) {
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
            const result = await createTransaction({
              accountId: String(form.get("accountId")),
              categoryId: (form.get("categoryId") as string) || null,
              type,
              amountCents,
              description: String(form.get("description") ?? ""),
              competenceDate: String(form.get("date")),
              status: "completed",
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <Field label="Descrição" htmlFor="description">
        <Input id="description" name="description" required placeholder={type === "income" ? "Ex: Salário" : "Ex: Mercado"} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor" htmlFor="amount">
          <Input id="amount" name="amount" inputMode="decimal" placeholder="R$ 0,00" required />
        </Field>
        <Field label="Data" htmlFor="date">
          <Input id="date" name="date" type="date" defaultValue={today()} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Conta" htmlFor="accountId">
          <select id="accountId" name="accountId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria" htmlFor="categoryId" optional>
          <select id="categoryId" name="categoryId" className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            <option value="">Sem categoria</option>
            {categories.map((c) => (
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
          {isPending ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function TransferForm({ accounts, onDone }: { accounts: AccountOption[]; onDone: () => void }) {
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
            const result = await createTransfer({
              fromAccountId: String(form.get("fromAccountId")),
              toAccountId: String(form.get("toAccountId")),
              amountCents,
              transferDate: String(form.get("date")),
              description: String(form.get("description") ?? ""),
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="De" htmlFor="fromAccountId">
          <select id="fromAccountId" name="fromAccountId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Para" htmlFor="toAccountId">
          <select id="toAccountId" name="toAccountId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor" htmlFor="transferAmount">
          <Input id="transferAmount" name="amount" inputMode="decimal" placeholder="R$ 0,00" required />
        </Field>
        <Field label="Data" htmlFor="transferDate">
          <Input id="transferDate" name="date" type="date" defaultValue={today()} required />
        </Field>
      </div>
      <Field label="Descrição" htmlFor="transferDescription" optional>
        <Input id="transferDescription" name="description" placeholder="Ex: Reserva do mês" />
      </Field>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Transferindo..." : "Transferir"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
