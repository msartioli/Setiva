import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchCurrenciesMock = vi.fn();
const fetchExchangeRateMock = vi.fn();
const fetchTaxasMock = vi.fn();
const fetchLatestSgsValueMock = vi.fn();
const fetchUsdPtaxMock = vi.fn();

vi.mock("../brasil-api/client", () => ({
  fetchCurrencies: () => fetchCurrenciesMock(),
  fetchExchangeRate: (currency: string, date: string) => fetchExchangeRateMock(currency, date),
  fetchTaxas: () => fetchTaxasMock(),
}));
vi.mock("../bcb/client", () => ({
  SGS_SERIES_SELIC: 1178,
  fetchLatestSgsValue: () => fetchLatestSgsValueMock(),
  fetchUsdPtax: (date: string) => fetchUsdPtaxMock(date),
}));

describe("getCurrencies", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchCurrenciesMock.mockReset();
  });

  it("mapeia moedas quando a BrasilAPI responde", async () => {
    fetchCurrenciesMock.mockResolvedValue({ ok: true, data: [{ simbolo: "USD", nome: "Dólar americano", tipo_moeda: "A" }] });
    const { getCurrencies } = await import("./service");
    expect(await getCurrencies()).toEqual([{ code: "USD", name: "Dólar americano" }]);
  });

  it("BrasilAPI offline sem cache previo retorna lista vazia, nunca lanca excecao", async () => {
    fetchCurrenciesMock.mockResolvedValue({ ok: false, error: "timeout" });
    const { getCurrencies } = await import("./service");
    await expect(getCurrencies()).resolves.toEqual([]);
  });
});

describe("getExchangeRate", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchExchangeRateMock.mockReset();
    fetchUsdPtaxMock.mockReset();
  });

  it("usa a cotacao de fechamento da BrasilAPI quando disponivel", async () => {
    fetchExchangeRateMock.mockResolvedValue({
      ok: true,
      data: {
        moeda: "USD",
        data: "2026-09-08",
        cotacoes: [
          { paridade_compra: 1, paridade_venda: 1, cotacao_compra: 5.08, cotacao_venda: 5.081, data_hora_cotacao: "x", tipo_boletim: "ABERTURA" },
          { paridade_compra: 1, paridade_venda: 1, cotacao_compra: 5.085, cotacao_venda: 5.0856, data_hora_cotacao: "x", tipo_boletim: "FECHAMENTO PTAX" },
        ],
      },
    });
    const { getExchangeRate } = await import("./service");
    const rate = await getExchangeRate("USD", "2026-09-08");
    expect(rate).toEqual({ currency: "USD", date: "2026-09-08", buy: 5.085, sell: 5.0856, source: "brasilapi" });
  });

  it("cai para o PTAX do BCB quando a BrasilAPI falha (so USD)", async () => {
    fetchExchangeRateMock.mockResolvedValue({ ok: false, error: "timeout" });
    fetchUsdPtaxMock.mockResolvedValue({ ok: true, data: { value: [{ cotacaoCompra: 5.08, cotacaoVenda: 5.081, dataHoraCotacao: "x" }] } });
    const { getExchangeRate } = await import("./service");
    const rate = await getExchangeRate("USD", "2026-09-08");
    expect(rate).toEqual({ currency: "USD", date: "2026-09-08", buy: 5.08, sell: 5.081, source: "bcb" });
  });

  it("sem BrasilAPI, sem PTAX e sem cache retorna null (nunca quebra a pagina)", async () => {
    fetchExchangeRateMock.mockResolvedValue({ ok: false, error: "timeout" });
    fetchUsdPtaxMock.mockResolvedValue({ ok: false, error: "timeout" });
    const { getExchangeRate } = await import("./service");
    expect(await getExchangeRate("USD", "2026-09-08")).toBeNull();
  });

  it("usa o ultimo valor em cache quando tudo falha na segunda chamada", async () => {
    const { getExchangeRate } = await import("./service");
    fetchExchangeRateMock.mockResolvedValueOnce({
      ok: true,
      data: { moeda: "EUR", data: "2026-09-08", cotacoes: [{ paridade_compra: 1, paridade_venda: 1, cotacao_compra: 6, cotacao_venda: 6.01, data_hora_cotacao: "x", tipo_boletim: "FECHAMENTO PTAX" }] },
    });
    await getExchangeRate("EUR", "2026-09-08");

    fetchExchangeRateMock.mockResolvedValueOnce({ ok: false, error: "timeout" });
    const cached = await getExchangeRate("EUR", "2026-09-08");
    expect(cached).toEqual({ currency: "EUR", date: "2026-09-08", buy: 6, sell: 6.01, source: "cache" });
  });
});

describe("getCurrentSelicRate", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchTaxasMock.mockReset();
    fetchLatestSgsValueMock.mockReset();
  });

  it("le a Selic do endpoint /taxas/v1 quando disponivel", async () => {
    fetchTaxasMock.mockResolvedValue({ ok: true, data: [{ nome: "Selic", valor: 14 }, { nome: "CDI", valor: 13.9 }] });
    const { getCurrentSelicRate } = await import("./service");
    const selic = await getCurrentSelicRate();
    expect(selic?.value).toBe(14);
    expect(selic?.source).toBe("brasilapi");
  });

  it("cai para o SGS do BCB quando /taxas/v1 falha", async () => {
    fetchTaxasMock.mockResolvedValue({ ok: false, error: "timeout" });
    fetchLatestSgsValueMock.mockResolvedValue({ ok: true, data: [{ data: "08/09/2026", valor: "13.90" }] });
    const { getCurrentSelicRate } = await import("./service");
    const selic = await getCurrentSelicRate();
    expect(selic).toEqual({ value: 13.9, date: "2026-09-08", source: "bcb" });
  });

  it("sem nenhuma fonte disponivel e sem cache retorna null", async () => {
    fetchTaxasMock.mockResolvedValue({ ok: false, error: "timeout" });
    fetchLatestSgsValueMock.mockResolvedValue({ ok: false, error: "timeout" });
    const { getCurrentSelicRate } = await import("./service");
    expect(await getCurrentSelicRate()).toBeNull();
  });
});
