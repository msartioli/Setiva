import { safeFetchJson, type SafeFetchResult } from "../safe-fetch";
import type { BrasilApiBank, BrasilApiCurrency, BrasilApiExchangeRate, BrasilApiTaxa } from "./types";

const BASE_URL = process.env.BRASIL_API_BASE_URL ?? "https://brasilapi.com.br/api";

/** Lista completa de bancos com código COMPE (main list do STR). Cache de 24h. */
export function fetchBanksList(): Promise<SafeFetchResult<BrasilApiBank[]>> {
  return safeFetchJson<BrasilApiBank[]>(`${BASE_URL}/banks/v1`, {
    provider: "brasilapi",
    revalidateSeconds: 60 * 60 * 24,
  });
}

/** Consulta um banco por código COMPE. Cache de 24h. */
export function fetchBankByCode(code: string | number): Promise<SafeFetchResult<BrasilApiBank>> {
  return safeFetchJson<BrasilApiBank>(`${BASE_URL}/banks/v1/${encodeURIComponent(String(code))}`, {
    provider: "brasilapi",
    revalidateSeconds: 60 * 60 * 24,
  });
}

/** Lista de moedas suportadas pelo endpoint de cambio. Cache de 24h. */
export function fetchCurrencies(): Promise<SafeFetchResult<BrasilApiCurrency[]>> {
  return safeFetchJson<BrasilApiCurrency[]>(`${BASE_URL}/cambio/v1/moedas`, {
    provider: "brasilapi",
    revalidateSeconds: 60 * 60 * 24,
  });
}

/** Cotacao de uma moeda numa data (formato ISO YYYY-MM-DD). Cache por data+moeda. */
export function fetchExchangeRate(currency: string, isoDate: string): Promise<SafeFetchResult<BrasilApiExchangeRate>> {
  return safeFetchJson<BrasilApiExchangeRate>(
    `${BASE_URL}/cambio/v1/cotacao/${encodeURIComponent(currency)}/${encodeURIComponent(isoDate)}`,
    { provider: "brasilapi", revalidateSeconds: 60 * 60 * 12 }
  );
}

/** Selic, CDI e IPCA num unico endpoint. Cache de algumas horas. */
export function fetchTaxas(): Promise<SafeFetchResult<BrasilApiTaxa[]>> {
  return safeFetchJson<BrasilApiTaxa[]>(`${BASE_URL}/taxas/v1`, {
    provider: "brasilapi",
    revalidateSeconds: 60 * 60 * 6,
  });
}
