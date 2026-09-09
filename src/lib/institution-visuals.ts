import { normalize } from "./category-visuals";

/**
 * Visual de cada instituicao no seletor de bancos do onboarding: sigla curta
 * e uma cor do mesmo conjunto usado pelas categorias (cat-*). Nao usa logos
 * reais de banco (marca registrada de terceiros, sem licenca verificada) —
 * so uma sigla sobre um circulo colorido, como um avatar generico.
 */
export interface InstitutionVisual {
  abbrev: string;
  className: string;
}

const PALETTE = [
  "bg-cat-purple-soft text-cat-purple",
  "bg-cat-amber-soft text-cat-amber",
  "bg-cat-blue-soft text-cat-blue",
  "bg-cat-teal-soft text-cat-teal",
  "bg-cat-pink-soft text-cat-pink",
  "bg-cat-clay-soft text-cat-clay",
  "bg-cat-emerald-soft text-cat-emerald",
  "bg-cat-slate-soft text-cat-slate",
];

const BY_NAME: Record<string, InstitutionVisual> = {
  carteira: { abbrev: "CT", className: PALETTE[1] },
  nubank: { abbrev: "NU", className: PALETTE[0] },
  "banco do brasil": { abbrev: "BB", className: PALETTE[2] },
  "caixa economica federal": { abbrev: "CX", className: PALETTE[3] },
  bradesco: { abbrev: "BRA", className: PALETTE[4] },
  itau: { abbrev: "ITA", className: PALETTE[1] },
  santander: { abbrev: "SAN", className: PALETTE[4] },
  inter: { abbrev: "IN", className: PALETTE[6] },
  "c6 bank": { abbrev: "C6", className: PALETTE[7] },
  picpay: { abbrev: "PP", className: PALETTE[3] },
  "mercado pago": { abbrev: "MP", className: PALETTE[2] },
  "outra instituicao": { abbrev: "+", className: PALETTE[7] },
};

function abbreviate(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function hashIndex(value: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % length;
  }
  return hash;
}

export function institutionVisual(name: string): InstitutionVisual {
  const key = normalize(name);
  if (BY_NAME[key]) return BY_NAME[key];
  return { abbrev: abbreviate(name), className: PALETTE[hashIndex(key, PALETTE.length)] };
}
