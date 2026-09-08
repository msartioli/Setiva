import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Cada chamada le os cookies da requisicao atual — nunca reutilizar uma
 * instancia entre requisicoes/usuarios diferentes.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado a partir de um Server Component sem permissao de
            // escrever cookies (renderizacao). O proxy.ts ja garante que a
            // sessao e atualizada antes de chegar aqui.
          }
        },
      },
    }
  );
}

/**
 * Busca o usuario autenticado validando o JWT contra o servidor Auth
 * (nunca confiar apenas em getSession, que so le o cookie local).
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}
