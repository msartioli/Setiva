"use client";

import { useState, useTransition } from "react";
import { Plus, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { createDebt, registerDebtPayment } from "@/actions/planning";

export interface DebtRow {
  id: string;
  name: string;
  currentBalanceCents: number;
  knownChargesCents: number;
  nextDueDate: string | null;
  status: string;
}
interface AccountOption {
  id: string;
  name: string;
}

export function DebtsView({ debts, accounts }: { debts: DebtRow[]; accounts: AccountOption[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Dívidas</h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nova dívida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova dívida</DialogTitle>
            </DialogHeader>
            <NewDebtForm onDone={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {debts.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-foreground-muted">
          Nenhuma dívida cadastrada.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {debts.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Landmark className="size-4 text-foreground-muted" aria-hidden="true" />
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {d.status === "paid_off" ? "Quitada" : d.nextDueDate ? `Próximo vencimento ${formatDatePtBR(d.nextDueDate)}` : "Sem vencimento definido"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium tabular-figures text-foreground">{formatCentsBRL(d.currentBalanceCents)}</span>
                {d.status !== "paid_off" && (
                  <Button size="sm" variant="secondary" onClick={() => setPayingDebt(d)}>
                    Pagar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(payingDebt)} onOpenChange={(open) => !open && setPayingDebt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento — {payingDebt?.name}</DialogTitle>
          </DialogHeader>
          {payingDebt && <PaymentForm debt={payingDebt} accounts={accounts} onDone={() => setPayingDebt(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewDebtForm({ onDone }: { onDone: () => void }) {
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
          const currentBalanceCents = parseBRLToCents(String(form.get("balance") ?? ""));
          startTransition(async () => {
            const result = await createDebt({
              name: String(form.get("name")),
              currentBalanceCents,
              knownChargesCents: 0,
              nextDueDate: String(form.get("nextDueDate") || ""),
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <Field label="Nome" htmlFor="debtName">
        <Input id="debtName" name="name" required placeholder="Ex: Empréstimo pessoal" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Saldo devedor" htmlFor="balance">
          <Input id="balance" name="balance" inputMode="decimal" placeholder="R$ 0,00" required />
        </Field>
        <Field label="Próximo vencimento" htmlFor="nextDueDate" optional>
          <Input id="nextDueDate" name="nextDueDate" type="date" />
        </Field>
      </div>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Cadastrar dívida"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PaymentForm({ debt, accounts, onDone }: { debt: DebtRow; accounts: AccountOption[]; onDone: () => void }) {
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
            const result = await registerDebtPayment({
              debtId: debt.id,
              accountId: String(form.get("accountId")),
              amountCents,
              paymentDate: String(form.get("date")),
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
    >
      <Field label="Conta de pagamento" htmlFor="debtPayAccountId">
        <select id="debtPayAccountId" name="accountId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor" htmlFor="debtPayAmount">
          <Input
            id="debtPayAmount"
            name="amount"
            inputMode="decimal"
            defaultValue={(debt.currentBalanceCents / 100).toFixed(2).replace(".", ",")}
            required
          />
        </Field>
        <Field label="Data" htmlFor="debtPayDate">
          <Input id="debtPayDate" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </Field>
      </div>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Pagando..." : "Confirmar pagamento"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function formatDatePtBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
