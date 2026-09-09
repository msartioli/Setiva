"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { StepShell, Chip } from "./step-shell";
import { TivaWelcome } from "@/components/mascot/tiva";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AVATAR_FAMILIES,
  NICKNAME_SUGGESTIONS,
  avatarDataUri,
  generateRandomSeed,
  getFamilySeeds,
  type AvatarFamilyKey,
} from "@/lib/avatars";
import { formatCentsBRL, parseBRLToCents } from "@/lib/finance/money";
import {
  advanceToReview,
  finishOnboarding,
  goBackToStep,
  saveAccountsStep,
  saveBudgetsStep,
  saveCardsStep,
  saveDebtsStep,
  saveGoalStep,
  saveGoalsIntentStep,
  saveIncomeStep,
  saveMonthlyBillsStep,
  savePreferencesStep,
  saveProfileStep,
} from "@/actions/onboarding";

interface CategoryOption {
  id: string;
  name: string;
}
interface InstitutionOption {
  id: string;
  name: string;
  kind: string;
}
interface AccountOption {
  id: string;
  name: string;
}

interface OnboardingFlowProps {
  initialStep: number;
  profile: { displayName: string; nickname: string; avatarSeed: string; avatarStyle: string };
  incomeCategories: CategoryOption[];
  expenseCategories: CategoryOption[];
  institutions: InstitutionOption[];
  existingAccounts: AccountOption[];
}

const INTENT_OPTIONS: { key: string; label: string }[] = [
  { key: "gastos", label: "Organizar os gastos do mês" },
  { key: "atrasos", label: "Parar de atrasar contas" },
  { key: "guardar", label: "Guardar dinheiro" },
  { key: "dividas", label: "Quitar dívidas" },
  { key: "visao-geral", label: "Ter uma visão geral" },
];

const BILL_SUGGESTIONS = [
  { description: "Aluguel", anchorDay: 5 },
  { description: "Internet", anchorDay: 10 },
  { description: "Transporte", anchorDay: 1 },
];

export function OnboardingFlow(props: OnboardingFlowProps) {
  const [step, setStep] = useState(props.initialStep);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Passo 1
  const [displayName, setDisplayName] = useState(props.profile.displayName);
  const [nickname, setNickname] = useState(props.profile.nickname);
  const [avatarFamily, setAvatarFamily] = useState<AvatarFamilyKey>("retratos");
  const [avatarSeed, setAvatarSeed] = useState(props.profile.avatarSeed || generateRandomSeed());

  // Passo 2
  const [intents, setIntents] = useState<string[]>([]);

  // Passo 3
  const [incomeSources, setIncomeSources] = useState<
    { description: string; amountCents: number; isEstimate: boolean; anchorDay: number }[]
  >([]);
  const [incomeDesc, setIncomeDesc] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDay, setIncomeDay] = useState("5");
  const [incomeEstimate, setIncomeEstimate] = useState(false);

  // Passo 4
  type AccountKind = "checking" | "savings" | "wallet" | "investment" | "other";
  const [accounts, setAccounts] = useState<
    { name: string; kind: AccountKind; institutionId: string | null; initialBalanceCents: number }[]
  >([]);
  const [accountName, setAccountName] = useState("");
  const [accountKind, setAccountKind] = useState<AccountKind>("checking");
  const [accountBalance, setAccountBalance] = useState("");

  // Passo 5
  const [cards, setCards] = useState<
    {
      name: string;
      institutionId: string | null;
      limitCents: number;
      closingDay: number;
      dueDay: number;
      existingInvoiceCents: number;
    }[]
  >([]);
  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosing, setCardClosing] = useState("10");
  const [cardDue, setCardDue] = useState("17");
  const [cardExisting, setCardExisting] = useState("");

  // Passo 6
  const [bills, setBills] = useState<{ description: string; amountCents: number; anchorDay: number }[]>([]);
  const [billDesc, setBillDesc] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDay, setBillDay] = useState("10");

  // Passo 7
  const [debts, setDebts] = useState<{ name: string; currentBalanceCents: number }[]>([]);
  const [debtName, setDebtName] = useState("");
  const [debtBalance, setDebtBalance] = useState("");

  // Passo 8
  const [budgetCategoryIds, setBudgetCategoryIds] = useState<string[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, string>>({});

  // Passo 9
  const [wantsGoal, setWantsGoal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalReserved, setGoalReserved] = useState("");

  // Passo 10
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [hideValues, setHideValues] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [mascotEnabled, setMascotEnabled] = useState(true);

  const avatarOptions = useMemo(() => getFamilySeeds(avatarFamily), [avatarFamily]);

  function run(action: () => Promise<{ success: boolean; error?: string }>, onOk: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        onOk();
      } else {
        setError(result.error ?? "Não foi possível salvar. Tente de novo.");
      }
    });
  }

  const next = () => setStep((s) => Math.min(s + 1, 12));
  const back = (target: number) => run(() => goBackToStep(target), () => setStep(target));

  return (
    <div className="bg-background">
      {error && (
        <div className="mx-auto max-w-xl px-6 pt-6 sm:px-0">
          <p role="alert" className="rounded-[var(--radius-md)] bg-negative-soft px-3.5 py-2.5 text-sm text-negative">
            {error}
          </p>
        </div>
      )}

      {step === 1 && (
        <StepShell
          step={1}
          title="Como você quer ser chamado?"
          subtitle="Isso aparece no seu painel. Você pode mudar depois nas configurações."
          footer={
            <Button
              disabled={!displayName.trim() || isPending}
              onClick={() =>
                run(
                  () =>
                    saveProfileStep({
                      displayName,
                      nickname,
                      avatarFamily,
                      avatarStyle: AVATAR_FAMILIES[avatarFamily].label,
                      avatarSeed,
                    }),
                  next
                )
              }
            >
              Continuar
            </Button>
          }
        >
          <div className="flex flex-col gap-6">
            <Field label="Nome de exibição" htmlFor="displayName">
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Apelido" htmlFor="nickname" optional hint="Não é usado para identificar sua conta.">
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <div className="mt-2 flex flex-wrap gap-2">
                {NICKNAME_SUGGESTIONS.map((s) => (
                  <Chip key={s} selected={nickname === s} onClick={() => setNickname(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Escolha um avatar</p>
              <div className="mb-3 flex gap-2">
                {(Object.keys(AVATAR_FAMILIES) as AvatarFamilyKey[]).map((key) => (
                  <Chip key={key} selected={avatarFamily === key} onClick={() => setAvatarFamily(key)}>
                    {AVATAR_FAMILIES[key].label}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {avatarOptions.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatarSeed(seed)}
                    aria-pressed={avatarSeed === seed}
                    aria-label="Escolher este avatar"
                    className={`rounded-full transition-all duration-[var(--motion-fast)] ${
                      avatarSeed === seed
                        ? "ring-2 ring-brand ring-offset-2 ring-offset-background"
                        : "ring-1 ring-border hover:ring-border-strong"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarDataUri(avatarFamily, seed)} alt="" width={64} height={64} className="rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          step={2}
          title="O que você quer organizar primeiro?"
          subtitle="Pode marcar mais de uma opção."
          onBack={() => back(1)}
          footer={
            <Button
              disabled={intents.length === 0 || isPending}
              onClick={() => run(() => saveGoalsIntentStep({ intents: intents as never }), next)}
            >
              Continuar
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {INTENT_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                selected={intents.includes(opt.key)}
                onClick={() =>
                  setIntents((prev) =>
                    prev.includes(opt.key) ? prev.filter((i) => i !== opt.key) : [...prev, opt.key]
                  )
                }
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          step={3}
          title="Como entra seu dinheiro?"
          subtitle="Adicione cada fonte de renda mensal e o dia em que ela cai. É esse dia que posiciona a entrada no mapa do mês. Se o valor variar, marque como estimado."
          onBack={() => back(2)}
          onSkip={() => run(() => saveIncomeStep({ sources: [] }), next)}
          skipLabel="Ainda não sei"
          footer={
            <Button
              disabled={incomeSources.length === 0 || isPending}
              onClick={() =>
                run(
                  () =>
                    saveIncomeStep({
                      sources: incomeSources.map((s) => ({
                        ...s,
                        frequency: "monthly",
                      })),
                    }),
                  next
                )
              }
            >
              Continuar
            </Button>
          }
        >
          <RowList
            items={incomeSources}
            onRemove={(i) => setIncomeSources((prev) => prev.filter((_, idx) => idx !== i))}
            render={(item) => (
              <span>
                {item.description}: {formatCentsBRL(item.amountCents)}, todo dia {item.anchorDay}
                {item.isEstimate ? " (estimado)" : ""}
              </span>
            )}
          />
          <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder="Ex: Salário"
                aria-label="Descrição da renda"
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
              />
              <Input
                placeholder="R$ 0,00"
                inputMode="decimal"
                aria-label="Valor da renda"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-foreground-muted">
                <span className="whitespace-nowrap">Todo dia</span>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  inputMode="numeric"
                  aria-label="Dia do mês em que a renda entra"
                  className="w-20"
                  value={incomeDay}
                  onChange={(e) => setIncomeDay(e.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-foreground-muted">
              <Checkbox checked={incomeEstimate} onCheckedChange={(v) => setIncomeEstimate(v === true)} />
              Valor variável / estimado
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!incomeDesc.trim() || !incomeAmount.trim()) return;
                const day = Number(incomeDay);
                if (!Number.isInteger(day) || day < 1 || day > 31) {
                  setError("O dia da renda precisa ser um número de 1 a 31.");
                  return;
                }
                try {
                  const cents = parseBRLToCents(incomeAmount);
                  if (cents <= 0) return;
                  setIncomeSources((prev) => [
                    ...prev,
                    { description: incomeDesc, amountCents: cents, isEstimate: incomeEstimate, anchorDay: day },
                  ]);
                  setIncomeDesc("");
                  setIncomeAmount("");
                  setIncomeDay("5");
                  setIncomeEstimate(false);
                } catch {
                  setError("Valor de renda inválido.");
                }
              }}
            >
              Adicionar fonte de renda
            </Button>
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          step={4}
          title="Onde seu dinheiro fica?"
          subtitle="Contas bancárias ou carteiras. Não conectamos ao seu banco: é registro manual."
          onBack={() => back(3)}
          onSkip={() => run(() => saveAccountsStep({ accounts: [] }), next)}
          footer={
            <Button
              disabled={accounts.length === 0 || isPending}
              onClick={() =>
                run(
                  () =>
                    saveAccountsStep({
                      accounts: accounts.map((a) => ({
                        ...a,
                        initialBalanceDate: today(),
                      })),
                    }),
                  next
                )
              }
            >
              Continuar
            </Button>
          }
        >
          <RowList
            items={accounts}
            onRemove={(i) => setAccounts((prev) => prev.filter((_, idx) => idx !== i))}
            render={(item) => (
              <span>
                {item.name}: {formatCentsBRL(item.initialBalanceCents)}
              </span>
            )}
          />
          <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input placeholder="Nome da conta" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              <select
                value={accountKind}
                onChange={(e) => setAccountKind(e.target.value as AccountKind)}
                className="h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
              >
                <option value="checking">Conta corrente</option>
                <option value="savings">Poupança</option>
                <option value="wallet">Carteira</option>
                <option value="investment">Investimento</option>
                <option value="other">Outra</option>
              </select>
              <Input
                placeholder="Saldo atual R$"
                inputMode="decimal"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!accountName.trim()) return;
                try {
                  const cents = accountBalance.trim() ? parseBRLToCents(accountBalance) : 0;
                  setAccounts((prev) => [...prev, { name: accountName, kind: accountKind, institutionId: null, initialBalanceCents: cents }]);
                  setAccountName("");
                  setAccountBalance("");
                } catch {
                  setError("Saldo inválido.");
                }
              }}
            >
              Adicionar conta
            </Button>
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell
          step={5}
          title="Usa cartão de crédito?"
          subtitle="Sem número completo, CVV ou senha. Só o que ajuda a calcular a fatura."
          onBack={() => back(4)}
          onSkip={() => run(() => saveCardsStep({ cards: [] }), next)}
          footer={
            <Button
              disabled={isPending}
              onClick={() => run(() => saveCardsStep({ cards }), next)}
            >
              Continuar
            </Button>
          }
        >
          <RowList
            items={cards}
            onRemove={(i) => setCards((prev) => prev.filter((_, idx) => idx !== i))}
            render={(item) => (
              <span>
                {item.name}: limite {formatCentsBRL(item.limitCents)}, fecha dia {item.closingDay}, vence dia{" "}
                {item.dueDay}
              </span>
            )}
          />
          <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <Input placeholder="Nome do cartão (ex: Nubank)" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Limite" htmlFor="cardLimit">
                <Input id="cardLimit" inputMode="decimal" value={cardLimit} onChange={(e) => setCardLimit(e.target.value)} />
              </Field>
              <Field label="Dia do fechamento" htmlFor="cardClosing">
                <Input id="cardClosing" type="number" min={1} max={31} value={cardClosing} onChange={(e) => setCardClosing(e.target.value)} />
              </Field>
              <Field label="Dia do vencimento" htmlFor="cardDue">
                <Input id="cardDue" type="number" min={1} max={31} value={cardDue} onChange={(e) => setCardDue(e.target.value)} />
              </Field>
            </div>
            <Field label="Fatura já em aberto" htmlFor="cardExisting" optional hint="Se já tem compras não pagas neste cartão.">
              <Input id="cardExisting" inputMode="decimal" placeholder="R$ 0,00" value={cardExisting} onChange={(e) => setCardExisting(e.target.value)} />
            </Field>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!cardName.trim()) return;
                try {
                  setCards((prev) => [
                    ...prev,
                    {
                      name: cardName,
                      institutionId: null,
                      limitCents: cardLimit.trim() ? parseBRLToCents(cardLimit) : 0,
                      closingDay: Number(cardClosing) || 10,
                      dueDay: Number(cardDue) || 17,
                      existingInvoiceCents: cardExisting.trim() ? parseBRLToCents(cardExisting) : 0,
                    },
                  ]);
                  setCardName("");
                  setCardLimit("");
                  setCardExisting("");
                } catch {
                  setError("Valor de cartão inválido.");
                }
              }}
            >
              Adicionar cartão
            </Button>
          </div>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell
          step={6}
          title="Quais contas fazem parte do seu mês?"
          subtitle="Aluguel, internet, transporte: o que se repete todo mês. Os valores não são cadastrados automaticamente."
          onBack={() => back(5)}
          onSkip={() => run(() => saveMonthlyBillsStep({ bills: [] }), next)}
          footer={
            <Button disabled={isPending} onClick={() => run(() => saveMonthlyBillsStep({ bills: bills.map((b) => ({ ...b, categoryId: null, accountId: null })) }), next)}>
              Continuar
            </Button>
          }
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {BILL_SUGGESTIONS.map((s) => (
              <Chip key={s.description} selected={false} onClick={() => { setBillDesc(s.description); setBillDay(String(s.anchorDay)); }}>
                {s.description}
              </Chip>
            ))}
          </div>
          <RowList
            items={bills}
            onRemove={(i) => setBills((prev) => prev.filter((_, idx) => idx !== i))}
            render={(item) => (
              <span>
                {item.description}: {formatCentsBRL(item.amountCents)}, todo dia {item.anchorDay}
              </span>
            )}
          />
          <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="Descrição"
                value={billDesc}
                onChange={(e) => setBillDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBill();
                  }
                }}
              />
              <Input placeholder="R$ 0,00" inputMode="decimal" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
              <Input placeholder="Dia do vencimento" type="number" min={1} max={31} value={billDay} onChange={(e) => setBillDay(e.target.value)} />
            </div>
            <Button type="button" variant="secondary" onClick={addBill}>
              Adicionar (ou aperte Enter na descrição)
            </Button>
          </div>
        </StepShell>
      )}

      {step === 7 && (
        <StepShell
          step={7}
          title="Há parcelas ou dívidas em andamento?"
          subtitle="Fora do cartão: empréstimo, financiamento, acordo. Pode pular se não tiver."
          onBack={() => back(6)}
          onSkip={() => run(() => saveDebtsStep({ debts: [] }), next)}
          footer={
            <Button disabled={isPending} onClick={() => run(() => saveDebtsStep({ debts }), next)}>
              Continuar
            </Button>
          }
        >
          <RowList
            items={debts}
            onRemove={(i) => setDebts((prev) => prev.filter((_, idx) => idx !== i))}
            render={(item) => (
              <span>
                {item.name}: saldo {formatCentsBRL(item.currentBalanceCents)}
              </span>
            )}
          />
          <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input placeholder="Nome (ex: Empréstimo pessoal)" value={debtName} onChange={(e) => setDebtName(e.target.value)} />
              <Input placeholder="Saldo devedor R$" inputMode="decimal" value={debtBalance} onChange={(e) => setDebtBalance(e.target.value)} />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!debtName.trim() || !debtBalance.trim()) return;
                try {
                  setDebts((prev) => [...prev, { name: debtName, currentBalanceCents: parseBRLToCents(debtBalance) }]);
                  setDebtName("");
                  setDebtBalance("");
                } catch {
                  setError("Saldo inválido.");
                }
              }}
            >
              Adicionar dívida
            </Button>
          </div>
        </StepShell>
      )}

      {step === 8 && (
        <StepShell
          step={8}
          title="Onde você quer colocar limites?"
          subtitle="Escolha categorias de despesa e defina um limite mensal para cada uma."
          onBack={() => back(7)}
          onSkip={() => run(() => saveBudgetsStep({ limits: [] }), next)}
          footer={
            <Button
              disabled={isPending}
              onClick={() =>
                run(
                  () =>
                    saveBudgetsStep({
                      limits: budgetCategoryIds
                        .filter((id) => budgetLimits[id]?.trim())
                        .map((id) => ({ categoryId: id, limitCents: parseBRLToCents(budgetLimits[id]) })),
                    }),
                  next
                )
              }
            >
              Continuar
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {props.expenseCategories.map((c) => (
              <Chip
                key={c.id}
                selected={budgetCategoryIds.includes(c.id)}
                onClick={() =>
                  setBudgetCategoryIds((prev) =>
                    prev.includes(c.id) ? prev.filter((i) => i !== c.id) : [...prev, c.id]
                  )
                }
              >
                {c.name}
              </Chip>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {budgetCategoryIds.map((id) => {
              const cat = props.expenseCategories.find((c) => c.id === id);
              return (
                <Field key={id} label={cat?.name ?? ""} htmlFor={`budget-${id}`}>
                  <Input
                    id={`budget-${id}`}
                    placeholder="R$ 0,00"
                    inputMode="decimal"
                    value={budgetLimits[id] ?? ""}
                    onChange={(e) => setBudgetLimits((prev) => ({ ...prev, [id]: e.target.value }))}
                  />
                </Field>
              );
            })}
          </div>
        </StepShell>
      )}

      {step === 9 && (
        <StepShell
          step={9}
          title="Quanto quer guardar e para quê?"
          subtitle="Uma meta para começar. Você pode criar mais depois no Planejamento."
          onBack={() => back(8)}
          onSkip={() => run(() => saveGoalStep(null), next)}
          footer={
            <Button
              disabled={isPending || (wantsGoal && (!goalName.trim() || !goalTarget.trim()))}
              onClick={() =>
                run(
                  () =>
                    saveGoalStep(
                      wantsGoal
                        ? {
                            name: goalName,
                            targetCents: parseBRLToCents(goalTarget || "0"),
                            reservedCents: goalReserved.trim() ? parseBRLToCents(goalReserved) : 0,
                          }
                        : null
                    ),
                  next
                )
              }
            >
              Continuar
            </Button>
          }
        >
          <label className="mb-4 flex items-center gap-2.5 text-sm">
            <Checkbox checked={wantsGoal} onCheckedChange={(v) => setWantsGoal(v === true)} />
            Quero definir uma meta agora
          </label>
          {wantsGoal && (
            <div className="flex flex-col gap-4">
              <Field label="Nome da meta" htmlFor="goalName">
                <Input id="goalName" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Ex: Viagem, reserva de emergência" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Valor da meta" htmlFor="goalTarget">
                  <Input id="goalTarget" inputMode="decimal" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="R$ 0,00" />
                </Field>
                <Field label="Já reservado" htmlFor="goalReserved" optional>
                  <Input id="goalReserved" inputMode="decimal" value={goalReserved} onChange={(e) => setGoalReserved(e.target.value)} placeholder="R$ 0,00" />
                </Field>
              </div>
            </div>
          )}
        </StepShell>
      )}

      {step === 10 && (
        <StepShell
          step={10}
          title="Deixe com a sua cara"
          subtitle="Você pode mudar tudo isso depois nas configurações."
          onBack={() => back(9)}
          footer={
            <Button
              disabled={isPending}
              onClick={() =>
                run(
                  () =>
                    savePreferencesStep({
                      theme,
                      density,
                      hideValues,
                      showCents: true,
                      firstDayOfWeek: 0,
                      animationsEnabled,
                      mascotEnabled,
                    }),
                  next
                )
              }
            >
              Continuar
            </Button>
          }
        >
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-sm font-medium">Tema</p>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <Chip key={t} selected={theme === t} onClick={() => setTheme(t)}>
                    {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Automático"}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Densidade</p>
              <div className="flex gap-2">
                {(["comfortable", "compact"] as const).map((d) => (
                  <Chip key={d} selected={density === d} onClick={() => setDensity(d)}>
                    {d === "comfortable" ? "Confortável" : "Compacta"}
                  </Chip>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm">
              Ocultar valores por padrão
              <Switch checked={hideValues} onCheckedChange={setHideValues} />
            </label>
            <label className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm">
              Animações
              <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
            </label>
            <label className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm">
              Mostrar a Tiva (mascote)
              <Switch checked={mascotEnabled} onCheckedChange={setMascotEnabled} />
            </label>
          </div>
        </StepShell>
      )}

      {step === 11 && (
        <StepShell
          step={11}
          title="Confira seu primeiro mês"
          subtitle="Isto é o que vamos usar para montar seu mapa do mês."
          onBack={() => back(10)}
          footer={
            <Button disabled={isPending} onClick={() => run(() => advanceToReview(), next)}>
              Está certo, continuar
            </Button>
          }
        >
          <ReviewSummary
            intents={intents}
            incomeSources={incomeSources}
            accounts={accounts}
            cards={cards}
            bills={bills}
            debts={debts}
            budgetCount={budgetCategoryIds.length}
            hasGoal={wantsGoal}
          />
        </StepShell>
      )}

      {step === 12 && (
        <StepShell
          step={12}
          title={`Seu mês começa aqui, ${displayName || ""}`.trim()}
          subtitle="Tudo pronto. Vamos para o seu mapa do mês."
          footer={
            <Button
              size="lg"
              disabled={isPending}
              onClick={() =>
                run(
                  () => finishOnboarding(),
                  () => router.push("/hoje")
                )
              }
            >
              {isPending ? "Preparando..." : "Ver meu mapa do mês"}
            </Button>
          }
        >
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
            {mascotEnabled && <TivaWelcome className="mx-auto mb-4 h-28 w-28" />}
            <p className="font-display text-xl text-foreground">Bem-vindo à Setiva.</p>
            <p className="mt-2 text-sm text-foreground-muted">
              Você pode revisitar essas configurações a qualquer momento em Configurações.
            </p>
          </div>
        </StepShell>
      )}
    </div>
  );

  function addBill() {
    if (!billDesc.trim() || !billAmount.trim()) return;
    try {
      const cents = parseBRLToCents(billAmount);
      setBills((prev) => [...prev, { description: billDesc, amountCents: cents, anchorDay: Number(billDay) || 10 }]);
      setBillDesc("");
      setBillAmount("");
    } catch {
      setError("Valor inválido.");
    }
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function RowList<T>({
  items,
  onRemove,
  render,
}: {
  items: T[];
  onRemove: (index: number) => void;
  render: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-sm"
        >
          {render(item)}
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label="Remover"
            className="text-foreground-muted hover:text-negative"
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ReviewSummary({
  intents,
  incomeSources,
  accounts,
  cards,
  bills,
  debts,
  budgetCount,
  hasGoal,
}: {
  intents: string[];
  incomeSources: { amountCents: number }[];
  accounts: { initialBalanceCents: number }[];
  cards: { limitCents: number }[];
  bills: { amountCents: number }[];
  debts: { currentBalanceCents: number }[];
  budgetCount: number;
  hasGoal: boolean;
}) {
  const totalIncome = incomeSources.reduce((a, s) => a + s.amountCents, 0);
  const totalBills = bills.reduce((a, b) => a + b.amountCents, 0);
  const overCommitted = totalBills > totalIncome && totalIncome > 0;

  const rows: [string, string][] = [
    ["O que você quer organizar", intents.length ? `${intents.length} objetivo(s) selecionado(s)` : "Não informado"],
    ["Renda mensal declarada", formatCentsBRL(totalIncome)],
    ["Contas cadastradas", `${accounts.length}`],
    ["Cartões cadastrados", `${cards.length}`],
    ["Contas do mês", `${bills.length} (total ${formatCentsBRL(totalBills)})`],
    ["Dívidas", `${debts.length}`],
    ["Categorias com orçamento", `${budgetCount}`],
    ["Meta definida", hasGoal ? "Sim" : "Não"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <dt className="text-foreground-muted">{label}</dt>
            <dd className="font-medium text-foreground tabular-figures">{value}</dd>
          </div>
        ))}
      </dl>
      {overCommitted && (
        <p className="rounded-[var(--radius-md)] bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
          Suas contas do mês ({formatCentsBRL(totalBills)}) somam mais do que a renda que você declarou (
          {formatCentsBRL(totalIncome)}). Não tem problema cadastrar assim, é só algo para olhar de perto no
          seu mapa do mês.
        </p>
      )}
    </div>
  );
}
