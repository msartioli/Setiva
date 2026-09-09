"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CtaButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "solid-green" | "ghost-dark" | "ghost-light";
  size?: "md" | "lg";
  className?: string;
}) {
  const styles = {
    primary: "bg-accent text-accent-foreground hover:bg-accent-strong",
    "solid-green": "bg-brand text-brand-foreground hover:bg-brand-strong",
    "ghost-dark": "border-2 border-white/30 text-white hover:border-white/60",
    "ghost-light": "border-2 border-border-strong text-foreground hover:border-brand",
  } as const;
  const sizes = {
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-4 text-[15px]",
  } as const;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      <Link
        href={href}
        className={cn(
          "group inline-flex items-center gap-2.5 rounded-2xl font-bold shadow-sm transition-colors duration-[var(--motion-base)]",
          styles[variant],
          sizes[size],
          className
        )}
      >
        {children}
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
