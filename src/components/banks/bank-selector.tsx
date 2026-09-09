"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BankLogo } from "./bank-logo";
import { getPopularInstitutions, searchInstitutions } from "@/lib/integrations/financial-institutions/search";
import type { FinancialInstitution } from "@/lib/integrations/financial-institutions/types";

const MAX_RESULTS = 40;

export function BankSelector({
  institutions,
  value,
  onSelect,
  placeholder = "Pesquisar banco, apelido, COMPE ou ISPB...",
}: {
  institutions: FinancialInstitution[];
  value: FinancialInstitution | null;
  onSelect: (institution: FinancialInstitution | null) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(!value);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const popular = useMemo(() => getPopularInstitutions(institutions), [institutions]);
  const results = useMemo(() => {
    if (!query.trim()) return null; // null = mostrar secao "populares"
    return searchInstitutions(institutions, query).slice(0, MAX_RESULTS);
  }, [institutions, query]);

  const visibleList = results ?? popular;
  const open = editing;

  function selectInstitution(inst: FinancialInstitution) {
    onSelect(inst);
    setQuery("");
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, visibleList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = visibleList[highlighted];
      if (picked) selectInstitution(picked);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  if (!editing && value) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3">
        <BankLogo name={value.shortName || value.name} logoUrl={value.logoUrl} className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{value.shortName || value.name}</p>
          {value.compe && <p className="text-xs text-foreground-muted">COMPE {value.compe} · ISPB {value.ispb}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setQuery("");
            setHighlighted(0);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="shrink-0 text-sm font-medium text-brand hover:underline"
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={visibleList[highlighted] ? `${listboxId}-${visibleList[highlighted].ispb}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
          }}
          onFocus={() => setEditing(true)}
          onKeyDown={handleKeyDown}
          className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface py-2 pl-10 pr-9 text-sm text-foreground shadow-sm outline-none placeholder:text-foreground-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/30"
        />
        {value && (
          <button
            type="button"
            aria-label="Cancelar troca de banco"
            onClick={() => {
              setEditing(false);
              setQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-lg">
          <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {!query.trim() && (
              <li className="px-2.5 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Populares
              </li>
            )}
            {visibleList.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-foreground-muted">
                Nenhum banco encontrado para &quot;{query}&quot;.
              </li>
            )}
            {visibleList.map((inst, i) => (
              <li key={inst.ispb} id={`${listboxId}-${inst.ispb}`} role="option" aria-selected={i === highlighted}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectInstitution(inst)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-left transition-colors duration-[var(--motion-fast)]",
                    i === highlighted ? "bg-background" : "hover:bg-background"
                  )}
                >
                  <BankLogo name={inst.shortName || inst.name} logoUrl={inst.logoUrl} className="size-8 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{inst.shortName || inst.name}</span>
                    {inst.compe && <span className="block text-xs text-foreground-muted">COMPE {inst.compe}</span>}
                  </span>
                  {value?.ispb === inst.ispb && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                </button>
              </li>
            ))}
            {results && results.length === MAX_RESULTS && (
              <li className="px-2.5 py-1.5 text-center text-xs text-foreground-muted">
                Mostrando os primeiros {MAX_RESULTS}. Refine a busca para ver outros.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
