import { allInstitutions, byIspb as byIspbLogosBancosBr, logoCdnUrl, type Institution } from "logos-bancos-br";
import { fetchBanksList } from "../brasil-api/client";
import { mapBrasilApiBank } from "../brasil-api/mappers";
import { digitsOnly } from "./normalize";
import type { FinancialInstitution } from "./types";

function mapLogosBancosBr(inst: Institution): FinancialInstitution {
  return {
    id: inst.ispb,
    ispb: inst.ispb,
    compe: inst.compe,
    name: inst.name.trim(),
    shortName: inst.shortName.trim(),
    // inst.logo.svg/png sao caminhos relativos DENTRO do pacote, nao URLs —
    // logoCdnUrl() e a API correta para resolver a URL publica (CDN).
    logoUrl: inst.logo ? (logoCdnUrl(inst, { format: "svg" }) ?? logoCdnUrl(inst, { format: "png" })) : null,
    pixParticipant: inst.pix != null,
    source: "logos-bancos-br",
  };
}

let cachedList: FinancialInstitution[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Lista completa e deduplicada de instituicoes financeiras brasileiras.
 * `logos-bancos-br` e a base (dado local, empacotado, nunca falha em tempo
 * de execucao — atualizado semanalmente pela propria biblioteca via BCB
 * STR/Pix + diretorio Open Finance). A BrasilAPI so complementa instituicoes
 * que por acaso nao estejam na base local; se a BrasilAPI estiver fora do
 * ar, a lista continua funcionando normalmente so com a base local.
 */
export async function getFinancialInstitutions(): Promise<FinancialInstitution[]> {
  const now = Date.now();
  if (cachedList && now - cachedAt < CACHE_TTL_MS) {
    return cachedList;
  }

  const byIspb = new Map<string, FinancialInstitution>();
  for (const inst of allInstitutions()) {
    const mapped = mapLogosBancosBr(inst);
    byIspb.set(mapped.ispb, mapped);
  }

  const brasilApiResult = await fetchBanksList();
  if (brasilApiResult.ok) {
    for (const bank of brasilApiResult.data) {
      const mapped = mapBrasilApiBank(bank);
      if (!byIspb.has(mapped.ispb)) {
        byIspb.set(mapped.ispb, mapped);
      }
    }
  } else {
    console.error(`[financial-data][financial-institutions] brasilapi indisponivel, usando so logos-bancos-br: ${brasilApiResult.error}`);
  }

  const merged = Array.from(byIspb.values()).filter((inst) => inst.ispb.length === 8 && inst.name.length > 0);
  cachedList = merged;
  cachedAt = now;
  return merged;
}

/**
 * Resolve uma instituicao pelo ISPB, sempre no servidor: nunca confiar em
 * nome/logo que o cliente diga que corresponde a um ISPB (o cliente so
 * deveria mandar o ISPB escolhido; o resto e resolvido aqui, de novo,
 * contra a fonte de dados, evitando que um cliente adulterado grave nome
 * ou URL de logo arbitrarios no banco).
 */
export async function getFinancialInstitutionByIspb(rawIspb: string): Promise<FinancialInstitution | null> {
  const digits = digitsOnly(rawIspb);
  // Rejeita vazio/maior que 8 digitos antes de completar com zeros a
  // esquerda — sem isso, uma entrada sem nenhum digito viraria "00000000"
  // (ISPB real do Banco do Brasil) em vez de ser recusada.
  if (digits.length === 0 || digits.length > 8) return null;
  const ispb = digits.padStart(8, "0");

  const local = byIspbLogosBancosBr(ispb);
  if (local) return mapLogosBancosBr(local);

  const list = await getFinancialInstitutions();
  return list.find((inst) => inst.ispb === ispb) ?? null;
}
