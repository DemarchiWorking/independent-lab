import { describe, expect, it } from "vitest";
import {
  alvoMaisProximo,
  alvosProximos,
  distanciaCelulas,
  estaProximo,
  RAIO_INTERACAO,
  type AlvoProximidade,
} from "./proximidade";

/** Uma sala de bolso para os testes: o dono no centro, 3 NPCs ao redor. */
const NPCS: AlvoProximidade[] = [
  { id: "ia:documentador", cx: 3, cy: 2 }, // ortogonal, 1 tile
  { id: "ia:social-media", cx: 3, cy: 3 }, // diagonal, ~1.41 tiles
  { id: "ia:comercial", cx: 5, cy: 2 }, // 3 tiles — longe
];
const DONO = { cx: 2, cy: 2 };

describe("proximidade — distância", () => {
  it("distância de um ponto a ele mesmo é zero", () => {
    expect(distanciaCelulas(DONO, DONO)).toBe(0);
  });

  it("vizinho ortogonal está a exatamente 1 célula", () => {
    expect(distanciaCelulas({ cx: 2, cy: 2 }, { cx: 3, cy: 2 })).toBe(1);
    expect(distanciaCelulas({ cx: 2, cy: 2 }, { cx: 2, cy: 1 })).toBe(1);
  });

  it("vizinho diagonal está a √2 — e isso cabe no raio", () => {
    const d = distanciaCelulas({ cx: 2, cy: 2 }, { cx: 3, cy: 3 });
    expect(d).toBeCloseTo(Math.SQRT2, 10);
    expect(d).toBeLessThan(RAIO_INTERACAO);
  });

  it("é simétrica", () => {
    const a = { cx: 1, cy: 4 };
    const b = { cx: 6, cy: 2 };
    expect(distanciaCelulas(a, b)).toBe(distanciaCelulas(b, a));
  });

  it("aceita coordenada fracionária — o avatar anda entre células", () => {
    expect(distanciaCelulas({ cx: 2.5, cy: 2 }, { cx: 3, cy: 2 })).toBeCloseTo(0.5, 10);
  });
});

describe("proximidade — raio de conversa", () => {
  it("o raio cobre ortogonal e diagonal, mas não 2 tiles", () => {
    expect(RAIO_INTERACAO).toBeGreaterThan(Math.SQRT2);
    expect(RAIO_INTERACAO).toBeLessThan(2);
  });

  it("estaProximo é verdadeiro na fronteira exata (<=, não <)", () => {
    expect(estaProximo({ cx: 0, cy: 0 }, { cx: RAIO_INTERACAO, cy: 0 })).toBe(true);
    expect(estaProximo({ cx: 0, cy: 0 }, { cx: RAIO_INTERACAO + 0.001, cy: 0 })).toBe(
      false,
    );
  });

  it("acende só para quem está perto", () => {
    expect(alvosProximos(DONO, NPCS)).toEqual([
      "ia:documentador",
      "ia:social-media",
    ]);
  });

  it("apaga quando o dono se afasta", () => {
    expect(alvosProximos({ cx: 0, cy: 0 }, NPCS)).toEqual([]);
  });

  it("ordena do mais perto para o mais longe", () => {
    const perto = { id: "b", cx: 2, cy: 3 };
    const longe = { id: "a", cx: 3, cy: 3 };
    expect(alvosProximos(DONO, [longe, perto])).toEqual(["b", "a"]);
  });

  it("desempate por id é estável — o alvo não troca a cada frame", () => {
    const norte: AlvoProximidade = { id: "z", cx: 2, cy: 1 };
    const sul: AlvoProximidade = { id: "a", cx: 2, cy: 3 };
    expect(alvosProximos(DONO, [norte, sul])).toEqual(["a", "z"]);
    expect(alvosProximos(DONO, [sul, norte])).toEqual(["a", "z"]);
  });

  it("lista vazia não quebra", () => {
    expect(alvosProximos(DONO, [])).toEqual([]);
    expect(alvoMaisProximo(DONO, [])).toBeNull();
  });

  it("alvoMaisProximo devolve null quando ninguém está no raio", () => {
    expect(alvoMaisProximo({ cx: 7, cy: 7 }, NPCS)).toBeNull();
  });

  it("alvoMaisProximo devolve o primeiro de alvosProximos", () => {
    expect(alvoMaisProximo(DONO, NPCS)).toBe(alvosProximos(DONO, NPCS)[0]);
  });

  it("o raio é parametrizável — um raio maior alcança o NPC distante", () => {
    expect(alvosProximos(DONO, NPCS, 3)).toContain("ia:comercial");
  });

  it("durante o passo entre duas células o balão do destino já acende", () => {
    // dono caminhando de (1,2) para (2,2), a meio caminho
    expect(alvosProximos({ cx: 1.5, cy: 2 }, NPCS)).toContain("ia:documentador");
  });

  it("não muta a lista de alvos recebida", () => {
    const alvos = [...NPCS];
    alvosProximos(DONO, alvos);
    expect(alvos).toEqual(NPCS);
  });
});
