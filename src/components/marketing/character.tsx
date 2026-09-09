import { createAvatar } from "@dicebear/core";
import { openPeeps } from "@dicebear/collection";

/**
 * Personagens das telas publicas.
 *
 * Estilo Open Peeps (Pablo Stanley) via DiceBear, CC0 1.0: uso comercial
 * livre, sem exigencia de credito (licenca conferida em
 * dicebear.com/styles/open-peeps, ver docs/ASSETS.md). Gerado localmente
 * pelo pacote, nunca por chamada a uma API externa em tempo de execucao.
 *
 * Substituiu as ilustracoes que eu mesmo tinha desenhado: personagem pronto
 * e desenhado por ilustrador fica melhor que vetor improvisado.
 */

/** Roupas na paleta da marca, para o personagem nao brigar com o resto. */
const CLOTHING = ["0f9d58", "0a4d34", "f2b705", "2f6c86"];
const SKIN = ["ffdbb4", "edb98a", "d08b5b", "ae5d29", "694d3d"];

export type CharacterSeed = string;

export function Character({
  seed,
  className,
  size = 340,
}: {
  seed: CharacterSeed;
  className?: string;
  size?: number;
}) {
  const uri = createAvatar(openPeeps, {
    seed,
    size,
    backgroundColor: ["transparent"],
    clothingColor: CLOTHING,
    skinColor: SKIN,
  }).toDataUri();

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={uri} alt="" aria-hidden="true" className={className} width={size} height={size} />;
}
