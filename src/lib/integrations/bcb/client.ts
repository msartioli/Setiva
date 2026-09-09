import { safeFetchJson, type SafeFetchResult } from "../safe-fetch";
import type { BcbPtaxOdataResponse, BcbSgsPoint } from "./types";

const SGS_BASE_URL = process.env.BCB_API_BASE_URL ?? "https://api.bcb.gov.br/dados/serie";
const PTAX_BASE_URL = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

/** Serie SGS 1178: Selic anualizada, base 252. */
export const SGS_SERIES_SELIC = 1178;

/** Ultimo ponto de uma serie temporal do SGS (ex: Selic). Cache de horas. */
export function fetchLatestSgsValue(seriesCode: number): Promise<SafeFetchResult<BcbSgsPoint[]>> {
  return safeFetchJson<BcbSgsPoint[]>(
    `${SGS_BASE_URL}/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`,
    { provider: "bcb", revalidateSeconds: 60 * 60 * 6 }
  );
}

/**
 * PTAX de fechamento do dolar via Olinda, fallback quando a BrasilAPI de
 * cambio falha. So cobre USD (endpoint dedicado do BCB); outras moedas nao
 * tem um endpoint Olinda tao direto, entao o fallback delas fica limitado
 * ao cache (ver docs/integrations/financial-data.md).
 */
export function fetchUsdPtax(monthDayYear: string): Promise<SafeFetchResult<BcbPtaxOdataResponse>> {
  return safeFetchJson<BcbPtaxOdataResponse>(
    `${PTAX_BASE_URL}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${monthDayYear}'&$format=json`,
    { provider: "bcb", revalidateSeconds: 60 * 60 * 12 }
  );
}
