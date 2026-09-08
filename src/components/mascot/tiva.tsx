/**
 * Tiva, a mascote original da Setiva: uma capivara pequena em formas
 * simples, desenhada como SVG proprio (sem base em personagem existente).
 * Por enquanto so o estado "boas-vindas" existe; "dica", "comemoracao" e
 * "pausa" ficam para uma proxima passada de design (ver docs/ASSETS.md).
 * Sempre opcional e nunca posicionada sobre formulario ou numero.
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
