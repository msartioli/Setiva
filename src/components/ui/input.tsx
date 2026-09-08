import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2 text-base text-foreground shadow-sm transition-colors duration-[var(--motion-fast)] outline-none placeholder:text-foreground-muted",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/30",
        "aria-invalid:border-negative aria-invalid:ring-2 aria-invalid:ring-negative/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Input };
