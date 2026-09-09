"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-strong bg-surface transition-colors duration-[var(--motion-fast)]",
        "hover:border-brand",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-brand-foreground">
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
