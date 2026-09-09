"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function FaqItem({ icon, question, answer }: { icon: ReactNode; question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border py-5 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-brand">
          {icon}
        </span>
        <span className="flex-1 font-medium text-foreground">{question}</span>
        <ChevronDown
          className={`size-5 shrink-0 text-foreground-muted transition-transform duration-[var(--motion-base)] ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        className="grid overflow-hidden transition-all duration-[var(--motion-base)] ease-[var(--motion-ease)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden pl-[3.25rem]">
          <p className="pt-3 text-sm leading-relaxed text-foreground-muted">{answer}</p>
        </div>
      </div>
    </div>
  );
}
