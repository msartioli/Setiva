import type { Metadata } from "next";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ImportWizard } from "@/components/import/import-wizard";
import { ImportBatchesList, type ImportBatchRow } from "@/components/import/import-batches-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Importar e exportar" };

export default async function ImportarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: accounts }, { data: batches }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("user_id", user.id).is("archived_at", null).order("name"),
    supabase
      .from("import_batches")
      .select("id, source_filename, row_count, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const batchRows: ImportBatchRow[] = (batches ?? []).map((b) => ({
    id: b.id,
    sourceFilename: b.source_filename,
    rowCount: b.row_count,
    status: b.status,
    createdAt: b.created_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand">Seus dados</p>
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">Importar e exportar</h1>
        </div>
        <Button asChild variant="secondary">
          <a href="/api/exportar-movimentacoes">
            <Download className="size-4" aria-hidden="true" />
            Exportar movimentações (CSV)
          </a>
        </Button>
      </div>

      {(accounts ?? []).length === 0 ? (
        <p className="rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-foreground-muted">
          Cadastre uma conta em Visão geral antes de importar um extrato.
        </p>
      ) : (
        <ImportWizard accounts={accounts ?? []} />
      )}

      <ImportBatchesList batches={batchRows} />
    </div>
  );
}
