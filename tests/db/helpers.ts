import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} nao definida. Rode "npx supabase start" e confira .env.test.local antes de rodar os testes de integracao.`
    );
  }
  return value;
}

export function serviceRoleClient(): SupabaseClient {
  return createClient(
    requireEnv("TEST_SUPABASE_URL"),
    requireEnv("TEST_SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function anonClient(): SupabaseClient {
  return createClient(requireEnv("TEST_SUPABASE_URL"), requireEnv("TEST_SUPABASE_ANON_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

/**
 * Cria um usuario real via signUp (nao via admin API) para exercitar o
 * mesmo caminho que um cadastro de verdade, incluindo o trigger que gera
 * o perfil. Confirmacao de email esta desligada no supabase/config.toml
 * local (enable_confirmations = false), entao a sessao ja volta pronta.
 */
export async function createTestUser(): Promise<TestUser> {
  const email = `setiva-test-${randomUUID()}@example.test`;
  const password = `Teste-${randomUUID()}`;
  const client = createClient(requireEnv("TEST_SUPABASE_URL"), requireEnv("TEST_SUPABASE_ANON_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.user || !data.session) {
    throw new Error(`Falha ao criar usuario de teste: ${error?.message}`);
  }

  await client.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return { id: data.user.id, email, client };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = serviceRoleClient();
  await admin.auth.admin.deleteUser(userId);
}
