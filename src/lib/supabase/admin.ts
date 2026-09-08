import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a service role key — nunca importar de um Client Component
 * nem expor este modulo ao browser. Usado apenas para exclusao de conta
 * (auth.admin.deleteUser) e limpeza de Storage, onde RLS normal nao basta
 * porque o proprio usuario esta sendo removido de auth.users.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada no servidor. Exclusao de conta requer essa variavel (somente no ambiente do servidor, nunca NEXT_PUBLIC)."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
