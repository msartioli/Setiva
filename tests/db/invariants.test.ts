import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, anonClient, type TestUser } from "./helpers";

// Testes de integracao contra o Supabase LOCAL (supabase/migrations
// aplicadas via `npx supabase start`). Cobrem os invariantes financeiros
// do docs/FINANCIAL-MODEL.md que dependem do banco de verdade (RLS,
// funcoes security definer, constraints). Nunca tocam o projeto remoto.

describe("invariantes financeiros (Supabase local)", () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser();
    userB = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(userA.id);
    await deleteTestUser(userB.id);
  });

  it("cria o perfil automaticamente no cadastro", async () => {
    const { data, error } = await userA.client
      .from("profiles")
      .select("user_id")
      .eq("user_id", userA.id)
      .single();
    expect(error).toBeNull();
    expect(data?.user_id).toBe(userA.id);
  });

  it("RLS: usuario anonimo nao le nenhuma conta", async () => {
    const anon = anonClient();
    const { data, error } = await anon.from("accounts").select("id");
    // Sem policy para anon e sem GRANT, o PostgREST responde com erro de
    // permissao (nunca deveria simplesmente devolver linhas de outro usuario).
    expect(data === null || data.length === 0).toBe(true);
    if (!error) {
      expect(data).toEqual([]);
    }
  });

  it("RLS: usuario B nao ve contas do usuario A", async () => {
    const { data: accountA, error: createError } = await userA.client
      .from("accounts")
      .insert({ name: "Conta corrente A", kind: "checking", initial_balance_cents: 100000 })
      .select()
      .single();
    expect(createError).toBeNull();
    expect(accountA).toBeTruthy();

    const { data: seenByB, error: readError } = await userB.client
      .from("accounts")
      .select("id")
      .eq("id", accountA!.id);

    expect(readError).toBeNull();
    expect(seenByB).toEqual([]);
  });

  it("transferencia entre contas proprias conserva o patrimonio total", async () => {
    const { data: origem } = await userA.client
      .from("accounts")
      .insert({ name: "Origem", kind: "checking", initial_balance_cents: 100000 })
      .select()
      .single();
    const { data: destino } = await userA.client
      .from("accounts")
      .insert({ name: "Destino", kind: "savings", initial_balance_cents: 0 })
      .select()
      .single();

    const totalAntes = await totalRealizedBalance(userA);

    const { error: transferError } = await userA.client.rpc("create_transfer", {
      p_from_account_id: origem!.id,
      p_to_account_id: destino!.id,
      p_amount_cents: 10000,
      p_transfer_date: new Date().toISOString().slice(0, 10),
      p_description: "teste de transferencia",
    });
    expect(transferError).toBeNull();

    const totalDepois = await totalRealizedBalance(userA);
    expect(totalDepois).toBe(totalAntes);

    const { data: balances } = await userA.client
      .from("account_realized_balances")
      .select("account_id, balance_cents")
      .in("account_id", [origem!.id, destino!.id]);

    const origemBalance = balances!.find((b) => b.account_id === origem!.id)!.balance_cents;
    const destinoBalance = balances!.find((b) => b.account_id === destino!.id)!.balance_cents;
    expect(origemBalance).toBe(90000);
    expect(destinoBalance).toBe(10000);
  });

  it("usuario B nao consegue transferir usando conta do usuario A", async () => {
    const { data: contaA } = await userA.client
      .from("accounts")
      .insert({ name: "Conta protegida", kind: "checking", initial_balance_cents: 5000 })
      .select()
      .single();
    const { data: contaB } = await userB.client
      .from("accounts")
      .insert({ name: "Conta B", kind: "checking", initial_balance_cents: 0 })
      .select()
      .single();

    const { error } = await userB.client.rpc("create_transfer", {
      p_from_account_id: contaA!.id,
      p_to_account_id: contaB!.id,
      p_amount_cents: 1000,
      p_transfer_date: new Date().toISOString().slice(0, 10),
    });

    expect(error).not.toBeNull();
  });

  it("compra parcelada distribui os centavos sem perda", async () => {
    const { data: card } = await userA.client
      .from("cards")
      .insert({ name: "Cartao teste", closing_day: 10, due_day: 20, limit_cents: 500000 })
      .select()
      .single();

    const { data: purchase, error } = await userA.client.rpc("create_card_purchase", {
      p_card_id: card!.id,
      p_category_id: null,
      p_description: "compra parcelada",
      p_total_amount_cents: 10000,
      p_installments_count: 3,
      p_purchase_date: new Date().toISOString().slice(0, 10),
    });
    expect(error).toBeNull();

    const { data: installments } = await userA.client
      .from("card_installments")
      .select("amount_cents")
      .eq("card_purchase_id", (purchase as { id: string }).id);

    const sum = installments!.reduce((acc, row) => acc + row.amount_cents, 0);
    expect(sum).toBe(10000);
    expect(installments!.length).toBe(3);
  });

  it("materializar recorrencias duas vezes no mesmo horizonte nao duplica ocorrencias", async () => {
    const { data: account } = await userA.client
      .from("accounts")
      .insert({ name: "Conta recorrencia", kind: "checking", initial_balance_cents: 0 })
      .select()
      .single();

    const { data: recurrence } = await userA.client
      .from("recurrences")
      .insert({
        account_id: account!.id,
        kind: "expense",
        description: "Assinatura teste",
        amount_cents: 2990,
        frequency: "monthly",
        anchor_day: 31,
        start_date: "2026-01-01",
      })
      .select()
      .single();

    const horizon = "2026-12-31";
    await userA.client.rpc("materialize_recurrence_occurrences", { p_horizon_end: horizon });
    const { data: first } = await userA.client
      .from("recurrence_occurrences")
      .select("id, due_date")
      .eq("recurrence_id", recurrence!.id);

    await userA.client.rpc("materialize_recurrence_occurrences", { p_horizon_end: horizon });
    const { data: second } = await userA.client
      .from("recurrence_occurrences")
      .select("id")
      .eq("recurrence_id", recurrence!.id);

    expect(second!.length).toBe(first!.length);

    // Dia 31 em fevereiro deve virar o ultimo dia do mes (28, ano nao bissexto).
    const fevereiro = first!.find((o) => o.due_date.startsWith("2026-02"));
    expect(fevereiro?.due_date).toBe("2026-02-28");
  });

  it("concluir o onboarding duas vezes e idempotente", async () => {
    const { data: first, error: e1 } = await userA.client.rpc("complete_onboarding");
    expect(e1).toBeNull();
    const { data: second, error: e2 } = await userA.client.rpc("complete_onboarding");
    expect(e2).toBeNull();
    expect((first as { completed_at: string }).completed_at).toBe(
      (second as { completed_at: string }).completed_at
    );
  });
});

async function totalRealizedBalance(user: TestUser): Promise<number> {
  const { data, error } = await user.client.from("account_realized_balances").select("balance_cents");
  if (error) throw error;
  return data.reduce((acc, row) => acc + row.balance_cents, 0);
}
