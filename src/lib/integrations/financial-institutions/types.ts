/**
 * Modelo normalizado unico de instituicao financeira. O resto do app (UI,
 * validacao, Supabase) so conhece este tipo — nunca os formatos crus da
 * BrasilAPI ou do pacote logos-bancos-br.
 */
export interface FinancialInstitution {
  /** = ispb. Identidade estavel da instituicao, nunca o logo. */
  id: string;
  ispb: string;
  compe: string | null;
  name: string;
  shortName: string;
  logoUrl: string | null;
  pixParticipant: boolean;
  source: "brasilapi" | "logos-bancos-br" | "merged";
}
