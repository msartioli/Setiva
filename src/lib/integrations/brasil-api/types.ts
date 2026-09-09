/**
 * Formatos crus da BrasilAPI (brasilapi.com.br/docs), confirmados por
 * chamada real em 2026-09-09. Nunca importar estes tipos fora de
 * `brasil-api/` e `financial-institutions/service.ts` — o resto do app
 * consome o modelo normalizado (`FinancialInstitution`).
 */
export interface BrasilApiBank {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string | null;
  logo_url?: string | null;
}

export interface BrasilApiCurrency {
  simbolo: string;
  nome: string;
  tipo_moeda: string;
}

export interface BrasilApiExchangeQuote {
  paridade_compra: number;
  paridade_venda: number;
  cotacao_compra: number;
  cotacao_venda: number;
  data_hora_cotacao: string;
  tipo_boletim: string;
}

export interface BrasilApiExchangeRate {
  cotacoes: BrasilApiExchangeQuote[];
  moeda: string;
  data: string;
}

export interface BrasilApiTaxa {
  nome: string;
  valor: number;
}
