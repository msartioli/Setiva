import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col px-6 py-10 sm:px-0">
      <div className="mb-8 flex items-center gap-2" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-[var(--motion-base)]",
              i < step ? "bg-brand" : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-foreground-muted">
        Passo {step} de {TOTAL_STEPS}
      </p>
      <h1 className="mt-1 font-display text-2xl text-foreground text-balance sm:text-3xl">{title}</h1>
      <p className="mt-2 text-foreground-muted">{subtitle}</p>

      <div className="mt-8 flex-1">{children}</div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
        <div>
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack}>
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
      </div>
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
        "rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-medium transition-colors duration-[var(--motion-fast)]",
        selected
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-surface text-foreground hover:border-border-strong"
      )}
    >
      {children}
    </button>
  );
}
