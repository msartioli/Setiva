/**
 * Dinheiro e sempre inteiro (centavos). Nada aqui usa float para valor
 * monetario. Ver docs/FINANCIAL-MODEL.md.
 */

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCentsBRL(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

/**
 * Converte um texto digitado em formato brasileiro ("1.234,56" ou "1234,56"
 * ou "1234.56") para centavos inteiros. Lanca erro em entrada invalida em
 * vez de silenciosamente arredondar algo que o usuario nao quis dizer.
 */
export function parseBRLToCents(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Valor vazio");
  }

  const normalized = trimmed.replace(/[^\d,.-]/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  let integerPart: string;
  let decimalPart: string;

  if (hasComma && hasDot) {
    // "1.234,56": ponto e separador de milhar, virgula e decimal.
    const [int, dec] = normalized.split(",");
    integerPart = int.replace(/\./g, "");
    decimalPart = dec ?? "0";
  } else if (hasComma) {
    const [int, dec] = normalized.split(",");
    integerPart = int;
    decimalPart = dec ?? "0";
  } else if (hasDot) {
    const [int, dec] = normalized.split(".");
    integerPart = int;
    decimalPart = dec ?? "0";
  } else {
    integerPart = normalized;
    decimalPart = "0";
  }

  decimalPart = (decimalPart + "00").slice(0, 2);

  const isNegative = integerPart.startsWith("-");
  if (isNegative) integerPart = integerPart.slice(1);

  const sign = isNegative ? -1 : 1;
  const cents = Number(integerPart || "0") * 100 + Number(decimalPart || "0");

  if (!Number.isFinite(cents)) {
    throw new Error(`Valor invalido: ${input}`);
  }

  return sign * Math.round(cents);
}

/**
 * Distribui um total em centavos entre N partes inteiras sem perder nem um
 * centavo: divisao inteira + resto nas primeiras partes. Espelha a logica
 * de public.create_card_purchase (migration 04) para preview no cliente
 * antes de enviar ao servidor.
 */
export function distributeCents(totalCents: number, parts: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error("totalCents deve ser um inteiro positivo");
  }
  if (!Number.isInteger(parts) || parts < 1) {
    throw new Error("parts deve ser um inteiro maior ou igual a 1");
  }

  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;

  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}
