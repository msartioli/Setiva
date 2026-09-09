import { fetchCurrencies, fetchExchangeRate as fetchBrasilApiExchangeRate, fetchTaxas } from "../brasil-api/client";
import { fetchLatestSgsValue, fetchUsdPtax, SGS_SERIES_SELIC } from "../bcb/client";
import type { Currency, ExchangeRate, SelicRate } from "./types";

let lastCurrencies: Currency[] | null = null;
let lastSelic: SelicRate | null = null;
const lastExchangeRateByKey = new Map<string, ExchangeRate>();

/** Lista de moedas com cotacao disponivel na BrasilAPI. Nao hardcoded. */
export async function getCurrencies(): Promise<Currency[]> {
  const result = await fetchCurrencies();
  if (result.ok) {
    lastCurrencies = result.data.map((c) => ({ code: c.simbolo, name: c.nome }));
    return lastCurrencies;
  }
  console.error(`[financial-data][market-data] moedas indisponiveis: ${result.error}`);
  return lastCurrencies ?? [];
}

function isoToMonthDayYear(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}-${day}-${year}`;
}

/**
 * Cotacao de uma moeda numa data. Ordem de fallback: BrasilAPI -> PTAX do
 * Banco Central (so cobre USD) -> ultimo valor valido em cache -> null.
 */
export async function getExchangeRate(currency: string, isoDate: string): Promise<ExchangeRate | null> {
  const cacheKey = `${currency}:${isoDate}`;
  const brasilApiResult = await fetchBrasilApiExchangeRate(currency, isoDate);

  if (brasilApiResult.ok && brasilApiResult.data.cotacoes.length > 0) {
    const closing =
      brasilApiResult.data.cotacoes.find((q) => q.tipo_boletim.toLowerCase().includes("fechamento")) ??
      brasilApiResult.data.cotacoes[brasilApiResult.data.cotacoes.length - 1];
    const rate: ExchangeRate = {
      currency,
      date: isoDate,
      buy: closing.cotacao_compra,
      sell: closing.cotacao_venda,
      source: "brasilapi",
    };
    lastExchangeRateByKey.set(cacheKey, rate);
    return rate;
  }
  console.error(`[financial-data][market-data] cambio brasilapi indisponivel para ${currency}: ${!brasilApiResult.ok ? brasilApiResult.error : "sem cotacoes"}`);

  if (currency.toUpperCase() === "USD") {
    const ptaxResult = await fetchUsdPtax(isoToMonthDayYear(isoDate));
    if (ptaxResult.ok && ptaxResult.data.value.length > 0) {
      const point = ptaxResult.data.value[0];
      const rate: ExchangeRate = { currency, date: isoDate, buy: point.cotacaoCompra, sell: point.cotacaoVenda, source: "bcb" };
      lastExchangeRateByKey.set(cacheKey, rate);
      return rate;
    }
    console.error(`[financial-data][market-data] ptax bcb indisponivel para USD: ${!ptaxResult.ok ? ptaxResult.error : "sem cotacao"}`);
  }

  const cached = lastExchangeRateByKey.get(cacheKey);
  if (cached) return { ...cached, source: "cache" };
  return null;
}

/**
 * Selic anualizada (serie SGS 1178) mais recente. Ordem de fallback:
 * BrasilAPI /taxas/v1 (mesma chamada ja traz CDI e IPCA, ver getTaxas) ->
 * BCB SGS diretamente -> ultimo valor valido em cache -> null.
 */
export async function getCurrentSelicRate(): Promise<SelicRate | null> {
  const taxasResult = await fetchTaxas();
  if (taxasResult.ok) {
    const selic = taxasResult.data.find((t) => t.nome.toLowerCase() === "selic");
    if (selic) {
      lastSelic = { value: selic.valor, date: new Date().toISOString().slice(0, 10), source: "brasilapi" };
      return lastSelic;
    }
  } else {
    console.error(`[financial-data][market-data] taxas brasilapi indisponivel: ${taxasResult.error}`);
  }

  const sgsResult = await fetchLatestSgsValue(SGS_SERIES_SELIC);
  if (sgsResult.ok && sgsResult.data.length > 0) {
    const point = sgsResult.data[0];
    const [day, month, year] = point.data.split("/");
    lastSelic = { value: Number(point.valor), date: `${year}-${month}-${day}`, source: "bcb" };
    return lastSelic;
  }
  console.error(`[financial-data][market-data] selic sgs indisponivel: ${!sgsResult.ok ? sgsResult.error : "sem dados"}`);

  if (lastSelic) return { ...lastSelic, source: "cache" };
  return null;
}
