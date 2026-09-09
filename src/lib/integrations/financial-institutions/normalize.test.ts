import { describe, expect, it } from "vitest";
import { digitsOnly, normalizeSearchText } from "./normalize";

describe("normalizeSearchText", () => {
  it("remove acentos", () => {
    expect(normalizeSearchText("Itaú")).toBe("itau");
  });

  it("vira minusculo", () => {
    expect(normalizeSearchText("NUBANK")).toBe("nubank");
  });

  it("tira espaco das pontas e colapsa espacos duplicados", () => {
    expect(normalizeSearchText("  Banco   do Brasil  ")).toBe("banco do brasil");
  });
});

describe("digitsOnly", () => {
  it("remove pontuacao de ISPB/COMPE", () => {
    expect(digitsOnly("60.701.190")).toBe("60701190");
    expect(digitsOnly("341")).toBe("341");
    expect(digitsOnly("00.000.000")).toBe("00000000");
  });
});
