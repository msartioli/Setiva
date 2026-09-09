import {
  Wallet,
  Briefcase,
  PlusCircle,
  Home,
  Plug,
  ShoppingCart,
  Car,
  HeartPulse,
  BookOpen,
  Ticket,
  Repeat,
  Sparkles,
  PawPrint,
  Gift,
  Landmark,
  MoreHorizontal,
  Tag,
  type LucideIcon,
} from "lucide-react";

/**
 * Visual de cada categoria: icone e par de cores (fundo suave + traco).
 *
 * A chave e o `icon` que a categoria guarda no banco (seed em
 * 20260908100002). Categoria criada pelo usuario pode vir com um icon
 * desconhecido ou nulo, entao o fallback e obrigatorio, nunca um crash.
 *
 * As cores vivem aqui e nao na coluna `color` do banco porque o seed foi
 * gravado com a paleta antiga (oliva/argila) e o remoto so e atualizado
 * pelo dono, manualmente. Derivar no app mantem as duas paletas em sincronia
 * sem exigir migration de dados.
 */
export interface CategoryVisual {
  icon: LucideIcon;
  className: string;
}

const FALLBACK: CategoryVisual = { icon: Tag, className: "bg-cat-slate-soft text-cat-slate" };

/**
 * Cada categoria com um matiz proprio: o dono pediu explicitamente que
 * "assinaturas" nao tivesse a mesma cor das outras. Os matizes se repetem so
 * entre grupos que nunca aparecem lado a lado (as tres receitas compartilham
 * o verde, que e a cor de entrada de dinheiro no app inteiro).
 */
const BY_ICON: Record<string, CategoryVisual> = {
  // receitas: todas verdes, porque verde ja significa "entrou" no resto do app
  wallet: { icon: Wallet, className: "bg-cat-emerald-soft text-cat-emerald" },
  briefcase: { icon: Briefcase, className: "bg-cat-emerald-soft text-cat-emerald" },
  "plus-circle": { icon: PlusCircle, className: "bg-cat-emerald-soft text-cat-emerald" },

  // despesas: um matiz por categoria
  home: { icon: Home, className: "bg-cat-clay-soft text-cat-clay" },
  plug: { icon: Plug, className: "bg-cat-amber-soft text-cat-amber" },
  "shopping-cart": { icon: ShoppingCart, className: "bg-cat-teal-soft text-cat-teal" },
  car: { icon: Car, className: "bg-cat-blue-soft text-cat-blue" },
  "heart-pulse": { icon: HeartPulse, className: "bg-cat-pink-soft text-cat-pink" },
  "book-open": { icon: BookOpen, className: "bg-cat-blue-soft text-cat-blue" },
  ticket: { icon: Ticket, className: "bg-cat-amber-soft text-cat-amber" },
  repeat: { icon: Repeat, className: "bg-cat-purple-soft text-cat-purple" },
  sparkles: { icon: Sparkles, className: "bg-cat-pink-soft text-cat-pink" },
  "paw-print": { icon: PawPrint, className: "bg-cat-clay-soft text-cat-clay" },
  gift: { icon: Gift, className: "bg-cat-purple-soft text-cat-purple" },
  landmark: { icon: Landmark, className: "bg-cat-slate-soft text-cat-slate" },
  "more-horizontal": { icon: MoreHorizontal, className: "bg-cat-slate-soft text-cat-slate" },
};

/** Casa pelo nome quando a categoria nao tem `icon` gravado. */
const BY_NAME: Record<string, string> = {
  salario: "wallet",
  freelance: "briefcase",
  "outras receitas": "plus-circle",
  moradia: "home",
  "contas e utilidades": "plug",
  mercado: "shopping-cart",
  transporte: "car",
  saude: "heart-pulse",
  educacao: "book-open",
  lazer: "ticket",
  assinaturas: "repeat",
  "cuidado pessoal": "sparkles",
  pets: "paw-print",
  "presentes e doacoes": "gift",
  "impostos e taxas": "landmark",
  "outras despesas": "more-horizontal",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function categoryVisual(icon: string | null | undefined, name?: string | null): CategoryVisual {
  if (icon && BY_ICON[icon]) return BY_ICON[icon];
  if (name) {
    const mapped = BY_NAME[normalize(name)];
    if (mapped && BY_ICON[mapped]) return BY_ICON[mapped];
  }
  return FALLBACK;
}
