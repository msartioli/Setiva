import { describe, expect, it } from "vitest";
import { distributeCents, formatCentsBRL, parseBRLToCents } from "./money";

describe("distributeCents", () => {
  it("distribui R$ 100,00 em 3 parcelas somando exatamente o total", () => {
    const parts = distributeCents(10000, 3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("divisao exata nao gera resto", () => {
    expect(distributeCents(9000, 3)).toEqual([3000, 3000, 3000]);
  });

  it("uma parcela recebe o total inteiro", () => {
    expect(distributeCents(12345, 1)).toEqual([12345]);
  });

  it("rejeita total nao positivo", () => {
    expect(() => distributeCents(0, 3)).toThrow();
    expect(() => distributeCents(-100, 3)).toThrow();
  });
});

describe("parseBRLToCents / formatCentsBRL", () => {
  it("interpreta formato brasileiro com separador de milhar", () => {
    expect(parseBRLToCents("1.234,56")).toBe(123456);
  });

  it("interpreta apenas virgula decimal", () => {
    expect(parseBRLToCents("1234,5")).toBe(123450);
  });

  it("interpreta numero negativo", () => {
    expect(parseBRLToCents("-50,00")).toBe(-5000);
  });

  it("formata centavos em BRL", () => {
    expect(formatCentsBRL(123456)).toContain("1.234,56");
  });
});
