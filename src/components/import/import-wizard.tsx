"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import { parseCSV } from "@/lib/csv";
import { parseImportDate } from "@/lib/import-date";
import { checkDuplicates, confirmImport } from "@/actions/import";

interface AccountOption {
  id: string;
  name: string;
}

interface ParsedRow {
  competenceDate: string;
  description: string;
  amountCents: number;
  include: boolean;
  duplicate: boolean;
}

type Step = "upload" | "map" | "preview" | "done";

export function ImportWizard({ accounts }: { accounts: AccountOption[] }) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [dateCol, setDateCol] = useState(0);
  const [descCol, setDescCol] = useState(1);
  const [amountCol, setAmountCol] = useState(2);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [unrecognizedCount, setUnrecognizedCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; batchId: string } | null>(null);

  const dataRows = useMemo(() => (hasHeader ? rawRows.slice(1) : rawRows), [rawRows, hasHeader]);
  const headerLabels = hasHeader && rawRows[0] ? rawRows[0] : [];

  function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError("Não encontramos linhas nesse arquivo.");
        return;
      }
      setRawRows(rows);
      setStep("map");
    };
    reader.readAsText(file, "utf-8");
  }

  function buildPreview() {
    const unrecognized: string[] = [];
    const rows: ParsedRow[] = [];

    for (const row of dataRows) {
      const rawDate = row[dateCol] ?? "";
      const rawDesc = row[descCol] ?? "";
      const rawAmount = row[amountCol] ?? "";

      const date = parseImportDate(rawDate);
      let amountCents: number | null = null;
      try {
        amountCents = parseBRLToCents(rawAmount);
      } catch {
        amountCents = null;
      }

      if (!date || amountCents === null || amountCents === 0 || !rawDesc.trim()) {
        unrecognized.push(row.join(", "));
        continue;
      }

      rows.push({ competenceDate: date, description: rawDesc.trim(), amountCents, include: true, duplicate: false });
    }

    setUnrecognizedCount(unrecognized.length);

    if (rows.length === 0) {
      setError("Nenhuma linha pôde ser interpretada com esse mapeamento de colunas. Confira as colunas escolhidas.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const duplicates = await checkDuplicates({
        accountId,
        candidates: rows.map((r) => ({ competenceDate: r.competenceDate, amountCents: r.amountCents })),
      });
      setParsedRows(rows.map((r, i) => ({ ...r, duplicate: duplicates[i] ?? false })));
      setStep("preview");
    });
  }

  function toggleRow(index: number) {
    setParsedRows((prev) => prev.map((r, i) => (i === index ? { ...r, include: !r.include } : r)));
  }

  function submitImport() {
    setError(null);
    startTransition(async () => {
      const res = await confirmImport({
        accountId,
        sourceFilename: fileName,
        rows: parsedRows.map((r) => ({
          competenceDate: r.competenceDate,
          description: r.description,
          amountCents: r.amountCents,
          include: r.include,
        })),
      });
      if (res.success) {
        setResult({ imported: res.imported, batchId: res.batchId });
        setStep("done");
      } else {
        setError(res.error);
      }
    });
  }

  const includedCount = parsedRows.filter((r) => r.include).length;
  const duplicateCount = parsedRows.filter((r) => r.duplicate).length;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] bg-negative-soft px-3.5 py-2.5 text-sm text-negative">
          {error}
        </p>
      )}

      {step === "upload" && (
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center">
          <Upload className="size-8 text-foreground-muted" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">Envie um arquivo CSV</p>
            <p className="text-sm text-foreground-muted">Extrato do seu banco ou planilha com data, descrição e valor.</p>
          </div>
          <label className="cursor-pointer rounded-[var(--radius-pill)] bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-strong">
            Escolher arquivo
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {step === "map" && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-6">
          <p className="text-sm text-foreground-muted">
            Arquivo <strong>{fileName}</strong>, {rawRows.length} linha(s) encontradas.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
            A primeira linha é um cabeçalho
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ColumnSelect label="Coluna da data" value={dateCol} onChange={setDateCol} columns={rawRows[0] ?? []} headerLabels={headerLabels} />
            <ColumnSelect label="Coluna da descrição" value={descCol} onChange={setDescCol} columns={rawRows[0] ?? []} headerLabels={headerLabels} />
            <ColumnSelect label="Coluna do valor" value={amountCol} onChange={setAmountCol} columns={rawRows[0] ?? []} headerLabels={headerLabels} />
          </div>

          <Field label="Conta de destino" htmlFor="importAccountId">
            <select
              id="importAccountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <p className="text-xs text-foreground-muted">
            Valores negativos viram despesa, positivos viram receita. Ajuste os valores no arquivo se seu banco usa
            só números positivos.
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("upload")}>
              Voltar
            </Button>
            <Button disabled={isPending || !accountId} onClick={buildPreview}>
              {isPending ? "Processando..." : "Ver prévia"}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm">
            <span>
              <strong>{includedCount}</strong> de {parsedRows.length} linhas selecionadas
            </span>
            {duplicateCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="size-4" aria-hidden="true" />
                {duplicateCount} possível(is) duplicata(s) — revise antes de confirmar
              </span>
            )}
            {unrecognizedCount > 0 && (
              <span className="text-foreground-muted">{unrecognizedCount} linha(s) não reconhecida(s) e ignorada(s)</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto rounded-[var(--radius-xl)] border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
                  <th className="px-3 py-2" />
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={row.include} onChange={() => toggleRow(i)} className="size-4 accent-[var(--color-brand)]" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-figures">{row.competenceDate.split("-").reverse().join("/")}</td>
                    <td className="px-3 py-2 text-foreground">{row.description}</td>
                    <td className={`whitespace-nowrap px-3 py-2 text-right tabular-figures ${row.amountCents < 0 ? "text-negative" : "text-positive"}`}>
                      {formatCentsBRL(Math.abs(row.amountCents))}
                    </td>
                    <td className="px-3 py-2">
                      {row.duplicate && <span className="text-xs text-warning">possível duplicata</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("map")}>
              Voltar
            </Button>
            <Button disabled={isPending || includedCount === 0} onClick={submitImport}>
              {isPending ? "Importando..." : `Importar ${includedCount} lançamento(s)`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center">
          <p className="font-display text-xl text-foreground">Importação concluída</p>
          <p className="mt-2 text-sm text-foreground-muted">
            {result.imported} lançamento(s) adicionado(s). Se algo estiver errado, você pode reverter este lote
            abaixo, em Lotes importados.
          </p>
          <Button className="mt-4" onClick={() => { setStep("upload"); setResult(null); setRawRows([]); setParsedRows([]); }}>
            Importar outro arquivo
          </Button>
        </div>
      )}
    </div>
  );
}

function ColumnSelect({
  label,
  value,
  onChange,
  columns,
  headerLabels,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  columns: string[];
  headerLabels: string[];
}) {
  return (
    <Field label={label} htmlFor={`col-${label}`}>
      <select
        id={`col-${label}`}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
      >
        {columns.map((_, i) => (
          <option key={i} value={i}>
            {headerLabels[i] ? headerLabels[i] : `Coluna ${i + 1}`}
          </option>
        ))}
      </select>
    </Field>
  );
}
