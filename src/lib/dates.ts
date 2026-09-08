const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Data de hoje no fuso de exibicao padrao, como "YYYY-MM-DD". Evita que um
 * servidor rodando em UTC vire o dia antes do usuario no Brasil.
 */
export function todayISO(timeZone: string = DEFAULT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function endOfMonthISO(fromISODate: string): string {
  const [year, month] = fromISODate.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export function addMonthsISO(fromISODate: string, months: number): string {
  const [year, month, day] = fromISODate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
}
