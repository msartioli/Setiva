"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-[var(--radius-pill)] border border-border-strong bg-background transition-colors duration-[var(--motion-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-4 translate-x-0.5 rounded-full bg-surface shadow transition-transform duration-[var(--motion-fast)]",
          "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-brand-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
