"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCentsBRL } from "@/lib/finance/money";

export interface DonutSlice {
  name: string;
  spentCents: number;
}

const SLICE_COLORS = [
  "var(--color-brand)",
  "var(--color-accent)",
  "var(--color-info)",
  "var(--color-context-warm)",
  "var(--color-positive)",
  "var(--color-warning)",
  "var(--color-border-strong)",
];

export function CategoryDonut({ slices, totalCents }: { slices: DonutSlice[]; totalCents: number }) {
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div
        className="relative h-52 w-52 shrink-0"
        role="img"
        aria-label={`Distribuição das despesas do mês por categoria, total de ${formatCentsBRL(totalCents)}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="spentCents"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((slice, i) => (
                <Cell key={slice.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCentsBRL(Number(value ?? 0))}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-foreground-muted">Gasto no mês</span>
          <span className="font-display text-lg font-bold tabular-figures text-foreground">
            {formatCentsBRL(totalCents)}
          </span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-2">
        {slices.map((slice, i) => (
          <li key={slice.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-foreground">{slice.name}</span>
            <span className="shrink-0 tabular-figures text-foreground-muted">
              {formatCentsBRL(slice.spentCents)}
            </span>
            <span className="w-10 shrink-0 text-right text-xs tabular-figures text-foreground-muted">
              {totalCents > 0 ? Math.round((slice.spentCents / totalCents) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
