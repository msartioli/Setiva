import Link from "next/link";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { formatCentsBRL } from "@/lib/finance/money";
import { categoryVisual } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

export interface BudgetAlertRow {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  limitCents: number;
  spentCents: number;
}

/**
 * Faixas do limite. O aviso util e o de 80%: depois de estourar, avisar ja
 * nao evita o gasto, so explica o que aconteceu.
 */
function zoneOf(ratio: number): "safe" | "near" | "over" {
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "near";
  return "safe";
}

export function BudgetAlerts({ rows }: { rows: BudgetAlertRow[] }) {
  const withRatio = rows
    .map((r) => ({ ...r, ratio: r.limitCents > 0 ? r.spentCents / r.limitCents : 0 }))
    .sort((a, b) => b.ratio - a.ratio);

  const attention = withRatio.filter((r) => zoneOf(r.ratio) !== "safe");

  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-foreground">Limites do mês</p>
          <p className="text-sm text-foreground-muted">
            {attention.length === 0
              ? "Todas as categorias com limite estão dentro do combinado."
              : `${attention.length} categoria(s) pedindo atenção antes de você gastar mais.`}
          </p>
        </div>
        <Link href="/planejar/orcamentos" className="shrink-0 text-sm font-semibold text-brand hover:underline">
          Ajustar
        </Link>
      </div>

      {attention.length === 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-positive-soft px-3.5 py-2.5 text-sm text-positive">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          Nada estourado por enquanto. Dá para seguir o mês sem susto.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {withRatio.map((row) => {
          const zone = zoneOf(row.ratio);
          const visual = categoryVisual(row.categoryIcon, row.categoryName);
          const Icon = visual.icon;
          const remainingCents = row.limitCents - row.spentCents;

          return (
            <li key={row.categoryId}>
              <div className="flex items-center gap-3">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", visual.className)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {row.categoryName}
                </span>
                <span className="shrink-0 text-xs tabular-figures text-foreground-muted">
                  {formatCentsBRL(row.spentCents)} de {formatCentsBRL(row.limitCents)}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                <div
                  className={cn(
                    "h-full rounded-full",
                    zone === "over" && "bg-negative",
                    zone === "near" && "bg-warning",
                    zone === "safe" && "bg-brand"
                  )}
                  style={{ width: `${Math.min(row.ratio * 100, 100)}%` }}
                />
              </div>

              {zone === "over" && (
                <p className="mt-2 flex items-start gap-2 text-xs font-medium text-negative">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  Passou {formatCentsBRL(Math.abs(remainingCents))} do limite. Segure novos gastos em{" "}
                  {row.categoryName.toLowerCase()} até o mês virar.
                </p>
              )}
              {zone === "near" && (
                <p className="mt-2 flex items-start gap-2 text-xs font-medium text-warning">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  Sobram {formatCentsBRL(remainingCents)}. No ritmo atual, esse limite fecha o mês estourado.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
