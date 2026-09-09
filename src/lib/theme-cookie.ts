import { cookies } from "next/headers";

const THEME_COOKIE = "theme";

/**
 * A preferencia de tema mora em profiles.theme (fonte da verdade), mas o
 * layout raiz precisa dela ANTES de saber quem e o usuario (evita flash de
 * tema errado). Espelhamos o valor num cookie leve, escrito toda vez que a
 * preferencia muda ou o usuario loga — nunca lido como fonte primaria.
 */
export async function setThemeCookie(theme: "light" | "dark" | "system"): Promise<void> {
  const cookieStore = await cookies();
  if (theme === "system") {
    cookieStore.delete(THEME_COOKIE);
  } else {
    cookieStore.set(THEME_COOKIE, theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
}
