"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCentsBRL } from "@/lib/finance/money";

export interface MonthBalancePointView {
  date: string;
  balanceCents: number;
  projected: boolean;
}

/**
 * Saldo do mes inteiro: linha cheia no que ja aconteceu, tracejada na
 * projecao. Os dois trechos compartilham o ponto de hoje, senao a linha
 * aparece cortada entre eles.
 */
export function BalanceLineChart({ data }: { data: MonthBalancePointView[] }) {
  const lastRealizedIndex = data.reduce((acc, p, i) => (p.projected ? acc : i), -1);

  const formatted = data.map((point, i) => ({
    label: Number(point.date.slice(8, 10)),
    balanceCents: point.balanceCents,
    realizedCents: point.projected ? null : point.balanceCents,
    // o ponto de hoje entra nas duas series para as linhas se encostarem
    projectedCents: point.projected || i === lastRealizedIndex ? point.balanceCents : null,
  }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Saldo do mês, dia a dia, com a projeção até o fim do mês">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            stroke="none"
            fill="url(#balanceFill)"
            isAnimationActive={false}
            name="Saldo"
          />
          <Line
            type="monotone"
            dataKey="realizedCents"
            stroke="var(--color-brand)"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
            name="Já aconteceu"
          />
          <Line
            type="monotone"
            dataKey="projectedCents"
            stroke="var(--color-brand)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
            name="Previsto"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
