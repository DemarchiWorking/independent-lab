import { describe, expect, it } from "vitest";
import {
  celulaNoPonto,
  gridParaTela,
  medidasDaSala,
  ordenarPorProfundidade,
  profundidade,
  telaParaGridExato,
  TILE_H,
  TILE_W,
} from "./iso";
import {
  capacidadeDeParede,
  celulaInicialAvatar,
  celulaParaSlot,
  celulasCaminhaveis,
  celulasDeSlot,
  dentroDaSala,
  distribuirAvatares,
  geometriaSala,
  slotParaCelula,
} from "./sala";
import { acharCaminho, bloqueiosDeMobilia, chaveCelula } from "./caminho";
import { NIVEIS_SEDE } from "@/features/sede/niveis";

describe("iso — projeção isométrica", () => {
  it("a origem do grid cai na origem da tela", () => {
    expect(gridParaTela(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it("cx cresce para a direita-baixo e cy para a esquerda-baixo", () => {
    expect(gridParaTela(1, 0)).toEqual({ x: TILE_W / 2, y: TILE_H / 2 });
    expect(gridParaTela(0, 1)).toEqual({ x: -TILE_W / 2, y: TILE_H / 2 });
  });

  it("a razão é 2:1 — andar 1 tile move o dobro em x que em y", () => {
    const p = gridParaTela(1, 0);
    expect(Math.abs(p.x)).toBe(Math.abs(p.y) * 2);
  });

  // A propriedade que sustenta o "clicar no chão para andar": projetar e
  // despropjetar tem que devolver exatamente a mesma célula.
  it.each([
    [0, 0],
    [3, 0],
    [0, 3],
    [2, 5],
    [7, 7],
  ])("round-trip grid→tela→grid preserva a célula (%i, %i)", (cx, cy) => {
    const { x, y } = gridParaTela(cx, cy);
    expect(celulaNoPonto(x, y)).toEqual({ cx, cy });
  });

  it("um ponto no meio de um tile resolve para aquele tile", () => {
    const centro = gridParaTela(2, 3);
    // desloca um quarto de tile — ainda dentro do losango
    expect(celulaNoPonto(centro.x + TILE_W / 8, centro.y + TILE_H / 8)).toEqual({
      cx: 2,
      cy: 3,
    });
  });

  it("telaParaGridExato devolve fracionário (sem arredondar)", () => {
    const meio = telaParaGridExato(0, TILE_H / 2);
    expect(meio.cx).toBeCloseTo(0.5);
    expect(meio.cy).toBeCloseTo(0.5);
  });
});

describe("iso — profundidade (painter's algorithm)", () => {
  it("quem está mais à frente tem profundidade maior", () => {
    expect(profundidade(3, 3)).toBeGreaterThan(profundidade(0, 0));
  });

  it("células na mesma diagonal empatam", () => {
    expect(profundidade(2, 1)).toBe(profundidade(1, 2));
  });

  it("ordena do fundo para a frente", () => {
    const ordenado = ordenarPorProfundidade([
      { cx: 5, cy: 5, id: "frente" },
      { cx: 0, cy: 0, id: "fundo" },
      { cx: 2, cy: 1, id: "meio" },
    ]);
    expect(ordenado.map((e) => e.id)).toEqual(["fundo", "meio", "frente"]);
  });

  it("não muta o array de entrada", () => {
    const original = [
      { cx: 9, cy: 9 },
      { cx: 0, cy: 0 },
    ];
    ordenarPorProfundidade(original);
    expect(original[0]).toEqual({ cx: 9, cy: 9 });
  });
});

describe("iso — medidas da sala", () => {
  it("o offsetX empurra o tile mais à esquerda para x >= 0", () => {
    const geo = geometriaSala(4);
    const m = medidasDaSala(geo.cols, geo.rows);
    // o tile mais à esquerda da sala é (0, rows-1)
    const maisEsquerda = gridParaTela(0, geo.rows - 1);
    expect(maisEsquerda.x + m.offsetX).toBeGreaterThanOrEqual(0);
  });

  // Regressão: o canvas era dimensionado só na montagem, então evoluir a sede
  // aumentava a sala mas não o canvas, e a cena era recortada. Estes testes
  // travam a relação "cada nível precisa de um canvas maior que o anterior".
  it.each(Object.keys(NIVEIS_SEDE).map(Number))(
    "nível %i: toda a sala cabe dentro das medidas calculadas",
    (nivel) => {
      const geo = geometriaSala(nivel);
      const m = medidasDaSala(geo.cols, geo.rows);
      for (let cx = 0; cx < geo.cols; cx++) {
        for (let cy = 0; cy < geo.rows; cy++) {
          const p = gridParaTela(cx, cy);
          expect(p.x + m.offsetX).toBeGreaterThanOrEqual(0);
          expect(p.x + m.offsetX).toBeLessThanOrEqual(m.largura);
          expect(p.y).toBeLessThanOrEqual(m.altura);
        }
      }
    },
  );

  it("sala maior exige canvas maior — nível a nível", () => {
    const niveis = Object.keys(NIVEIS_SEDE).map(Number).sort((a, b) => a - b);
    let anterior = 0;
    for (const nivel of niveis) {
      const geo = geometriaSala(nivel);
      const { largura } = medidasDaSala(geo.cols, geo.rows);
      expect(largura).toBeGreaterThanOrEqual(anterior);
      anterior = largura;
    }
  });
});

describe("sala — geometria e mapeamento slot ↔ célula", () => {
  // Invariante de game design: se alguém adicionar um nível com mais slots do
  // que cabe nas paredes do fundo, este teste quebra ANTES de virar bug visual.
  it.each(Object.keys(NIVEIS_SEDE).map(Number))(
    "nível %i: as paredes do fundo comportam todos os slots",
    (nivel) => {
      const geo = geometriaSala(nivel);
      expect(capacidadeDeParede(geo)).toBeGreaterThanOrEqual(geo.slots);
    },
  );

  it.each(Object.keys(NIVEIS_SEDE).map(Number))(
    "nível %i: todo slot válido mapeia para uma célula dentro da sala",
    (nivel) => {
      const geo = geometriaSala(nivel);
      for (let slot = 0; slot < geo.slots; slot++) {
        const celula = slotParaCelula(slot, geo);
        expect(celula).not.toBeNull();
        expect(dentroDaSala(celula!.cx, celula!.cy, geo)).toBe(true);
      }
    },
  );

  it("slots fora da faixa do nível não têm célula", () => {
    const geo = geometriaSala(1); // 3 slots
    expect(slotParaCelula(3, geo)).toBeNull();
    expect(slotParaCelula(-1, geo)).toBeNull();
    expect(slotParaCelula(1.5, geo)).toBeNull();
  });

  it("slot ↔ célula é uma bijeção (ida e volta)", () => {
    const geo = geometriaSala(3);
    for (let slot = 0; slot < geo.slots; slot++) {
      const c = slotParaCelula(slot, geo)!;
      expect(celulaParaSlot(c.cx, c.cy, geo)).toBe(slot);
    }
  });

  it("célula do miolo da sala não é slot de mobília", () => {
    const geo = geometriaSala(3);
    expect(celulaParaSlot(2, 2, geo)).toBeNull();
  });

  // Regressão: `slot` é DADO PERSISTIDO. Se esta ordem mudar, a mobília de
  // todos os tenants existentes se reposiciona sozinha.
  it("a ordem dos slots é estável: fundo-direita e depois fundo-esquerda", () => {
    const geo = geometriaSala(2); // 5x5
    const celulas = celulasDeSlot(geo);
    expect(celulas.slice(0, 5)).toEqual([
      { cx: 0, cy: 0 },
      { cx: 1, cy: 0 },
      { cx: 2, cy: 0 },
      { cx: 3, cy: 0 },
      { cx: 4, cy: 0 },
    ]);
    expect(celulas[5]).toEqual({ cx: 0, cy: 1 });
  });

  it("o avatar nasce no miolo, nunca em cima de um slot", () => {
    for (const nivel of Object.keys(NIVEIS_SEDE).map(Number)) {
      const geo = geometriaSala(nivel);
      const inicio = celulaInicialAvatar(geo);
      expect(dentroDaSala(inicio.cx, inicio.cy, geo)).toBe(true);
      expect(celulaParaSlot(inicio.cx, inicio.cy, geo)).toBeNull();
    }
  });

  it("dentroDaSala rejeita fora dos limites", () => {
    const geo = geometriaSala(1); // 4x4
    expect(dentroDaSala(0, 0, geo)).toBe(true);
    expect(dentroDaSala(3, 3, geo)).toBe(true);
    expect(dentroDaSala(4, 0, geo)).toBe(false);
    expect(dentroDaSala(-1, 0, geo)).toBe(false);
  });
});

describe("sala — posicionamento de avatares", () => {
  const geo = geometriaSala(3); // 6x6

  it("células caminháveis excluem as ocupadas por mobília", () => {
    const bloqueadas = bloqueiosDeMobilia([
      { cx: 0, cy: 0 },
      { cx: 1, cy: 0 },
    ]);
    const livres = celulasCaminhaveis(geo, bloqueadas);
    expect(livres).toHaveLength(geo.cols * geo.rows - 2);
    expect(livres).not.toContainEqual({ cx: 0, cy: 0 });
    expect(livres).not.toContainEqual({ cx: 1, cy: 0 });
  });

  it("nunca posiciona um avatar em cima de um móvel", () => {
    const bloqueadas = bloqueiosDeMobilia(
      celulasDeSlot(geo).slice(0, geo.slots),
    );
    const posicoes = distribuirAvatares(geo, bloqueadas, 4);
    expect(posicoes).toHaveLength(4);
    for (const p of posicoes) {
      expect(bloqueadas.has(chaveCelula(p.cx, p.cy))).toBe(false);
      expect(dentroDaSala(p.cx, p.cy, geo)).toBe(true);
    }
  });

  it("é determinístico — mesma entrada, mesmas posições", () => {
    const bloqueadas = bloqueiosDeMobilia([{ cx: 0, cy: 0 }]);
    expect(distribuirAvatares(geo, bloqueadas, 3)).toEqual(
      distribuirAvatares(geo, bloqueadas, 3),
    );
  });

  it("pedir zero avatares devolve lista vazia", () => {
    expect(distribuirAvatares(geo, new Set(), 0)).toEqual([]);
  });

  it("aguenta pedir mais avatares do que células livres", () => {
    const posicoes = distribuirAvatares(geo, new Set(), 500);
    expect(posicoes).toHaveLength(500);
    for (const p of posicoes) {
      expect(dentroDaSala(p.cx, p.cy, geo)).toBe(true);
    }
  });

  // Regressão pega em runtime inspecionando o scene graph: o dono nasce no
  // centro e o primeiro Funcionário de IA caía exatamente na mesma célula,
  // deixando dois bonecos sobrepostos na sala.
  it("não empilha avatares: as células escolhidas são distintas", () => {
    const posicoes = distribuirAvatares(geo, new Set(), 6);
    const unicas = new Set(posicoes.map((p) => chaveCelula(p.cx, p.cy)));
    expect(unicas.size).toBe(posicoes.length);
  });

  it("respeita a célula do dono passada como bloqueada", () => {
    const dono = celulaInicialAvatar(geo);
    const bloqueadas = new Set([chaveCelula(dono.cx, dono.cy)]);
    const posicoes = distribuirAvatares(geo, bloqueadas, 4);
    for (const p of posicoes) {
      expect(chaveCelula(p.cx, p.cy)).not.toBe(chaveCelula(dono.cx, dono.cy));
    }
  });
});

describe("caminho — pathfinding do avatar", () => {
  const geo = geometriaSala(3); // 6x6

  it("caminho para a própria célula é só ela", () => {
    const c = acharCaminho({ cx: 2, cy: 2 }, { cx: 2, cy: 2 }, {
      geo,
      bloqueadas: new Set(),
    });
    expect(c).toEqual([{ cx: 2, cy: 2 }]);
  });

  it("em sala vazia anda a distância de Manhattan (menor caminho)", () => {
    const c = acharCaminho({ cx: 1, cy: 1 }, { cx: 4, cy: 3 }, {
      geo,
      bloqueadas: new Set(),
    })!;
    expect(c).not.toBeNull();
    // |4-1| + |3-1| = 5 passos → 6 células incluindo as pontas
    expect(c).toHaveLength(6);
    expect(c[0]).toEqual({ cx: 1, cy: 1 });
    expect(c[c.length - 1]).toEqual({ cx: 4, cy: 3 });
  });

  it("o caminho é contíguo — cada passo move exatamente 1 tile ortogonal", () => {
    const c = acharCaminho({ cx: 0, cy: 5 }, { cx: 5, cy: 0 }, {
      geo,
      bloqueadas: new Set(),
    })!;
    for (let i = 1; i < c.length; i++) {
      const d = Math.abs(c[i].cx - c[i - 1].cx) + Math.abs(c[i].cy - c[i - 1].cy);
      expect(d).toBe(1);
    }
  });

  it("desvia de mobília em vez de atravessar", () => {
    // parede de móveis em cx=2, deixando passagem só em cy=5
    const bloqueadas = bloqueiosDeMobilia([
      { cx: 2, cy: 0 },
      { cx: 2, cy: 1 },
      { cx: 2, cy: 2 },
      { cx: 2, cy: 3 },
      { cx: 2, cy: 4 },
    ]);
    const c = acharCaminho({ cx: 1, cy: 1 }, { cx: 3, cy: 1 }, { geo, bloqueadas })!;
    expect(c).not.toBeNull();
    // nenhuma célula do caminho pode estar bloqueada
    for (const p of c) {
      expect(bloqueadas.has(chaveCelula(p.cx, p.cy))).toBe(false);
    }
    // teve que dar a volta pela única passagem
    expect(c.some((p) => p.cy === 5)).toBe(true);
  });

  it("não anda para cima de um móvel (destino bloqueado)", () => {
    const bloqueadas = bloqueiosDeMobilia([{ cx: 3, cy: 3 }]);
    expect(
      acharCaminho({ cx: 1, cy: 1 }, { cx: 3, cy: 3 }, { geo, bloqueadas }),
    ).toBeNull();
  });

  it("devolve null quando o destino está cercado", () => {
    const bloqueadas = bloqueiosDeMobilia([
      { cx: 4, cy: 3 },
      { cx: 2, cy: 3 },
      { cx: 3, cy: 4 },
      { cx: 3, cy: 2 },
    ]);
    expect(
      acharCaminho({ cx: 0, cy: 0 }, { cx: 3, cy: 3 }, { geo, bloqueadas }),
    ).toBeNull();
  });

  it("devolve null para destino fora da sala", () => {
    expect(
      acharCaminho({ cx: 0, cy: 0 }, { cx: 99, cy: 0 }, { geo, bloqueadas: new Set() }),
    ).toBeNull();
  });

  it("devolve null para origem fora da sala", () => {
    expect(
      acharCaminho({ cx: -1, cy: 0 }, { cx: 1, cy: 1 }, { geo, bloqueadas: new Set() }),
    ).toBeNull();
  });
});
