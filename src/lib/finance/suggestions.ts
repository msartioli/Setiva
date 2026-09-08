import { formatCentsBRL } from "./money";

/**
 * Motor de sugestoes 100% determinístico: cada sugestao carrega os dados
 * usados e a formula, para nunca soar como "IA analisou" quando e so
 * calculo local. Ver docs/FINANCIAL-MODEL.md.
 */

export interface CategorySpend {
  categoryName: string;
  currentCents: number;
  previousCents: number;
}
export interface OverBudget {
  categoryName: string;
  spentCents: number;
  limitCents: number;
}
export interface ActiveGoal {
  id: string;
  name: string;
  targetCents: number;
  reservedCents: number;
}

export interface SuggestionsInput {
  categorySpends: CategorySpend[];
  overBudgets: OverBudget[];
  marginConfirmedCents: number;
  activeGoals: ActiveGoal[];
}

export interface Suggestion {
  id: string;
  title: string;
  explanation: string;
  actionHref: string;
  actionLabel: string;
}

const CATEGORY_INCREASE_RATIO = 1.2;
const CATEGORY_INCREASE_MIN_CENTS = 3000;
const GOAL_RESERVE_SHARE = 0.2;

export function generateSuggestions(input: SuggestionsInput): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const b of input.overBudgets) {
    suggestions.push({
      id: `budget-${b.categoryName}`,
      title: `Orçamento de ${b.categoryName} estourou`,
      explanation: `Você gastou ${formatCentsBRL(b.spentCents)} contra um limite de ${formatCentsBRL(b.limitCents)} definido para este mês.`,
      actionHref: "/planejar/orcamentos",
      actionLabel: "Revisar orçamento",
    });
  }

  for (const c of input.categorySpends) {
    if (c.previousCents <= 0) continue;
    const increase = c.currentCents - c.previousCents;
    if (c.currentCents >= c.previousCents * CATEGORY_INCREASE_RATIO && increase >= CATEGORY_INCREASE_MIN_CENTS) {
      const pct = Math.round((increase / c.previousCents) * 100);
      suggestions.push({
        id: `category-${c.categoryName}`,
        title: `${c.categoryName} subiu ${pct}% em relação ao mês passado`,
        explanation: `Mês passado: ${formatCentsBRL(c.previousCents)}. Este mês: ${formatCentsBRL(c.currentCents)}. Diferença de ${formatCentsBRL(increase)}.`,
        actionHref: "/relatorios",
        actionLabel: "Ver relatório de categorias",
      });
    }
  }

  if (input.marginConfirmedCents > 0 && input.activeGoals.length > 0) {
    const incomplete = input.activeGoals
      .filter((g) => g.reservedCents < g.targetCents)
      .sort((a, b) => a.targetCents - a.reservedCents - (b.targetCents - b.reservedCents))[0];

    if (incomplete) {
      const remaining = incomplete.targetCents - incomplete.reservedCents;
      const suggested = Math.min(Math.round(input.marginConfirmedCents * GOAL_RESERVE_SHARE), remaining);
      if (suggested > 0) {
        suggestions.push({
          id: `goal-${incomplete.id}`,
          title: `Reservar ${formatCentsBRL(suggested)} para "${incomplete.name}"`,
          explanation: `Sua margem confirmada do mês é ${formatCentsBRL(input.marginConfirmedCents)}. Reservar 20% dela (${formatCentsBRL(suggested)}) ainda deixa o restante livre e aproxima sua meta, que falta ${formatCentsBRL(remaining)}.`,
          actionHref: "/planejar/metas",
          actionLabel: "Ir para a meta",
        });
      }
    }
  }

  return suggestions;
}
