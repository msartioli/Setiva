"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SectionTabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções" className="mb-6 inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-surface p-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[var(--radius-pill)] px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--motion-fast)]",
              active ? "bg-brand text-brand-foreground" : "text-foreground-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
