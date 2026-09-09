/**
 * Busca e ordenacao sobre a lista ja carregada de instituicoes. Modulo puro
 * (sem fetch, sem `logos-bancos-br`) de proposito: e importado tanto no
 * servidor quanto em componentes cliente (o seletor de banco filtra
 * localmente enquanto o usuario digita, sem round-trip ao servidor a cada
 * tecla). Nao importar `service.ts` daqui nem de componente cliente.
 */
import { INSTITUTION_SEARCH_ALIASES, POPULAR_INSTITUTION_ISPBS } from "./aliases";
import { digitsOnly, normalizeSearchText } from "./normalize";
import type { FinancialInstitution } from "./types";

/** Bancos populares, na ordem curada de `POPULAR_INSTITUTION_ISPBS`. */
export function getPopularInstitutions(list: FinancialInstitution[]): FinancialInstitution[] {
  const byIspb = new Map(list.map((inst) => [inst.ispb, inst]));
  return POPULAR_INSTITUTION_ISPBS.map((ispb) => byIspb.get(ispb)).filter((inst): inst is FinancialInstitution => inst != null);
}

/**
 * Busca por nome, apelido curado, COMPE ou ISPB. Prioridade de match:
 * ISPB/COMPE (quando a busca e majoritariamente numerica) > apelido curado
 * > nome/nome-curto normalizado.
 */
export function searchInstitutions(list: FinancialInstitution[], query: string): FinancialInstitution[] {
  const trimmed = query.trim();
  if (!trimmed) return list;

  const digits = digitsOnly(trimmed);
  const normalizedQuery = normalizeSearchText(trimmed);

  if (digits.length >= 3) {
    const compeQuery = digits.replace(/^0+/, "") || "0";
    const byCode = list.filter(
      (inst) => inst.ispb.includes(digits) || (inst.compe != null && digitsOnly(inst.compe).includes(compeQuery))
    );
    if (byCode.length > 0) return byCode;
  }

  return list.filter((inst) => {
    const aliases = INSTITUTION_SEARCH_ALIASES[inst.ispb] ?? [];
    if (aliases.some((alias) => normalizeSearchText(alias).includes(normalizedQuery))) return true;
    return (
      normalizeSearchText(inst.name).includes(normalizedQuery) || normalizeSearchText(inst.shortName).includes(normalizedQuery)
    );
  });
}
