"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { institutionVisual } from "@/lib/institution-visuals";

/**
 * Logo de uma instituicao com fallback em cascata: imagem real (se houver
 * URL e ela carregar) -> sigla+cor deterministica -> icone generico de
 * banco. Nunca deixa um <img> quebrado visivel.
 */
export function BankLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <span className={cn("flex items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  if (!name) {
    return (
      <span className={cn("flex items-center justify-center rounded-full bg-cat-slate-soft text-cat-slate", className)}>
        <Landmark className="size-4" aria-hidden="true" />
      </span>
    );
  }

  const visual = institutionVisual(name);
  return (
    <span className={cn("flex items-center justify-center rounded-full text-xs font-semibold", visual.className, className)}>
      {visual.abbrev}
    </span>
  );
}
