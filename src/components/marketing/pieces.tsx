import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Peças de composição da landing: pílula de seção, selo de ícone, lista de
 * recursos com divisórias e cartão verde que emoldura uma tela do produto.
 * Todas seguem o mesmo vocabulário visual para a página não parecer um
 * amontoado de estilos diferentes.
 */

export function Eyebrow({
  children,
  tone = "cool",
  withMark = false,
  className,
}: {
  children: ReactNode;
  tone?: "cool" | "gold" | "onDark";
  withMark?: boolean;
  className?: string;
}) {
  const tones = {
    cool: "bg-context-cool-soft text-info",
    gold: "bg-accent/25 text-foreground",
    onDark: "bg-white/15 text-white",
  } as const;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {withMark && <Image src="/brand/symbol.png" alt="" width={22} height={22} />}
      <span
        className={cn(
          "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.08em]",
          tones[tone]
        )}
      >
        {children}
      </span>
    </span>
  );
}

export function IconBadge({
  children,
  tone = "solid",
  size = "md",
}: {
  children: ReactNode;
  tone?: "solid" | "soft" | "gold";
  size?: "md" | "lg";
}) {
  const tones = {
    solid: "bg-forest text-accent",
    soft: "bg-brand/12 text-brand",
    gold: "bg-accent text-accent-foreground",
  } as const;
  const sizes = { md: "size-11", lg: "size-14" } as const;

  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-2xl", tones[tone], sizes[size])}>
      {children}
    </span>
  );
}

export function FeatureList({
  items,
  onDark = false,
}: {
  items: { icon: ReactNode; title: string; body: string }[];
  onDark?: boolean;
}) {
  return (
    <ul className="flex flex-col">
      {items.map((item, i) => (
        <li
          key={item.title}
          className={cn(
            "flex gap-5 py-7",
            i > 0 && (onDark ? "border-t border-white/15" : "border-t border-border")
          )}
        >
          <IconBadge tone={onDark ? "gold" : "solid"}>{item.icon}</IconBadge>
          <div className="min-w-0">
            <h3
              className={cn(
                "font-display text-lg font-bold",
                onDark ? "text-white" : "text-foreground"
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "mt-1.5 text-[15px] leading-relaxed",
                onDark ? "text-white/75" : "text-foreground-muted"
              )}
            >
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ScreenCard({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  align?: "center" | "bottom";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-forest px-6 pt-10 sm:px-10",
        align === "bottom" ? "pb-0" : "pb-10",
        className
      )}
    >
      {/* arco decorativo, o mesmo gesto do símbolo da marca */}
      <svg
        className="pointer-events-none absolute -left-16 -top-10 h-[130%] w-auto opacity-25"
        viewBox="0 0 200 300"
        fill="none"
        aria-hidden="true"
      >
        <path d="M180 10C60 40 20 120 40 200s90 90 140 80" stroke="#f2b705" strokeWidth="2" />
        <path d="M200 60C90 80 55 145 72 210s80 78 128 70" stroke="#f2b705" strokeWidth="2" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  onDark = false,
  withMark = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  onDark?: boolean;
  withMark?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", align === "center" ? "items-center text-center" : "items-start")}>
      <Eyebrow tone={onDark ? "onDark" : "cool"} withMark={withMark}>
        {eyebrow}
      </Eyebrow>
      <h2
        className={cn(
          "mt-6 max-w-3xl font-display text-[2rem] font-extrabold leading-[1.15] tracking-tight text-balance sm:text-[2.75rem]",
          onDark ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 max-w-xl text-[17px] leading-relaxed",
            onDark ? "text-white/75" : "text-foreground-muted"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
