/**
 * Formatos crus do Banco Central (SGS e Olinda/PTAX), confirmados por
 * chamada real em 2026-09-09.
 */
export interface BcbSgsPoint {
  data: string; // DD/MM/YYYY
  valor: string; // numero como texto, ex: "13.90"
}

export interface BcbPtaxOdataResponse {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
  }>;
}
