"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCentsBRL } from "@/lib/finance/money";

export interface MonthlyTotal {
  month: string; // "YYYY-MM"
  label: string;
  incomeCents: number;
  expenseCents: number;
}
export interface CategoryTotal {
  categoryName: string;
  amountCents: number;
}

export function MonthlyBarChart({ data }: { data: MonthlyTotal[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-foreground-muted)" }} />
          <YAxis hide />
          <Tooltip
            formatter={(value) => formatCentsBRL(Number(value ?? 0))}
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="incomeCents" name="Receitas" fill="var(--color-positive)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="expenseCents" name="Despesas" fill="var(--color-negative)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBreakdown({ data }: { data: CategoryTotal[] }) {
  const total = data.reduce((a, c) => a + c.amountCents, 0);
  if (data.length === 0) {
    return <p className="text-sm text-foreground-muted">Sem despesas categorizadas neste período.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {data.map((c) => {
        const pct = total > 0 ? (c.amountCents / total) * 100 : 0;
        return (
          <li key={c.categoryName}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{c.categoryName}</span>
              <span className="tabular-figures text-foreground-muted">{formatCentsBRL(c.amountCents)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-context-warm" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
