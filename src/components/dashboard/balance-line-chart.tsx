"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatCentsBRL } from "@/lib/finance/money";

export function BalanceLineChart({ data }: { data: { date: string; balanceCents: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(`${d.date}T00:00:00`).getDate(),
  }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Linha do saldo projetado ao longo do mês">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-foreground-muted)" }}
          />
          <YAxis hide domain={["dataMin - 5000", "dataMax + 5000"]} />
          <ReferenceLine y={0} stroke="var(--color-negative)" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value) => formatCentsBRL(Number(value ?? 0))}
            labelFormatter={(label) => `Dia ${label}`}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="balanceCents"
            stroke="var(--color-brand)"
            strokeWidth={2}
            fill="url(#balanceFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
