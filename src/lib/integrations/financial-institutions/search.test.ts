import { describe, expect, it } from "vitest";
import { getPopularInstitutions, searchInstitutions } from "./search";
import type { FinancialInstitution } from "./types";

function inst(overrides: Partial<FinancialInstitution>): FinancialInstitution {
  return {
    id: "00000000",
    ispb: "00000000",
    compe: null,
    name: "Instituição Teste",
    shortName: "Teste",
    logoUrl: null,
    pixParticipant: false,
    source: "logos-bancos-br",
    ...overrides,
  };
}

const nubank = inst({ id: "18236120", ispb: "18236120", compe: "260", name: "NU PAGAMENTOS S.A.", shortName: "NU PAGAMENTOS - IP" });
const itau = inst({ id: "60701190", ispb: "60701190", compe: "341", name: "ITAÚ UNIBANCO S.A.", shortName: "ITAÚ UNIBANCO S.A." });
const bb = inst({ id: "00000001", ispb: "00000001", compe: "001", name: "Banco do Brasil S.A.", shortName: "BCO DO BRASIL S.A." });
const list = [nubank, itau, bb];

describe("searchInstitutions", () => {
  it("busca 'Nubank' encontra via apelido curado (nome oficial e 'NU PAGAMENTOS')", () => {
    const results = searchInstitutions(list, "Nubank");
    expect(results.map((r) => r.ispb)).toEqual([nubank.ispb]);
  });

  it("busca 'nu' encontra Nubank pelo apelido curado", () => {
    const results = searchInstitutions(list, "nu");
    expect(results.map((r) => r.ispb)).toContain(nubank.ispb);
  });

  it("busca 'Itaú' sem acento (digitado 'itau') encontra o banco", () => {
    const results = searchInstitutions(list, "itau");
    expect(results.map((r) => r.ispb)).toEqual([itau.ispb]);
  });

  it("busca por COMPE encontra o banco certo", () => {
    const results = searchInstitutions(list, "341");
    expect(results.map((r) => r.ispb)).toEqual([itau.ispb]);
  });

  it("busca por ISPB encontra o banco certo", () => {
    const results = searchInstitutions(list, "18236120");
    expect(results.map((r) => r.ispb)).toEqual([nubank.ispb]);
  });

  it("busca vazia retorna a lista inteira", () => {
    expect(searchInstitutions(list, "")).toEqual(list);
  });

  it("busca sem correspondencia retorna lista vazia", () => {
    expect(searchInstitutions(list, "banco que nao existe")).toEqual([]);
  });
});

describe("getPopularInstitutions", () => {
  it("mantem a ordem curada e ignora quem nao esta na lista", () => {
    const popular = getPopularInstitutions(list);
    expect(popular[0].ispb).toBe(nubank.ispb);
    expect(popular[1].ispb).toBe(itau.ispb);
    expect(popular.some((p) => p.ispb === bb.ispb)).toBe(false); // bb aqui tem ISPB fake, nao esta na curadoria real
  });
});
