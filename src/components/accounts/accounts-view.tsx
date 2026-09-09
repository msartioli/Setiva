"use client";

import { useState, useTransition } from "react";
import { Plus, Wallet, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { archiveAccount, createAccount } from "@/actions/accounts";
import { BankSelector } from "@/components/banks/bank-selector";
import { BankLogo } from "@/components/banks/bank-logo";
import type { FinancialInstitution } from "@/lib/integrations/financial-institutions/types";

export interface AccountWithBalance {
  id: string;
  name: string;
  kind: string;
  balanceCents: number;
  institutionName: string | null;
  institutionLogoUrl: string | null;
}

const KIND_LABELS: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira",
  investment: "Investimento",
  other: "Outra",
};

export function AccountsView({
  accounts,
  institutions,
}: {
  accounts: AccountWithBalance[];
  institutions: FinancialInstitution[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Suas contas</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nova conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta</DialogTitle>
            </DialogHeader>
            <NewAccountForm institutions={institutions} onDone={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhuma conta cadastrada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountCard({ account }: { account: AccountWithBalance }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          {account.institutionName ? (
            <BankLogo name={account.institutionName} logoUrl={account.institutionLogoUrl} className="size-5 shrink-0" />
          ) : (
            <Wallet className="size-4" aria-hidden="true" />
          )}
          {KIND_LABELS[account.kind] ?? account.kind}
        </div>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Arquivar conta"
            className="text-foreground-muted hover:text-negative"
          >
            <Archive className="size-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await archiveAccount(account.id); })}
              className="font-medium text-negative"
            >
              Confirmar
            </button>
            <span className="text-foreground-muted">/</span>
            <button type="button" onClick={() => setConfirming(false)} className="text-foreground-muted">
              Cancelar
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 truncate font-medium text-foreground">{account.name}</p>
      <p className="mt-1 font-display text-xl tabular-figures text-foreground">
        {formatCentsBRL(account.balanceCents)}
      </p>
    </div>
  );
}

function NewAccountForm({
  institutions,
  onDone,
}: {
  institutions: FinancialInstitution[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("checking");
  const [institution, setInstitution] = useState<FinancialInstitution | null>(null);
  const [negative, setNegative] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        try {
          let initialBalanceCents = form.get("balance") ? parseBRLToCents(String(form.get("balance"))) : 0;
          if (negative) initialBalanceCents = -Math.abs(initialBalanceCents);
          startTransition(async () => {
            const result = await createAccount({
              name: String(form.get("name")),
              kind: kind as never,
              institutionIspb: institution?.ispb ?? null,
              initialBalanceCents,
              initialBalanceDate: String(form.get("date")),
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Saldo inválido.");
        }
      }}
    >
      <Field label="Nome da conta" htmlFor="name">
        <Input id="name" name="name" required placeholder="Ex: Nubank" />
      </Field>
      <Field label="Tipo" htmlFor="kind">
        <select
          id="kind"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            if (e.target.value === "wallet") setInstitution(null);
          }}
          className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
        >
          <option value="checking">Conta corrente</option>
          <option value="savings">Poupança</option>
          <option value="wallet">Carteira</option>
          <option value="investment">Investimento</option>
          <option value="other">Outra</option>
        </select>
      </Field>
      {kind !== "wallet" && (
        <Field label="Banco (opcional)" htmlFor="institution">
          <BankSelector institutions={institutions} value={institution} onSelect={setInstitution} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Saldo atual" htmlFor="balance" optional>
          <Input id="balance" name="balance" inputMode="decimal" placeholder="R$ 0,00" />
        </Field>
        <Field label="Data do saldo" htmlFor="date">
          <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={negative} onCheckedChange={setNegative} />
        <span className="text-sm text-foreground-muted">Saldo negativo (conta no vermelho)</span>
      </div>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar conta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
