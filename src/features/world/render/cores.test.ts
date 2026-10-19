import { describe, expect, it } from "vitest";
import { color } from "@tokens";
import { CATALOGO_MOBILIA } from "@/features/sede/catalogo";
import { ajustarBrilho, CENARIO, hashTexto, hexNumero, peleDoId } from "./cores";

const canais = (cor: number) => [(cor >> 16) & 0xff, (cor >> 8) & 0xff, cor & 0xff];

describe("cores — ponte dos tokens para o Pixi", () => {
  it("converte #RRGGBB para número", () => {
    expect(hexNumero("#FF8000")).toBe(0xff8000);
  });

  it("brilho 1 devolve a mesma cor (a menos de arredondamento)", () => {
    const original = hexNumero(color.brand.teal);
    const [r, g, b] = canais(ajustarBrilho(original, 1));
    const [r0, g0, b0] = canais(original);
    expect(Math.abs(r - r0)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - g0)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - b0)).toBeLessThanOrEqual(1);
  });

  it("escurecer mantém o matiz: um laranja continua laranja, não vira marrom-acinzentado", () => {
    const [r, g, b] = canais(ajustarBrilho(hexNumero(color.brand.orange), 0.6));
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(r).toBeLessThan(canais(hexNumero(color.brand.orange))[0]);
  });

  it("clarear uma cor clara não estoura para branco puro", () => {
    const [r, g, b] = canais(ajustarBrilho(hexNumero(color.category.growth), 1.3));
    expect([r, g, b].some((c) => c < 250)).toBe(true);
  });

  it("brilho é monotônico: topo > direita > esquerda", () => {
    const luz = (cor: number) => canais(cor).reduce((a, b) => a + b, 0);
    const base = hexNumero(color.brand.coral);
    expect(luz(ajustarBrilho(base, 1))).toBeGreaterThan(luz(ajustarBrilho(base, 0.78)));
    expect(luz(ajustarBrilho(base, 0.78))).toBeGreaterThan(luz(ajustarBrilho(base, 0.58)));
  });

  it("cinza continua cinza (saturação zero não inventa matiz)", () => {
    const [r, g, b] = canais(ajustarBrilho(0x808080, 0.7));
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("o piso do cenário vem dos tokens, não de hex avulso", () => {
    expect(CENARIO.pisoClaro).toBe(hexNumero(color.world.pisoClaro));
    expect(CENARIO.paredeDireita).toBe(hexNumero(color.world.paredeDireita));
  });
});

describe("cores — tom de pele estável por boneco", () => {
  it("o mesmo id sempre dá o mesmo tom", () => {
    expect(peleDoId("ia:analista")).toBe(peleDoId("ia:analista"));
    expect(hashTexto("dono")).toBe(hashTexto("dono"));
  });

  it("o tom sai da paleta de tokens", () => {
    const paleta = color.world.pele.map(hexNumero);
    for (const id of ["dono", "visitante", "ia:a", "ia:b", "presenca:x"]) {
      expect(paleta).toContain(peleDoId(id));
    }
  });

  it("ids diferentes usam mais de um tom", () => {
    const tons = new Set(Array.from({ length: 30 }, (_, i) => peleDoId(`ia:${i}`)));
    expect(tons.size).toBeGreaterThan(1);
  });
});

describe("catálogo — forma de desenho", () => {
  it("todo item tem uma forma", () => {
    for (const item of CATALOGO_MOBILIA) expect(item.forma).toBeTruthy();
  });

  it("os itens que saíam com a forma errada agora têm a sua", () => {
    const formaDe = (id: string) => CATALOGO_MOBILIA.find((i) => i.id === id)?.forma;
    expect(formaDe("estacao-dupla")).toBe("estacao-dupla");
    expect(formaDe("quadro-metas")).toBe("quadro");
    expect(formaDe("estante-executiva")).toBe("estante");
  });

  it("nenhuma forma é compartilhada por itens diferentes", () => {
    const formas = CATALOGO_MOBILIA.map((i) => i.forma);
    expect(new Set(formas).size).toBe(formas.length);
  });
});
