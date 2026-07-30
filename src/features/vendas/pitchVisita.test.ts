import { describe, expect, it } from "vitest";
import { escolherPitch } from "./pitchVisita";
import type { Atributos, Negocio } from "@/lib/db/types";

function negocio(atributos: Partial<Record<keyof Atributos, number>>): Negocio {
  const base: Atributos = {
    tecnologia: { valor: 20, teto: 40 },
    processo: { valor: 20, teto: 40 },
    presenca: { valor: 20, teto: 40 },
    aquisicao: { valor: 20, teto: 40 },
    capacidade: { valor: 20, teto: 40 },
  };
  for (const [chave, valor] of Object.entries(atributos)) {
    base[chave as keyof Atributos] = { ...base[chave as keyof Atributos], valor: valor! };
  }
  return {
    id: "t1",
    nome: "Padaria Teste",
    segmento: "comercio",
    endereco: { cidadeSlug: "resende", bairroSlug: "centro", quarteiraoId: "q1", lote: 1 },
    criadoEm: "2026-01-01T00:00:00.000Z",
    degrauAtual: 2,
    degrauAlvo: 3,
    nivel: 2,
    xp: 500,
    moedaVirtual: 1000,
    atributos: base,
    consentimentoLgpdEm: "2026-01-01T00:00:00.000Z",
  };
}

describe("escolherPitch", () => {
  it("processo mais fraco → documentador", () => {
    expect(escolherPitch(negocio({ processo: 5 })).cargoId).toBe("documentador");
  });

  it("presenca mais fraco → social-media", () => {
    expect(escolherPitch(negocio({ presenca: 5 })).cargoId).toBe("social-media");
  });

  it("aquisicao mais fraco → comercial", () => {
    expect(escolherPitch(negocio({ aquisicao: 5 })).cargoId).toBe("comercial");
  });

  it("tecnologia mais fraco → cai no fallback comercial (nenhum cargo cobre esse eixo)", () => {
    expect(escolherPitch(negocio({ tecnologia: 1 })).cargoId).toBe("comercial");
  });

  it("capacidade mais fraco → cai no fallback comercial (nenhum cargo cobre esse eixo)", () => {
    expect(escolherPitch(negocio({ capacidade: 1 })).cargoId).toBe("comercial");
  });

  it("cada pitch tem headline, corpo e ctaLabel não vazios", () => {
    const p = escolherPitch(negocio({ processo: 5 }));
    expect(p.headline.length).toBeGreaterThan(0);
    expect(p.corpo.length).toBeGreaterThan(0);
    expect(p.ctaLabel.length).toBeGreaterThan(0);
  });
});
