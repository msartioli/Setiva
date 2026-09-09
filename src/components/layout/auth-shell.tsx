import Image from "next/image";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Character } from "@/components/marketing/character";

/**
 * Entrar e cadastrar: faixa verde no topo com skyline, cartao branco
 * centralizado por cima dela. Mesmo enquadramento da referencia enviada
 * pelo dono, em vez do painel dividido ao meio de antes.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="relative h-64 overflow-hidden bg-forest sm:h-72">
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full sm:h-48" />

        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <Image src="/brand/symbol.png" alt="" width={30} height={30} priority />
            <span className="font-display text-xl font-extrabold">Setiva</span>
          </Link>
          <Link
            href="/ajuda"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white"
          >
            <HelpCircle className="size-4" aria-hidden="true" />
            Alguma dúvida?
          </Link>
        </div>
      </div>

      {/* relative + z-10: a faixa verde acima é posicionada e, sem isto, ela
          pinta por cima do topo do cartão que sobe com a margem negativa */}
      <main className="relative z-10 mx-auto -mt-40 w-full max-w-md flex-1 px-5 pb-16 sm:-mt-44 sm:px-0">
        <div className="rounded-[28px] bg-surface p-7 shadow-lg sm:p-9">
          <div className="flex items-center gap-3.5">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
              <Character seed="agenda" size={56} className="size-full" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">{eyebrow}</p>
              <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-foreground-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-foreground-muted">
          Registro manual e importação de CSV. Sem conexão automática com bancos nesta versão.
        </p>
      </main>
    </div>
  );
}

/** Skyline chapado, no mesmo espírito da referência: prédios, árvores e nuvens. */
function Skyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 200" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="#ffffff" opacity="0.07">
        <circle cx="180" cy="42" r="16" />
        <circle cx="205" cy="42" r="22" />
        <circle cx="232" cy="42" r="15" />
        <rect x="164" y="42" width="84" height="14" />
        <circle cx="880" cy="34" r="14" />
        <circle cx="902" cy="34" r="19" />
        <rect x="866" y="34" width="60" height="12" />
      </g>

      <g fill="#ffffff" opacity="0.08">
        <rect x="60" y="96" width="70" height="104" rx="4" />
        <rect x="150" y="60" width="54" height="140" rx="4" />
        <rect x="224" y="118" width="86" height="82" rx="4" />
        <rect x="330" y="78" width="62" height="122" rx="4" />
        <rect x="412" y="130" width="74" height="70" rx="4" />
        <rect x="506" y="92" width="58" height="108" rx="4" />
        <rect x="584" y="124" width="92" height="76" rx="4" />
        <rect x="696" y="66" width="56" height="134" rx="4" />
        <rect x="772" y="112" width="80" height="88" rx="4" />
        <rect x="872" y="86" width="60" height="114" rx="4" />
        <rect x="952" y="128" width="88" height="72" rx="4" />
        <rect x="1060" y="94" width="66" height="106" rx="4" />
      </g>

      <g fill="#f2b705" opacity="0.5">
        <circle cx="176" cy="52" r="7" />
        <circle cx="1092" cy="86" r="7" />
      </g>

      <g fill="#ffffff" opacity="0.12">
        <circle cx="470" cy="150" r="34" />
        <rect x="466" y="150" width="8" height="50" />
        <circle cx="1010" cy="146" r="30" />
        <rect x="1006" y="146" width="8" height="54" />
      </g>
    </svg>
  );
}
