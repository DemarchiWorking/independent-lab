import { describe, expect, it } from "vitest";
import { classeTier, nomeArvoreTier, TIER_BG_CLASS, TIER_NOME_ARVORE } from "./tier";

describe("classeTier", () => {
  it("resolve a classe estática de cada degrau 1–5", () => {
    expect(classeTier(1)).toBe("bg-tier-1");
    expect(classeTier(3)).toBe("bg-tier-3");
    expect(classeTier(5)).toBe("bg-tier-5");
  });

  it("degrau fora de 1–5 cai no tier 1 (defensivo)", () => {
    expect(classeTier(0)).toBe(TIER_BG_CLASS[1]);
    expect(classeTier(6)).toBe(TIER_BG_CLASS[1]);
    expect(classeTier(-3)).toBe(TIER_BG_CLASS[1]);
  });
});

describe("nomeArvoreTier", () => {
  it("segue a metáfora de árvore semente→broto→raiz→tronco→copa", () => {
    expect(nomeArvoreTier(1)).toBe("Semente");
    expect(nomeArvoreTier(2)).toBe("Broto");
    expect(nomeArvoreTier(3)).toBe("Raiz");
    expect(nomeArvoreTier(4)).toBe("Tronco");
    expect(nomeArvoreTier(5)).toBe("Copa");
  });

  it("degrau fora de 1–5 cai no tier 1 (defensivo)", () => {
    expect(nomeArvoreTier(99)).toBe(TIER_NOME_ARVORE[1]);
  });
});
