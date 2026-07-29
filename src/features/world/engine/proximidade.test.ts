import { describe, expect, it } from "vitest";
import {
  avataresProximos,
  cargoDoAvatar,
  distanciaEmCelulas,
  RAIO_INTERACAO,
  type AvatarNaSala,
} from "./proximidade";
import {
  celulaInicialAvatar,
  distribuirAvatares,
  geometriaSala,
} from "./sala";

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

describe("proximidade — encontro na entrada da sala", () => {
  /**
   * Trava a promessa da mecânica: quem entra na própria sede com pelo menos um
   * Funcionário de IA contratado já nasce ao alcance de alguém, então o painel
   * de interação aparece sem exigir o primeiro passo. Se `distribuirAvatares`
   * ou `celulaInicialAvatar` mudarem e afastarem o primeiro agente, este teste
   * quebra — é a única checagem automática desse encontro, porque a renderação
   * do painel depende do Pixi (não coberto por teste unitário).
   */
  function salaDeEntrada(nivel: number, quantosAgentes: number) {
    const geo = geometriaSala(nivel);
    const dono = celulaInicialAvatar(geo);
    const ocupadas = new Set([`${dono.cx},${dono.cy}`]);
    const posicoes = distribuirAvatares(geo, ocupadas, quantosAgentes);
    const avatares: AvatarNaSala[] = [
      { id: "dono", nome: "Você", ...dono },
      ...posicoes.map((p, i) => ({ id: `ia:${i}`, nome: `IA ${i}`, ...p })),
    ];
    return { dono, avatares };
  }

  it.each([1, 2, 3, 4])(
    "nível %i: o primeiro agente nasce ao alcance de quem entra",
    (nivel) => {
      const { dono, avatares } = salaDeEntrada(nivel, 1);
      expect(avataresProximos(dono, avatares, "dono")).toHaveLength(1);
    },
  );

  it("sem nenhum agente contratado não há com quem interagir", () => {
    const { dono, avatares } = salaDeEntrada(2, 0);
    expect(avataresProximos(dono, avatares, "dono")).toEqual([]);
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
