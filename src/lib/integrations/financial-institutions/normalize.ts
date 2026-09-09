/** Minusculo, sem acento, sem espacos duplicados, sem espaco nas pontas. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** So digitos. Usado antes de comparar ISPB/COMPE, que podem chegar com pontuacao. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
