/**
 * Tiva, a mascote original da Setiva: uma capivara pequena em formas
 * simples, desenhada como SVG proprio (sem base em personagem existente).
 * Usada so dentro do produto (ultimo passo do onboarding), condicionada a
 * mascotEnabled. As telas publicas usam as ilustracoes de pessoas em
 * `src/components/marketing/illustrations.tsx`, nao a mascote.
 */
export function TivaWelcome({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 140"
      className={className}
      role="img"
      aria-label="Tiva, a mascote da Setiva, acenando"
    >
      <ellipse cx="80" cy="118" rx="52" ry="10" fill="var(--color-border)" opacity="0.5" />

      {/* corpo */}
      <ellipse cx="80" cy="82" rx="46" ry="34" fill="var(--brand)" />
      {/* barriga */}
      <ellipse cx="80" cy="92" rx="30" ry="20" fill="var(--paper)" opacity="0.85" />

      {/* cabeca */}
      <ellipse cx="80" cy="48" rx="34" ry="28" fill="var(--brand)" />
      {/* focinho */}
      <ellipse cx="80" cy="58" rx="20" ry="14" fill="var(--paper)" opacity="0.9" />
      <ellipse cx="72" cy="60" rx="2.4" ry="3" fill="var(--ink)" />
      <ellipse cx="88" cy="60" rx="2.4" ry="3" fill="var(--ink)" />

      {/* orelhas */}
      <circle cx="56" cy="26" r="8" fill="var(--brand)" />
      <circle cx="104" cy="26" r="8" fill="var(--brand)" />
      <circle cx="56" cy="26" r="4" fill="var(--paper)" opacity="0.7" />
      <circle cx="104" cy="26" r="4" fill="var(--paper)" opacity="0.7" />

      {/* olhos */}
      <circle cx="68" cy="42" r="3.4" fill="var(--ink)" />
      <circle cx="92" cy="42" r="3.4" fill="var(--ink)" />

      {/* pata acenando */}
      <ellipse cx="122" cy="70" rx="8" ry="14" fill="var(--brand)" transform="rotate(-24 122 70)" />

      {/* patas de apoio */}
      <ellipse cx="58" cy="112" rx="9" ry="7" fill="var(--brand-strong)" />
      <ellipse cx="102" cy="112" rx="9" ry="7" fill="var(--brand-strong)" />
    </svg>
  );
}

/**
 * Estado "pausa": Tiva deitada, olhos fechados, usada em telas de
 * descanso/erro (como a 404) — nunca para indicar falha grave, só uma
 * pausa tranquila.
 */
export function TivaPause({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-label="Tiva, a mascote da Setiva, deitada e tranquila">
      <ellipse cx="100" cy="108" rx="70" ry="8" fill="var(--color-border)" opacity="0.5" />

      {/* corpo deitado */}
      <ellipse cx="100" cy="76" rx="72" ry="30" fill="var(--brand)" />
      <ellipse cx="104" cy="84" rx="48" ry="16" fill="var(--paper)" opacity="0.85" />

      {/* cabeca */}
      <ellipse cx="46" cy="60" rx="30" ry="26" fill="var(--brand)" />
      <ellipse cx="40" cy="68" rx="17" ry="12" fill="var(--paper)" opacity="0.9" />

      {/* orelha */}
      <circle cx="30" cy="40" r="7" fill="var(--brand)" />
      <circle cx="30" cy="40" r="3.4" fill="var(--paper)" opacity="0.7" />

      {/* olhos fechados (tracos curvos) */}
      <path d="M30 58 q5 4 10 0" stroke="var(--ink)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M48 58 q5 4 10 0" stroke="var(--ink)" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* zzz */}
      <text x="150" y="34" fontSize="18" fill="var(--clay)" fontFamily="var(--font-display, sans-serif)">
        z z z
      </text>

      {/* patas */}
      <ellipse cx="70" cy="102" rx="10" ry="7" fill="var(--brand-strong)" />
      <ellipse cx="130" cy="102" rx="10" ry="7" fill="var(--brand-strong)" />
    </svg>
  );
}
