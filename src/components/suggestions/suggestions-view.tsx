"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import type { Suggestion } from "@/lib/finance/suggestions";
import { TivaTip } from "@/components/mascot/tiva";

export function SuggestionsView({
  suggestions,
  marginConfirmedCents,
  mascotEnabled,
}: {
  suggestions: Suggestion[];
  marginConfirmedCents: number;
  mascotEnabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center gap-3">
          {mascotEnabled && suggestions.length > 0 && <TivaTip className="h-14 w-14 shrink-0" />}
          <h2 className="font-display text-xl text-foreground">Sugestões para este mês</h2>
        </div>
        {suggestions.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-foreground-muted">
            Nada para destacar agora. Isso é bom sinal.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {suggestions.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{s.title}</p>
                    <p className="mt-1 text-sm text-foreground-muted">{s.explanation}</p>
                    <Link href={s.actionHref} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                      {s.actionLabel} →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Simulator marginConfirmedCents={marginConfirmedCents} />
    </div>
  );
}

function Simulator({ marginConfirmedCents }: { marginConfirmedCents: number }) {
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");

  let deltaCents = 0;
  try {
    deltaCents = amount.trim() ? parseBRLToCents(amount) : 0;
  } catch {
    deltaCents = 0;
  }

  const signedDelta = kind === "expense" ? -Math.abs(deltaCents) : Math.abs(deltaCents);
  const simulatedMargin = marginConfirmedCents + signedDelta;

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
      <h2 className="font-display text-xl text-foreground">E se eu mudar isso?</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Simule uma despesa a mais, uma economia ou uma renda extra. Nada é salvo até você decidir agir de
        verdade.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <Button type="button" variant={kind === "expense" ? "primary" : "secondary"} size="sm" onClick={() => setKind("expense")}>
            Gasto a mais
          </Button>
          <Button type="button" variant={kind === "income" ? "primary" : "secondary"} size="sm" onClick={() => setKind("income")}>
            Economia / renda extra
          </Button>
        </div>
        <Field label="Valor" htmlFor="simAmount">
          <Input id="simAmount" inputMode="decimal" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 rounded-[var(--radius-md)] bg-background p-4 text-sm">
        <div>
          <p className="text-foreground-muted">Margem confirmada hoje</p>
          <p className="font-display text-lg tabular-figures text-foreground">{formatCentsBRL(marginConfirmedCents)}</p>
        </div>
        <div>
          <p className="text-foreground-muted">Margem simulada</p>
          <p className={`font-display text-lg tabular-figures ${simulatedMargin < 0 ? "text-negative" : "text-foreground"}`}>
            {formatCentsBRL(simulatedMargin)}
          </p>
        </div>
      </div>
      {simulatedMargin < 0 && (
        <p className="mt-2 text-xs text-negative">Essa mudança deixaria sua margem confirmada negativa.</p>
      )}
      <p className="mt-3 text-xs text-foreground-muted">Ajuste os valores acima para ver o resultado na hora.</p>
    </section>
  );
}
