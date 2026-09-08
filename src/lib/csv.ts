/**
 * Parser de CSV minimo (RFC 4180: aspas duplas, escape por aspas dobradas,
 * virgula ou ponto-e-virgula como separador, quebras de linha dentro de
 * campo entre aspas). Sem dependencia externa porque o formato e pequeno
 * e bem definido.
 */
export function parseCSV(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimiter = detectDelimiter(normalized);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function detectDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

/**
 * Neutraliza formulas perigosas em CSV exportado: um campo comecando com
 * =, +, -, @, tab ou CR pode ser interpretado como formula pelo Excel/
 * Sheets ao reabrir o arquivo. Prefixamos com apostrofo (convencao que a
 * maioria das planilhas trata como texto puro) e ainda escapamos aspas.
 */
export function csvField(value: string): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) {
    v = `'${v}`;
  }
  if (/[",\n;]/.test(v)) {
    v = `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map(csvField).join(",")).join("\r\n");
}
