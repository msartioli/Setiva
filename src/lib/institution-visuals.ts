import { normalize } from "./category-visuals";

/**
 * Fallback visual generico para uma instituicao sem logo (ou cujo logo
 * falhou ao carregar): sigla + cor deterministica, do mesmo conjunto usado
 * pelas categorias (cat-*). Logos reais vem de
 * `src/lib/integrations/financial-institutions` (dataset oficial via
 * logos-bancos-br/BrasilAPI); este arquivo so cobre o caso sem logo.
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
  return { abbrev: abbreviate(name), className: PALETTE[hashIndex(key, PALETTE.length)] };
}
