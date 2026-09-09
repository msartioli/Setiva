import { ArrowDown, ArrowUp, ArrowLeftRight, CreditCard, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Réplicas em HTML/CSS de telas reais do produto (não são capturas nem
 * imagens). Paleta fixa, independente do tema claro/escuro do visitante:
 * estas peças aparecem sempre como o app aparece no tema padrão, do mesmo
 * jeito que uma captura de tela apareceria. Números são exemplos.
 */
const M = {
  bg: "#f4f7f5",
  surface: "#ffffff",
  ink: "#10221a",
  inkSoft: "#5a6b62",
  border: "#e6ebe8",
  brand: "#0f9d58",
  forest: "#0a4d34",
  gold: "#f2b705",
  positive: "#14804a",
  positiveSoft: "#d8efe1",
  negative: "#c4392a",
  negativeSoft: "#fadbd6",
};

function Row({
  icon: Icon,
  label,
  sub,
  amount,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  amount: string;
  tone: "up" | "down";
}) {
  const color = tone === "up" ? M.positive : M.negative;
  const soft = tone === "up" ? M.positiveSoft : M.negativeSoft;
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: soft, color }}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold" style={{ color: M.ink }}>
          {label}
        </p>
        <p className="text-[11px]" style={{ color: M.inkSoft }}>
          {sub}
        </p>
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums" style={{ color }}>
        {amount}
      </span>
    </div>
  );
}

/** Celular com o resumo do dia, a peça principal do herói. */
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-[248px] overflow-hidden rounded-[30px] p-2.5 shadow-2xl shadow-black/40", className)}
      style={{ background: M.surface }}
    >
      <div className="overflow-hidden rounded-[22px]" style={{ background: M.bg }}>
        <div className="px-4 pb-5 pt-4" style={{ background: M.surface }}>
          <p className="text-[11px]" style={{ color: M.inkSoft }}>
            Seu mês, dia 8
          </p>
          <p className="mt-1 text-[11px]" style={{ color: M.inkSoft }}>
            Saldo projetado hoje
          </p>
          <p className="font-display text-[26px] font-extrabold tabular-nums" style={{ color: M.ink }}>
            R$ 2.480,30
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: ArrowDown, label: "Despesa", color: M.negative },
              { icon: ArrowUp, label: "Receita", color: M.positive },
              { icon: ArrowLeftRight, label: "Transferir", color: M.brand },
            ].map((a) => (
              <div
                key={a.label}
                className="flex flex-col items-center gap-1 rounded-xl py-2.5"
                style={{ background: M.bg }}
              >
                <a.icon className="size-4" style={{ color: a.color }} aria-hidden="true" />
                <span className="text-[9px] font-semibold" style={{ color: M.ink }}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold" style={{ color: M.ink }}>
              Próximos dias
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: M.positiveSoft, color: M.positive }}
            >
              no azul até dia 30
            </span>
          </div>
          <div className="mt-3 space-y-3">
            <Row icon={CreditCard} label="Fatura Nubank" sub="vence dia 10" amount="-1.180,00" tone="down" />
            <Row icon={ArrowUp} label="Freela" sub="entra dia 15" amount="+900,00" tone="up" />
            <Row icon={Target} label="Meta viagem" sub="aporte dia 20" amount="-300,00" tone="down" />
          </div>
        </div>
      </div>
    </div>
  );
}

const WEEK_HEAD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DAYS: { d: number; v?: string; tone?: "up" | "down"; today?: boolean }[] = [
  { d: 1 }, { d: 2 }, { d: 3, v: "-84,90", tone: "down" }, { d: 4 },
  { d: 5, v: "+4.200,00", tone: "up" }, { d: 6 }, { d: 7 },
  { d: 8, today: true }, { d: 9 }, { d: 10, v: "-1.180,00", tone: "down" }, { d: 11 },
  { d: 12 }, { d: 13 }, { d: 14 },
  { d: 15, v: "+900,00", tone: "up" }, { d: 16 }, { d: 17, v: "-318,50", tone: "down" }, { d: 18 },
  { d: 19 }, { d: 20, v: "-300,00", tone: "down" }, { d: 21 },
];

/** Agenda do mês em grade, a tela que dá nome ao "mapa do mês". */
export function AgendaMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn("overflow-hidden rounded-t-2xl shadow-2xl shadow-black/30", className)}
      style={{ background: M.surface }}
    >
      <div className="flex items-center gap-4 border-b px-5 py-3" style={{ borderColor: M.border }}>
        <span className="font-display text-sm font-extrabold" style={{ color: M.brand }}>
          Setiva
        </span>
        {["Hoje", "Movimentações", "Planejar", "Relatórios"].map((t, i) => (
          <span
            key={t}
            className="text-[11px] font-semibold"
            style={{ color: i === 0 ? M.ink : M.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="px-5 py-4">
        <p className="text-center text-[13px] font-bold" style={{ color: M.ink }}>
          Setembro de 2026
        </p>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEK_HEAD.map((w) => (
            <span key={w} className="pb-1 text-center text-[9px] font-bold uppercase" style={{ color: M.inkSoft }}>
              {w}
            </span>
          ))}
          {DAYS.map((day) => (
            <div
              key={day.d}
              className="flex h-14 flex-col items-center justify-center gap-1 rounded-lg"
              style={{ background: day.today ? M.forest : M.bg }}
            >
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: day.today ? "#ffffff" : M.ink }}
              >
                {day.d}
              </span>
              {day.v && (
                <span
                  className="text-[8px] font-bold tabular-nums"
                  style={{ color: day.tone === "up" ? M.positive : M.negative }}
                >
                  {day.v}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Fatura de cartão, com as parcelas que a compõem. */
export function CardsMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl shadow-2xl shadow-black/30", className)}
      style={{ background: M.surface }}
    >
      <div className="p-5">
        <div
          className="rounded-2xl p-4 text-white"
          style={{ background: `linear-gradient(135deg, ${M.brand}, ${M.forest})` }}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] opacity-85">Nubank Mastercard</span>
            <CreditCard className="size-4 opacity-85" aria-hidden="true" />
          </div>
          <p className="mt-4 font-display text-base font-bold tracking-[0.12em]">•••• 4471</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-[10px] opacity-85">Fatura de outubro, fecha dia 3</span>
            <span className="font-display text-base font-extrabold tabular-nums">R$ 1.180,00</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Row icon={CreditCard} label="Tênis novo" sub="parcela 3 de 6" amount="-89,90" tone="down" />
          <Row icon={CreditCard} label="Mercado" sub="à vista" amount="-243,40" tone="down" />
          <Row icon={CreditCard} label="Streaming" sub="recorrente" amount="-39,90" tone="down" />
        </div>
      </div>
    </div>
  );
}

/** Orçamentos por categoria, com barras de progresso. */
export function BudgetMockup({ className }: { className?: string }) {
  const budgets = [
    { name: "Mercado", used: 68, label: "R$ 612 de R$ 900", color: M.brand },
    { name: "Transporte", used: 41, label: "R$ 164 de R$ 400", color: M.gold },
    { name: "Lazer", used: 92, label: "R$ 276 de R$ 300", color: M.negative },
  ];
  return (
    <div
      className={cn("overflow-hidden rounded-2xl p-5 shadow-2xl shadow-black/30", className)}
      style={{ background: M.surface }}
    >
      <p className="font-display text-sm font-extrabold" style={{ color: M.ink }}>
        Orçamentos de setembro
      </p>
      <div className="mt-4 space-y-4">
        {budgets.map((b) => (
          <div key={b.name}>
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold" style={{ color: M.ink }}>
                {b.name}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: M.inkSoft }}>
                {b.label}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: M.bg }}>
              <div className="h-full rounded-full" style={{ width: `${b.used}%`, background: b.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cartão flutuante usado sobreposto às ilustrações. */
export function FloatingCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "up" | "down" | "neutral";
  className?: string;
}) {
  const color = tone === "up" ? M.positive : tone === "down" ? M.negative : M.brand;
  return (
    <div
      className={cn("rounded-2xl px-4 py-3 shadow-xl shadow-black/25", className)}
      style={{ background: M.surface }}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4" style={{ color }} aria-hidden="true" />
        <span className="text-[11px] font-semibold" style={{ color: M.inkSoft }}>
          {label}
        </span>
      </div>
      <p className="mt-1 font-display text-lg font-extrabold tabular-nums" style={{ color: M.ink }}>
        {value}
      </p>
    </div>
  );
}
