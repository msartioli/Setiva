/**
 * Tiva, a mascote original da Setiva: uma capivara pequena em formas
 * simples, desenhada como SVG proprio (sem base em personagem existente).
 * Usada so dentro do produto, sempre condicionada a mascotEnabled. As telas
 * publicas usam as ilustracoes de pessoas em
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
 * Estado "dica": Tiva em pe segurando uma lampada, usada ao lado de
 * conteudo explicativo (sugestoes, ajuda) — nunca sobreposta ao texto.
 */
export function TivaTip({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 150"
      className={className}
      role="img"
      aria-label="Tiva, a mascote da Setiva, segurando uma lampada com uma dica"
    >
      <ellipse cx="76" cy="128" rx="48" ry="9" fill="var(--color-border)" opacity="0.5" />

      {/* corpo */}
      <ellipse cx="76" cy="94" rx="42" ry="32" fill="var(--brand)" />
      <ellipse cx="76" cy="103" rx="27" ry="18" fill="var(--paper)" opacity="0.85" />

      {/* cabeca */}
      <ellipse cx="70" cy="58" rx="31" ry="26" fill="var(--brand)" />
      <ellipse cx="70" cy="67" rx="18" ry="13" fill="var(--paper)" opacity="0.9" />
      <ellipse cx="62" cy="68" rx="2.2" ry="2.8" fill="var(--ink)" />
      <ellipse cx="78" cy="68" rx="2.2" ry="2.8" fill="var(--ink)" />

      {/* orelhas */}
      <circle cx="48" cy="38" r="7.5" fill="var(--brand)" />
      <circle cx="92" cy="38" r="7.5" fill="var(--brand)" />
      <circle cx="48" cy="38" r="3.6" fill="var(--paper)" opacity="0.7" />
      <circle cx="92" cy="38" r="3.6" fill="var(--paper)" opacity="0.7" />

      {/* olhos */}
      <circle cx="60" cy="52" r="3.2" fill="var(--ink)" />
      <circle cx="82" cy="52" r="3.2" fill="var(--ink)" />

      {/* pata levantada segurando a lampada */}
      <ellipse cx="112" cy="86" rx="7.5" ry="20" fill="var(--brand)" transform="rotate(-14 112 86)" />
      {/* pata de apoio */}
      <ellipse cx="52" cy="120" rx="9" ry="7" fill="var(--brand-strong)" />

      {/* lampada */}
      <circle cx="118" cy="46" r="14" fill="var(--accent)" />
      <rect x="112" y="58" width="12" height="8" rx="2" fill="var(--brand-strong)" />
      <path d="M118 20 v8 M138 46 h8 M132 28 l6 -6 M132 64 l6 6" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Estado "comemoracao": Tiva com as duas patas erguidas e confete ao redor,
 * usada em marcos reais (meta concluida, onboarding finalizado) — nunca
 * como decoracao gratuita.
 */
export function TivaCelebrate({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 150"
      className={className}
      role="img"
      aria-label="Tiva, a mascote da Setiva, comemorando com as patas para cima"
    >
      <ellipse cx="80" cy="128" rx="50" ry="9" fill="var(--color-border)" opacity="0.5" />

      {/* confete */}
      <rect x="18" y="30" width="6" height="6" rx="1" fill="var(--accent)" transform="rotate(18 21 33)" />
      <rect x="132" y="22" width="6" height="6" rx="1" fill="var(--clay)" transform="rotate(-12 135 25)" />
      <circle cx="30" cy="66" r="3.5" fill="var(--brand)" />
      <circle cx="140" cy="70" r="3.5" fill="var(--accent)" />
      <rect x="24" y="96" width="6" height="6" rx="1" fill="var(--clay)" transform="rotate(30 27 99)" />
      <circle cx="134" cy="102" r="3.2" fill="var(--brand)" />

      {/* corpo */}
      <ellipse cx="80" cy="94" rx="44" ry="32" fill="var(--brand)" />
      <ellipse cx="80" cy="103" rx="29" ry="18" fill="var(--paper)" opacity="0.85" />

      {/* cabeca */}
      <ellipse cx="80" cy="56" rx="32" ry="27" fill="var(--brand)" />
      <ellipse cx="80" cy="65" rx="19" ry="13" fill="var(--paper)" opacity="0.9" />
      <ellipse cx="71" cy="66" rx="2.2" ry="2.8" fill="var(--ink)" />
      <ellipse cx="89" cy="66" rx="2.2" ry="2.8" fill="var(--ink)" />
      <path d="M74 71 q6 4 12 0" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* orelhas */}
      <circle cx="56" cy="35" r="7.5" fill="var(--brand)" />
      <circle cx="104" cy="35" r="7.5" fill="var(--brand)" />
      <circle cx="56" cy="35" r="3.6" fill="var(--paper)" opacity="0.7" />
      <circle cx="104" cy="35" r="3.6" fill="var(--paper)" opacity="0.7" />

      {/* olhos */}
      <circle cx="70" cy="50" r="3.2" fill="var(--ink)" />
      <circle cx="90" cy="50" r="3.2" fill="var(--ink)" />

      {/* patas erguidas */}
      <ellipse cx="122" cy="68" rx="7.5" ry="19" fill="var(--brand)" transform="rotate(-38 122 68)" />
      <ellipse cx="38" cy="68" rx="7.5" ry="19" fill="var(--brand)" transform="rotate(38 38 68)" />
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
