"use client";

import { createContext, useContext } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { TivaWelcome, TivaTip, TivaCelebrate } from "@/components/mascot/tiva";

/**
 * A preferencia "mostrar a mascote" e escolhida no passo 10, mas a cena que
 * a desenha vive dentro do StepShell (usado pelos 12 passos). Um contexto
 * evita ter que passar a prop manualmente em cada um dos 12 pontos de uso.
 */
const MascotEnabledContext = createContext(true);
export const MascotEnabledProvider = MascotEnabledContext.Provider;

/**
 * Cena animada que acompanha o onboarding: faixa verde com ondas em
 * movimento, formas geometricas flutuando e a mascote guiando com uma fala
 * diferente a cada passo. Usa tokens `--forest-fixed` (nunca invertem no
 * tema escuro, mesma decisao das faixas de marketing).
 *
 * Tudo aqui respeita `prefers-reduced-motion`: com a preferencia ligada, as
 * formas param e as transicoes viram fade curto, sem movimento.
 */

const STEP_GUIDE: Record<number, { mascot: "welcome" | "tip" | "celebrate"; line: string }> = {
  1: { mascot: "welcome", line: "Oi! Eu sou a Tiva. Vou te acompanhar por aqui." },
  2: { mascot: "tip", line: "Saber o que te trouxe aqui ajuda a deixar o app com a sua cara." },
  3: { mascot: "tip", line: "A renda é o ponto de partida do mapa do mês." },
  4: { mascot: "tip", line: "Sem conexão com banco: você informa, você controla." },
  5: { mascot: "tip", line: "Cartão é o que mais surpreende no fim do mês. Vamos organizar." },
  6: { mascot: "tip", line: "Contas fixas entram uma vez e se repetem sozinhas." },
  7: { mascot: "tip", line: "Dívida registrada é dívida que dá para planejar." },
  8: { mascot: "tip", line: "Limite não é proibição: é um aviso antes do estouro." },
  9: { mascot: "tip", line: "Toda meta começa pequena. O importante é começar." },
  10: { mascot: "tip", line: "Deixe do seu jeito. Dá para mudar tudo isso depois." },
  11: { mascot: "celebrate", line: "Falta pouco! Confira se está tudo certo." },
  12: { mascot: "celebrate", line: "Pronto! Seu primeiro mês já está montado." },
};

const TOTAL_STEPS = 12;

function Mascot({ kind, className }: { kind: "welcome" | "tip" | "celebrate"; className?: string }) {
  if (kind === "celebrate") return <TivaCelebrate className={className} />;
  if (kind === "tip") return <TivaTip className={className} />;
  return <TivaWelcome className={className} />;
}

/**
 * Faixa compacta do mobile: a coluna vertical do desktop nao cabe em 176px
 * de altura (a mascote era cortada e a fala sumia), entao aqui ela vira uma
 * linha: mascote pequena a esquerda, fala a direita, progresso no topo.
 */
function SceneBanner({ step }: { step: number }) {
  const reduce = useReducedMotion();
  const mascotEnabled = useContext(MascotEnabledContext);
  const guide = STEP_GUIDE[step] ?? STEP_GUIDE[1];
  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-forest text-forest-foreground">
      <Waves reduce={Boolean(reduce)} />

      <div className="relative z-10 px-6 pt-5">
        <p className="text-xs font-medium text-forest-foreground/70">
          Passo {step} de {TOTAL_STEPS}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3 px-6 pb-5">
        {mascotEnabled && (
          <AnimatePresence mode="wait">
            <motion.div
              key={guide.mascot}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: reduce ? 0.15 : 0.35 }}
              className="shrink-0"
            >
              <Mascot kind={guide.mascot} className="h-16 w-16" />
            </motion.div>
          </AnimatePresence>
        )}
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: reduce ? 0.15 : 0.3 }}
            className="text-sm leading-snug text-forest-foreground/90"
          >
            {guide.line}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function OnboardingScene({ step, variant = "panel" }: { step: number; variant?: "panel" | "banner" }) {
  const reduce = useReducedMotion();
  const mascotEnabled = useContext(MascotEnabledContext);
  const guide = STEP_GUIDE[step] ?? STEP_GUIDE[1];
  const progress = Math.round((step / TOTAL_STEPS) * 100);

  if (variant === "banner") return <SceneBanner step={step} />;

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-forest text-forest-foreground">
      <FloatingShapes reduce={Boolean(reduce)} />

      <div className="relative z-10 p-8 lg:p-10">
        <p className="text-sm font-medium text-forest-foreground/70">
          Passo {step} de {TOTAL_STEPS}
        </p>
        <div className="mt-3 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-4">
        {/* Halo suave atras da mascote, para ela nao flutuar solta no verde */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-[60%] rounded-full bg-white/[0.07] blur-2xl"
          aria-hidden="true"
        />
        {mascotEnabled && (
          <AnimatePresence mode="wait">
            <motion.div
              key={guide.mascot}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -8 }}
              transition={reduce ? { duration: 0.15 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Mascot kind={guide.mascot} className="h-40 w-40 lg:h-48 lg:w-48" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduce ? { duration: 0.15 } : { duration: 0.35, delay: 0.1 }}
            className="mt-6 max-w-xs text-center font-display text-lg leading-snug text-forest-foreground lg:text-xl"
          >
            {guide.line}
          </motion.p>
        </AnimatePresence>
      </div>

      <Waves reduce={Boolean(reduce)} />
    </div>
  );
}

/**
 * Ondas sobrepostas na base, com deslocamento horizontal lento e continuo.
 * Curva suave (amplitude baixa, periodo longo) para ler como agua, nao como
 * silhueta de montanha; tons proprios em vez de branco translucido, que
 * acinzentava o verde da faixa.
 */
function Waves({ reduce }: { reduce: boolean }) {
  const wavePath =
    "M0,70 C240,40 480,100 720,70 C960,40 1200,100 1440,70 L1440,160 L0,160 Z";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32 lg:h-36" aria-hidden="true">
      {[
        { fill: "#0f6b46", opacity: 0.55, duration: 28, delay: 0, y: 0 },
        { fill: "#128554", opacity: 0.5, duration: 21, delay: -7, y: 14 },
        { fill: "#1aa066", opacity: 0.45, duration: 15, delay: -3, y: 28 },
      ].map((layer, i) => (
        <motion.div
          key={i}
          className="absolute inset-x-0 bottom-0"
          style={{ top: layer.y }}
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={
            reduce ? undefined : { duration: layer.duration, repeat: Infinity, ease: "linear", delay: layer.delay }
          }
        >
          <svg viewBox="0 0 2880 160" className="h-full w-[200%]" preserveAspectRatio="none">
            <path d={wavePath} fill={layer.fill} opacity={layer.opacity} />
            <path d={wavePath} fill={layer.fill} opacity={layer.opacity} transform="translate(1440,0)" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/** Formas geometricas soltas, com deriva lenta. Puramente decorativas. */
function FloatingShapes({ reduce }: { reduce: boolean }) {
  const shapes = [
    { type: "ring", size: 88, top: "12%", left: "8%", duration: 13, delay: 0 },
    { type: "dot", size: 16, top: "26%", left: "78%", duration: 9, delay: 1.5 },
    { type: "square", size: 34, top: "58%", left: "12%", duration: 15, delay: 0.8 },
    { type: "ring", size: 44, top: "70%", left: "82%", duration: 11, delay: 2.2 },
    { type: "dot", size: 10, top: "44%", left: "90%", duration: 8, delay: 0.4 },
    { type: "square", size: 20, top: "16%", left: "62%", duration: 12, delay: 1.1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: shape.top, left: shape.left, width: shape.size, height: shape.size }}
          animate={reduce ? undefined : { y: [0, -18, 0], x: [0, 8, 0], rotate: shape.type === "square" ? [0, 25, 0] : 0 }}
          transition={
            reduce ? undefined : { duration: shape.duration, repeat: Infinity, ease: "easeInOut", delay: shape.delay }
          }
        >
          {shape.type === "ring" && <div className="h-full w-full rounded-full border-2 border-white/20" />}
          {shape.type === "dot" && <div className="h-full w-full rounded-full bg-accent/50" />}
          {shape.type === "square" && <div className="h-full w-full rounded-[6px] border-2 border-accent/30" />}
        </motion.div>
      ))}
    </div>
  );
}
