/**
 * Calculos do mapa do mes e da margem estimada. Ver docs/FINANCIAL-MODEL.md
 * para a definicao de cada termo. Tudo aqui e puro (sem I/O), para ser
 * testavel sem banco e reutilizavel entre Server Components e o simulador
 * "E se eu mudar isso?" no cliente.
 */

export interface PendingItem {
  dueDate: string; // "YYYY-MM-DD"
  amountCents: number;
  kind: "income" | "expense";
  certain: boolean; // false = renda/gasto estimado, nao confirmado
}

export interface MarginInput {
  realizedBalanceCents: number;
  pendingItems: PendingItem[];
  periodEnd: string; // "YYYY-MM-DD"
  protectedReserveCents: number;
  includeEstimated: boolean;
}

export interface MarginResult {
  confirmedCents: number;
  expectedCents: number;
  pendingIncomeCertainCents: number;
  pendingExpenseCertainCents: number;
  pendingIncomeEstimatedCents: number;
}

export function calculateMargin(input: MarginInput): MarginResult {
  const relevant = input.pendingItems.filter((item) => item.dueDate <= input.periodEnd);

  const pendingIncomeCertainCents = sum(
    relevant.filter((i) => i.kind === "income" && i.certain).map((i) => i.amountCents)
  );
  const pendingExpenseCertainCents = sum(
    relevant.filter((i) => i.kind === "expense" && i.certain).map((i) => i.amountCents)
  );
  const pendingIncomeEstimatedCents = sum(
    relevant.filter((i) => i.kind === "income" && !i.certain).map((i) => i.amountCents)
  );

  const confirmedCents =
    input.realizedBalanceCents +
    pendingIncomeCertainCents -
    pendingExpenseCertainCents -
    input.protectedReserveCents;

  const expectedCents = input.includeEstimated
    ? confirmedCents + pendingIncomeEstimatedCents
    : confirmedCents;

  return {
    confirmedCents,
    expectedCents,
    pendingIncomeCertainCents,
    pendingExpenseCertainCents,
    pendingIncomeEstimatedCents,
  };
}

export interface DailyBalancePoint {
  date: string;
  balanceCents: number;
}

/**
 * Linha diaria de saldo projetado entre hoje e o fim do periodo, somando
 * apenas itens certos (confirmados). Usada para achar o primeiro dia
 * negativo, que tem prioridade sobre "o mes fecha positivo".
 */
export function buildDailyBalanceLine(
  realizedBalanceCents: number,
  items: PendingItem[],
  rangeStart: string,
  rangeEnd: string
): DailyBalancePoint[] {
  const certainItems = items.filter((i) => i.certain && i.dueDate >= rangeStart && i.dueDate <= rangeEnd);
  const dates = enumerateDates(rangeStart, rangeEnd);

  let running = realizedBalanceCents;
  const byDate = new Map<string, number>();
  for (const item of certainItems) {
    const delta = item.kind === "income" ? item.amountCents : -item.amountCents;
    byDate.set(item.dueDate, (byDate.get(item.dueDate) ?? 0) + delta);
  }

  return dates.map((date) => {
    running += byDate.get(date) ?? 0;
    return { date, balanceCents: running };
  });
}

export function findFirstNegativeDay(line: DailyBalancePoint[]): DailyBalancePoint | null {
  return line.find((point) => point.balanceCents < 0) ?? null;
}

function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  while (current <= endDate) {
    dates.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + 86_400_000);
  }
  return dates;
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
