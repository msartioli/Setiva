"use client";

import Image from "next/image";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Moldura de cada passo do onboarding.
 *
 * Direcao visual escolhida pelo dono: card central minimalista, no padrao
 * de onboarding de SaaS tipo Linear/Vercel — fundo neutro uniforme, um
 * unico card branco estreito centrado, muito respiro, indicador de passo
 * discreto. Sem ilustracao, sem mascote, sem faixa colorida: a atencao fica
 * na pergunta.
 *
 * A API de props e a mesma desde a primeira versao (step/title/subtitle/
 * onBack/onSkip/skipLabel/children/footer), entao trocar a linguagem visual
 * nao exigiu mexer na logica de nenhum dos 12 passos.
 */

const TOTAL_STEPS = 12;
const CARD_WIDTH = "max-w-[520px]";

export function StepShell({
  step,
  title,
  subtitle,
  onBack,
  onSkip,
  skipLabel = "Pular por agora",
  children,
  footer,
}: {
  step: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-10 sm:py-16">
      <div className={cn("w-full", CARD_WIDTH)}>
        <div className="mb-8 flex flex-col items-center gap-6">
          <Image src="/brand/symbol.png" alt="Setiva" width={32} height={32} className="size-8" priority />
          <StepDots step={step} reduce={Boolean(reduce)} />
        </div>

        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-7 shadow-sm sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="font-display text-2xl leading-snug text-foreground text-balance">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{subtitle}</p>

              <div className="mt-7">{children}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            {onBack && (
              <Button type="button" variant="ghost" size="sm" onClick={onBack}>
                Voltar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSkip && (
              <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
                {skipLabel}
              </Button>
            )}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Pontos discretos; o passo atual vira uma pilula alongada. */
function StepDots({ step, reduce }: { step: number; reduce: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Passo ${step} de ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const isCurrent = i === step - 1;
        const isDone = i < step - 1;
        return (
          <motion.span
            key={i}
            initial={false}
            animate={{ width: isCurrent ? 20 : 6, opacity: isDone || isCurrent ? 1 : 0.45 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn("h-1.5 rounded-full", isDone || isCurrent ? "bg-brand" : "bg-border-strong")}
          />
        );
      })}
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-[var(--radius-md)] border px-3.5 py-2 text-sm transition-colors duration-[var(--motion-fast)]",
        selected
          ? "border-brand bg-brand/8 font-medium text-foreground"
          : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
