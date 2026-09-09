/**
 * fetch server-side com timeout, parse seguro e log estruturado. Usado por
 * todo cliente de API externa (BrasilAPI, Banco Central) para que uma fonte
 * fora do ar nunca deixe a página carregando indefinidamente nem derrube o
 * app: quem chama sempre recebe um resultado tipado, nunca uma excecao.
 */
export type SafeFetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

const DEFAULT_TIMEOUT_MS = 5000;

export async function safeFetchJson<T>(
  url: string,
  options: {
    timeoutMs?: number;
    revalidateSeconds?: number | false;
    provider: string;
  }
): Promise<SafeFetchResult<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, revalidateSeconds, provider } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: revalidateSeconds === false ? undefined : { revalidate: revalidateSeconds ?? 86400 },
    });

    if (!response.ok) {
      console.error(`[financial-data][${provider}] http-${response.status} ${url}`);
      return { ok: false, error: `Fonte externa respondeu ${response.status}.` };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    console.error(`[financial-data][${provider}] ${isAbort ? "timeout" : "fetch-error"} ${url}`);
    return { ok: false, error: isAbort ? "Tempo esgotado ao consultar fonte externa." : "Falha ao consultar fonte externa." };
  } finally {
    clearTimeout(timer);
  }
}
