import { describe, expect, it } from "vitest";
import { generateSuggestions } from "./suggestions";

describe("generateSuggestions", () => {
  it("sugere revisar orçamento estourado", () => {
    const result = generateSuggestions({
      categorySpends: [],
      overBudgets: [{ categoryName: "Mercado", spentCents: 60000, limitCents: 50000 }],
      marginConfirmedCents: 0,
      activeGoals: [],
    });
    expect(result.some((s) => s.title.includes("Mercado"))).toBe(true);
  });

  it("nao sugere aumento de categoria abaixo do limiar", () => {
    const result = generateSuggestions({
      categorySpends: [{ categoryName: "Lazer", currentCents: 10500, previousCents: 10000 }],
      overBudgets: [],
      marginConfirmedCents: 0,
      activeGoals: [],
    });
    expect(result).toHaveLength(0);
  });

  it("sugere aumento de categoria acima do limiar", () => {
    const result = generateSuggestions({
      categorySpends: [{ categoryName: "Lazer", currentCents: 20000, previousCents: 10000 }],
      overBudgets: [],
      marginConfirmedCents: 0,
      activeGoals: [],
    });
    expect(result.some((s) => s.title.includes("Lazer"))).toBe(true);
  });

  it("sugere reserva para meta quando ha margem positiva", () => {
    const result = generateSuggestions({
      categorySpends: [],
      overBudgets: [],
      marginConfirmedCents: 100000,
      activeGoals: [{ id: "1", name: "Viagem", targetCents: 500000, reservedCents: 0 }],
    });
    const goalSuggestion = result.find((s) => s.id === "goal-1");
    expect(goalSuggestion).toBeDefined();
  });

  it("nao sugere reserva quando margem e zero ou negativa", () => {
    const result = generateSuggestions({
      categorySpends: [],
      overBudgets: [],
      marginConfirmedCents: 0,
      activeGoals: [{ id: "1", name: "Viagem", targetCents: 500000, reservedCents: 0 }],
    });
    expect(result.some((s) => s.id === "goal-1")).toBe(false);
  });
});
