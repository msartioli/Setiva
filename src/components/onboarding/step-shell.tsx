"use client";

import { motion, useReducedMotion, AnimatePresence, type Variants } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OnboardingScene } from "./onboarding-scene";

/**
 * Moldura de cada passo do onboarding: cena animada com a mascote a
 * esquerda (faixa verde, ondas, formas flutuantes) e o formulario a
 * direita, com entrada em cascata a cada troca de passo.
 *
 * A API de props e a mesma de antes de proposito (step/title/subtitle/
 * onBack/onSkip/skipLabel/children/footer): a repaginacao e toda visual,
 * nenhum dos 12 passos precisou mudar de logica.
 */

const TOTAL_STEPS = 12;

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

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.05 } },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    // grid-rows explicito: sem ele, o min-h-svh distribui a altura extra
    // entre as linhas automaticas e empurra o formulario para baixo da
    // dobra no mobile/tablet (o banner fica com uma folga fantasma).
    <div className="grid min-h-svh grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,26rem)_1fr] lg:grid-rows-[1fr]">
      {/* Cena: faixa lateral no desktop, topo compacto no mobile */}
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-svh">
          <OnboardingScene step={step} />
        </div>
      </aside>
      <div className="relative h-36 lg:hidden">
        <OnboardingScene step={step} variant="banner" />
      </div>

      {/* Formulario */}
      <main className="flex flex-col bg-background px-6 py-10 sm:px-10 lg:px-14 lg:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <div className="mb-8 hidden items-center gap-1.5 lg:flex" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{
                  backgroundColor: i < step ? "var(--brand)" : "var(--border)",
                  scaleY: i === step - 1 ? 1.6 : 1,
                }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="h-1 flex-1 origin-center rounded-full"
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={container}
              initial="hidden"
              animate="show"
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, transition: { duration: 0.2 } }}
              className="flex flex-1 flex-col"
            >
              <motion.h1
                variants={item}
                className="font-display text-3xl leading-tight text-foreground text-balance sm:text-4xl"
              >
                {title}
              </motion.h1>
              <motion.p variants={item} className="mt-3 text-base text-foreground-muted">
                {subtitle}
              </motion.p>

              <motion.div variants={item} className="mt-9 flex-1">
                {children}
              </motion.div>

              <motion.div
                variants={item}
                className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
              >
                <div>
                  {onBack && (
                    <Button type="button" variant="ghost" onClick={onBack}>
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      Voltar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {onSkip && (
                    <Button type="button" variant="ghost" onClick={onSkip}>
                      {skipLabel}
                    </Button>
                  )}
                  {footer}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
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
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-medium transition-colors duration-[var(--motion-fast)]",
        selected
          ? "border-brand bg-brand text-brand-foreground shadow-sm"
          : "border-border bg-surface text-foreground hover:border-border-strong"
      )}
    >
      {children}
    </motion.button>
  );
}
