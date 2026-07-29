import { describe, expect, it } from "vitest";
import {
  avataresProximos,
  cargoDoAvatar,
  distanciaEmCelulas,
  RAIO_INTERACAO,
  type AvatarNaSala,
} from "./proximidade";

const npcs: AvatarNaSala[] = [
  { id: "ia:comercial", nome: "Comercial IA", cx: 1, cy: 0 },
  { id: "ia:documentador", nome: "Documentador IA", cx: 5, cy: 5 },
  { id: "dono", nome: "Dono", cx: 1, cy: 1 },
];

describe("proximidade — distância (GH-WORLD-08)", () => {
  it("célula igual é distância zero", () => {
    expect(distanciaEmCelulas({ cx: 2, cy: 3 }, { cx: 2, cy: 3 })).toBe(0);
  });

  it("diagonal custa o mesmo que reta (Chebyshev)", () => {
    const origem = { cx: 0, cy: 0 };
    expect(distanciaEmCelulas(origem, { cx: 1, cy: 0 })).toBe(1); // reta
    expect(distanciaEmCelulas(origem, { cx: 1, cy: 1 })).toBe(1); // diagonal
  });

  it("é simétrica", () => {
    const a = { cx: 4, cy: 1 };
    const b = { cx: 0, cy: 3 };
    expect(distanciaEmCelulas(a, b)).toBe(distanciaEmCelulas(b, a));
  });
});

describe("proximidade — quem está perto", () => {
  it("acha só quem está dentro do raio", () => {
    const perto = avataresProximos({ cx: 0, cy: 0 }, npcs, "jogador");
    // comercial (1,0) e dono (1,1) estão ambos a distância 1; o documentador
    // em (5,5) fica de fora. Empate resolvido por id (desempate estável).
    expect(perto.map((p) => p.id)).toEqual(["dono", "ia:comercial"]);
  });

  it("nunca inclui o próprio jogador", () => {
    const perto = avataresProximos({ cx: 1, cy: 1 }, npcs, "dono");
    expect(perto.some((p) => p.id === "dono")).toBe(false);
  });

  it("ordena do mais perto para o mais longe", () => {
    const avatares: AvatarNaSala[] = [
      { id: "b", nome: "B", cx: 2, cy: 0 },
      { id: "a", nome: "A", cx: 1, cy: 0 },
    ];
    const perto = avataresProximos({ cx: 0, cy: 0 }, avatares, "x", 2);
    expect(perto.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("empate de distância tem ordem estável (senão os botões pulam na tela)", () => {
    const avatares: AvatarNaSala[] = [
      { id: "z", nome: "Z", cx: 1, cy: 0 },
      { id: "a", nome: "A", cx: 0, cy: 1 },
    ];
    const perto = avataresProximos({ cx: 0, cy: 0 }, avatares, "x");
    expect(perto.map((p) => p.id)).toEqual(["a", "z"]);
    // mesma entrada, mesma saída — sem depender da ordem do array
    expect(avataresProximos({ cx: 0, cy: 0 }, [...avatares].reverse(), "x").map((p) => p.id)).toEqual(
      ["a", "z"],
    );
  });

  it("longe de todo mundo devolve lista vazia", () => {
    expect(avataresProximos({ cx: 9, cy: 9 }, npcs, "jogador")).toEqual([]);
  });

  it("raio padrão é a célula adjacente", () => {
    expect(RAIO_INTERACAO).toBe(1);
  });
});

describe("proximidade — cargo do avatar", () => {
  it("extrai o cargo do id de agente", () => {
    expect(cargoDoAvatar("ia:comercial")).toBe("comercial");
  });

  it("devolve null para quem não é agente", () => {
    expect(cargoDoAvatar("dono")).toBeNull();
    expect(cargoDoAvatar("visitante")).toBeNull();
  });
});
