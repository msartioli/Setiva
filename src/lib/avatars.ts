import { createAvatar } from "@dicebear/core";
import { notionists, shapes, thumbs } from "@dicebear/collection";

/**
 * Tres familias visuais do DiceBear, todas CC0 1.0 (sem exigencia de
 * atribuicao — conferido em dicebear.com/licenses em 2026-09-08, ver
 * docs/ASSETS.md). Seed nunca deriva de email/CPF/nome: e uma string curta
 * sorteada e guardada em profiles.avatar_seed.
 */
export const AVATAR_FAMILIES = {
  retratos: { label: "Retratos" },
  formas: { label: "Formas" },
  tracos: { label: "Traços" },
} as const;

export type AvatarFamilyKey = keyof typeof AVATAR_FAMILIES;

const CURATED_SEEDS = [
  "amora",
  "cedro",
  "girassol",
  "jade",
  "oliveira",
  "quartzo",
  "safira",
  "tucano",
];

export function getFamilySeeds(family: AvatarFamilyKey): string[] {
  return CURATED_SEEDS.map((seed) => `${family}-${seed}`);
}

export function generateRandomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function avatarDataUri(family: AvatarFamilyKey, seed: string): string {
  switch (family) {
    case "retratos":
      return createAvatar(notionists, { seed, size: 96 }).toDataUri();
    case "formas":
      return createAvatar(shapes, { seed, size: 96 }).toDataUri();
    case "tracos":
      return createAvatar(thumbs, { seed, size: 96 }).toDataUri();
  }
}

export const NICKNAME_SUGGESTIONS = [
  "Capivara do Café",
  "Gato de Domingo",
  "Raposa de Mochila",
  "Pinguim de Férias",
  "Coruja de Planilha",
  "Tatu de Cofrinho",
];
