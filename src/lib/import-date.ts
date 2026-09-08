/**
 * Aceita "dd/mm/aaaa", "dd-mm-aaaa" (padrao pt-BR) e "aaaa-mm-dd" (ISO).
 * Retorna null (nunca lanca) quando nao reconhece, para o chamador tratar
 * a linha como "nao interpretada" em vez de quebrar a importacao inteira.
 */
export function parseImportDate(raw: string): string | null {
  const trimmed = raw.trim();

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return isValidDate(Number(iso[1]), Number(iso[2]), Number(iso[3])) ? trimmed : null;
  }

  const brDate = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brDate) {
    const day = Number(brDate[1]);
    const month = Number(brDate[2]);
    const year = Number(brDate[3]);
    if (!isValidDate(year, month, day)) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}
