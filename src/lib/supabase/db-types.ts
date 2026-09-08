import type { Database } from "./types";

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type Profile = Tables<"profiles">;
export type Account = Tables<"accounts">;
export type Category = Tables<"categories">;
export type Institution = Tables<"institutions">;
export type Transaction = Tables<"transactions">;
export type Transfer = Tables<"transfers">;
export type Card = Tables<"cards">;
export type CardPurchase = Tables<"card_purchases">;
export type CardInstallment = Tables<"card_installments">;
export type CardInvoice = Tables<"card_invoices">;
export type Recurrence = Tables<"recurrences">;
export type RecurrenceOccurrence = Tables<"recurrence_occurrences">;
export type Budget = Tables<"budgets">;
export type Goal = Tables<"goals">;
export type Debt = Tables<"debts">;
export type Notification = Tables<"notifications">;
export type OnboardingState = Tables<"onboarding_state">;

export type AccountRealizedBalance = Views<"account_realized_balances">;
export type CardInvoiceTotals = Views<"card_invoice_totals">;
export type BudgetProgress = Views<"budget_progress">;
export type UpcomingCommitment = Views<"upcoming_commitments">;
