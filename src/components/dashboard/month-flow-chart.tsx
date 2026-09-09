"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCentsBRL } from "@/lib/finance/money";

export function MonthFlowChart({
  incomeCents,
  expenseCents,
}: {
  incomeCents: number;
  expenseCents: number;
}) {
  // "Sobrou" so faz sentido quando ja entrou alguma receita no mes. Com
  // receita zerada (salario ainda nao efetivado, por exemplo) a barra daria
  // "sobrou R$ 0", o que le como prejuizo em vez de "ainda nao entrou".
  const data = [
    { name: "Entrou", value: incomeCents, color: "var(--color-positive)" },
    { name: "Saiu", value: expenseCents, color: "var(--color-negative)" },
    ...(incomeCents > 0
      ? [{ name: "Sobrou", value: Math.max(incomeCents - expenseCents, 0), color: "var(--color-brand)" }]
      : []),
  ];

  return (
    <div
      className="h-44 w-full"
      role="img"
      aria-label={`No mês: entrou ${formatCentsBRL(incomeCents)}, saiu ${formatCentsBRL(expenseCents)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-foreground-muted)" }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--color-background)" }}
            formatter={(value) => formatCentsBRL(Number(value ?? 0))}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
