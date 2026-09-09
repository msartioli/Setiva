import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchBanksListMock = vi.fn();
vi.mock("../brasil-api/client", () => ({
  fetchBanksList: () => fetchBanksListMock(),
}));

describe("getFinancialInstitutions", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchBanksListMock.mockReset();
  });

  it("funciona mesmo com a BrasilAPI fora do ar (so logos-bancos-br)", async () => {
    fetchBanksListMock.mockResolvedValue({ ok: false, error: "timeout" });
    const { getFinancialInstitutions } = await import("./service");
    const list = await getFinancialInstitutions();
    expect(list.length).toBeGreaterThan(500); // dataset local tem mais de mil instituicoes
    expect(list.some((i) => i.ispb === "18236120")).toBe(true); // Nubank via logos-bancos-br
  });

  it("nao duplica instituicao que a BrasilAPI tambem retorna com o mesmo ISPB", async () => {
    fetchBanksListMock.mockResolvedValue({
      ok: true,
      data: [{ ispb: "18236120", name: "NU PAGAMENTOS", code: 260, fullName: "Nu Pagamentos S.A." }],
    });
    const { getFinancialInstitutions } = await import("./service");
    const list = await getFinancialInstitutions();
    const nubankEntries = list.filter((i) => i.ispb === "18236120");
    expect(nubankEntries).toHaveLength(1);
    // logos-bancos-br vence quando o ISPB ja existe (fonte curada de logo)
    expect(nubankEntries[0].source).toBe("logos-bancos-br");
  });

  it("resolve instituicao por ISPB direto do dataset local", async () => {
    fetchBanksListMock.mockResolvedValue({ ok: false, error: "timeout" });
    const { getFinancialInstitutionByIspb } = await import("./service");
    const itau = await getFinancialInstitutionByIspb("60701190");
    expect(itau?.compe).toBe("341");
  });

  it("ISPB invalido retorna null em vez de lancar excecao", async () => {
    const { getFinancialInstitutionByIspb } = await import("./service");
    expect(await getFinancialInstitutionByIspb("abc")).toBeNull();
  });
});
