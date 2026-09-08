import type { SupabaseClient } from "@supabase/supabase-js";

// Versao/data dos termos e da privacidade apresentados no cadastro.
// Mudou o texto de forma relevante? Suba a versao aqui, nao reescreva
// silenciosamente o que ja foi aceito por alguem.
export const TERMS_VERSION = "2026.1";
export const PRIVACY_VERSION = "2026.1";

/**
 * Registra o aceite versionado de termos e privacidade para o usuario da
 * sessao atual. So funciona com uma sessao valida (RLS exige auth.uid()).
 * Chamar depois que a sessao existir de verdade — no cadastro imediato
 * (confirmacao de email desligada) ou no /auth/callback apos confirmar.
 */
export async function recordSignupConsents(supabase: SupabaseClient): Promise<void> {
  await supabase.from("consent_records").upsert(
    [
      { document_type: "terms", version: TERMS_VERSION },
      { document_type: "privacy", version: PRIVACY_VERSION },
    ],
    { onConflict: "user_id,document_type,version", ignoreDuplicates: true }
  );
}
