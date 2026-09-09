"use client";

import { useState, useTransition } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents, distributeCents } from "@/lib/finance/money";
import { createCard, createCardPurchase, payCardInvoice } from "@/actions/cards";

export interface CardInvoiceSummary {
  id: string;
  referenceMonth: string;
  dueDate: string;
  status: string;
  totalCents: number;
  paidAmountCents: number;
}
export interface CardWithInvoices {
  id: string;
  name: string;
  limitCents: number;
  closingDay: number;
  dueDay: number;
  invoices: CardInvoiceSummary[];
}
interface CategoryOption {
  id: string;
  name: string;
}
interface AccountOption {
  id: string;
  name: string;
}

export function CardsView({
  cards,
  categories,
  accounts,
}: {
  cards: CardWithInvoices[];
  categories: CategoryOption[];
  accounts: AccountOption[];
}) {
  const [newCardOpen, setNewCardOpen] = useState(false);
  const [purchaseCard, setPurchaseCard] = useState<CardWithInvoices | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<{ card: CardWithInvoices; invoice: CardInvoiceSummary } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Cartões de crédito</h2>
        <Dialog open={newCardOpen} onOpenChange={setNewCardOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Novo cartão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cartão</DialogTitle>
            </DialogHeader>
            <NewCardForm onDone={() => setNewCardOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-foreground-muted">
          Nenhum cartão cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => {
            const openInvoice = card.invoices.find((i) => i.status === "open" || i.status === "partially_paid");
            return (
              <div key={card.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <CreditCard className="size-4" aria-hidden="true" />
                  Limite {formatCentsBRL(card.limitCents)}
                </div>
                <p className="mt-2 font-medium text-foreground">{card.name}</p>
                <p className="text-xs text-foreground-muted">
                  Fecha dia {card.closingDay}, vence dia {card.dueDay}
                </p>

                {openInvoice ? (
                  <div className="mt-3 rounded-[var(--radius-md)] bg-background px-3.5 py-2.5">
                    <p className="text-xs text-foreground-muted">Fatura atual</p>
                    <p className="font-display text-lg tabular-figures text-foreground">
                      {formatCentsBRL(openInvoice.totalCents - openInvoice.paidAmountCents)}
                    </p>
                    <p className="text-xs text-foreground-muted">Vence em {formatDatePtBR(openInvoice.dueDate)}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => setPayingInvoice({ card, invoice: openInvoice })}
                    >
                      Pagar fatura
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-foreground-muted">Nenhuma fatura em aberto ainda.</p>
                )}

                <Button size="sm" variant="ghost" className="mt-3" onClick={() => setPurchaseCard(card)}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova compra
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(purchaseCard)} onOpenChange={(open) => !open && setPurchaseCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova compra {purchaseCard ? `no ${purchaseCard.name}` : ""}</DialogTitle>
          </DialogHeader>
          {purchaseCard && (
            <NewPurchaseForm cardId={purchaseCard.id} categories={categories} onDone={() => setPurchaseCard(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payingInvoice)} onOpenChange={(open) => !open && setPayingInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar fatura</DialogTitle>
          </DialogHeader>
          {payingInvoice && (
            <PayInvoiceForm
              invoiceId={payingInvoice.invoice.id}
              suggestedAmountCents={payingInvoice.invoice.totalCents - payingInvoice.invoice.paidAmountCents}
              accounts={accounts}
              onDone={() => setPayingInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewCardForm({ onDone }: { onDone: () => void }) {
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
          startTransition(async () => {
            const result = await createCard({
              name: String(form.get("name")),
              limitCents: form.get("limit") ? parseBRLToCents(String(form.get("limit"))) : 0,
              closingDay: Number(form.get("closingDay")),
              dueDay: Number(form.get("dueDay")),
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Limite inválido.");
        }
      }}
    >
      <Field label="Nome do cartão" htmlFor="name">
        <Input id="name" name="name" required placeholder="Ex: Nubank" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Limite" htmlFor="limit" optional>
          <Input id="limit" name="limit" inputMode="decimal" placeholder="R$ 0,00" />
        </Field>
        <Field label="Fechamento" htmlFor="closingDay">
          <Input id="closingDay" name="closingDay" type="number" min={1} max={31} defaultValue={10} required />
        </Field>
        <Field label="Vencimento" htmlFor="dueDay">
          <Input id="dueDay" name="dueDay" type="number" min={1} max={31} defaultValue={17} required />
        </Field>
      </div>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar cartão"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function NewPurchaseForm({
  cardId,
  categories,
  onDone,
}: {
  cardId: string;
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number[] | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        try {
          const totalAmountCents = parseBRLToCents(String(form.get("amount") ?? ""));
          startTransition(async () => {
            const result = await createCardPurchase({
              cardId,
              categoryId: (form.get("categoryId") as string) || null,
              description: String(form.get("description")),
              totalAmountCents,
              installmentsCount: Number(form.get("installments")) || 1,
              purchaseDate: String(form.get("date")),
            });
            if (result.success) onDone();
            else setError(result.error);
          });
        } catch {
          setError("Valor inválido.");
        }
      }}
      onChange={(e) => {
        const form = e.currentTarget;
        const amount = (form.elements.namedItem("amount") as HTMLInputElement)?.value;
        const installments = Number((form.elements.namedItem("installments") as HTMLInputElement)?.value) || 1;
        try {
          setPreview(amount ? distributeCents(parseBRLToCents(amount), installments) : null);
        } catch {
          setPreview(null);
        }
      }}
    >
      <Field label="Descrição" htmlFor="purchaseDescription">
        <Input id="purchaseDescription" name="description" required placeholder="Ex: Notebook" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor total" htmlFor="purchaseAmount">
          <Input id="purchaseAmount" name="amount" inputMode="decimal" placeholder="R$ 0,00" required />
        </Field>
        <Field label="Parcelas" htmlFor="installments">
          <Input id="installments" name="installments" type="number" min={1} max={48} defaultValue={1} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria" htmlFor="purchaseCategoryId" optional>
          <select id="purchaseCategoryId" name="categoryId" className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data da compra" htmlFor="purchaseDate">
          <Input id="purchaseDate" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </Field>
      </div>
      {preview && preview.length > 1 && (
        <p className="text-xs text-foreground-muted">
          {preview.length}x de {formatCentsBRL(preview[0])}
          {preview.some((v) => v !== preview[0]) ? " (última parcela ajustada em centavos)" : ""}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Registrar compra"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PayInvoiceForm({
  invoiceId,
  suggestedAmountCents,
  accounts,
  onDone,
}: {
  invoiceId: string;
  suggestedAmountCents: number;
  accounts: AccountOption[];
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
            const result = await payCardInvoice({
              invoiceId,
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
      <Field label="Conta de pagamento" htmlFor="payAccountId">
        <select id="payAccountId" name="accountId" required className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor" htmlFor="payAmount">
          <Input
            id="payAmount"
            name="amount"
            inputMode="decimal"
            defaultValue={(suggestedAmountCents / 100).toFixed(2).replace(".", ",")}
            required
          />
        </Field>
        <Field label="Data" htmlFor="payDate">
          <Input id="payDate" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
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
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
