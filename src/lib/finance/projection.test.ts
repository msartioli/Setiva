import { describe, expect, it } from "vitest";
import { buildDailyBalanceLine, calculateMargin, findFirstNegativeDay, type PendingItem } from "./projection";

describe("calculateMargin", () => {
  it("renda incerta nao aparece no cenario confirmado sem escolha explicita", () => {
    const items: PendingItem[] = [
      { dueDate: "2026-09-20", amountCents: 500000, kind: "income", certain: true },
      { dueDate: "2026-09-25", amountCents: 200000, kind: "income", certain: false },
      { dueDate: "2026-09-10", amountCents: 150000, kind: "expense", certain: true },
    ];

    const result = calculateMargin({
      realizedBalanceCents: 100000,
      pendingItems: items,
      periodEnd: "2026-09-30",
      protectedReserveCents: 0,
      includeEstimated: false,
    });

    // 100000 + 500000 - 150000 = 450000, sem a renda incerta de 200000
    expect(result.confirmedCents).toBe(450000);
    expect(result.expectedCents).toBe(450000);
  });

  it("cenario esperado inclui a renda estimada quando selecionado", () => {
    const items: PendingItem[] = [
      { dueDate: "2026-09-25", amountCents: 200000, kind: "income", certain: false },
    ];

    const result = calculateMargin({
      realizedBalanceCents: 0,
      pendingItems: items,
      periodEnd: "2026-09-30",
      protectedReserveCents: 0,
      includeEstimated: true,
    });

    expect(result.expectedCents).toBe(200000);
  });

  it("reserva protegida e descontada do saldo confirmado", () => {
    const result = calculateMargin({
      realizedBalanceCents: 100000,
      pendingItems: [],
      periodEnd: "2026-09-30",
      protectedReserveCents: 30000,
      includeEstimated: false,
    });
    expect(result.confirmedCents).toBe(70000);
  });

  it("ignora itens com vencimento depois do fim do periodo", () => {
    const items: PendingItem[] = [
      { dueDate: "2026-10-05", amountCents: 999999, kind: "expense", certain: true },
    ];
    const result = calculateMargin({
      realizedBalanceCents: 100000,
      pendingItems: items,
      periodEnd: "2026-09-30",
      protectedReserveCents: 0,
      includeEstimated: false,
    });
    expect(result.confirmedCents).toBe(100000);
  });
});

describe("buildDailyBalanceLine / findFirstNegativeDay", () => {
  it("detecta dia negativo no meio do periodo mesmo com saldo final positivo", () => {
    // Saldo inicial 100; dia 5 sai 300 (fica -200); dia 10 entra 1000 (fica positivo de novo).
    const items: PendingItem[] = [
      { dueDate: "2026-09-05", amountCents: 30000, kind: "expense", certain: true },
      { dueDate: "2026-09-10", amountCents: 100000, kind: "income", certain: true },
    ];

    const line = buildDailyBalanceLine(10000, items, "2026-09-01", "2026-09-15");
    const lastPoint = line[line.length - 1];
    expect(lastPoint.balanceCents).toBeGreaterThan(0);

    const negativeDay = findFirstNegativeDay(line);
    expect(negativeDay).not.toBeNull();
    expect(negativeDay?.date).toBe("2026-09-05");
    expect(negativeDay?.balanceCents).toBe(-20000);
  });

  it("nao acusa dia negativo quando o saldo nunca fica abaixo de zero", () => {
    const items: PendingItem[] = [
      { dueDate: "2026-09-05", amountCents: 5000, kind: "expense", certain: true },
    ];
    const line = buildDailyBalanceLine(100000, items, "2026-09-01", "2026-09-10");
    expect(findFirstNegativeDay(line)).toBeNull();
  });

  it("ignora itens incertos na linha diaria", () => {
    const items: PendingItem[] = [
      { dueDate: "2026-09-05", amountCents: 999999, kind: "expense", certain: false },
    ];
    const line = buildDailyBalanceLine(10000, items, "2026-09-01", "2026-09-10");
    expect(findFirstNegativeDay(line)).toBeNull();
  });
});
