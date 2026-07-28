import { describe, expect, it } from "vitest";
import {
  bonusDoUpgrade,
  bonusTotalNoNivel,
  custoUpgradeMobilia,
  NIVEL_MAX_MOBILIA,
  podeEvoluirMobilia,
} from "./upgrade";
import { CATALOGO_MOBILIA, itemMobilia } from "./catalogo";

const mesa = itemMobilia("mesa-trabalho")!; // preco 400, bonus { processo: 1 }
const estante = itemMobilia("estante-executiva")!; // bonus { presenca: 1, processo: 1 }

describe("upgrade de equipamento — custo (GH-WORLD-07)", () => {
  it("custo escala com o nível de destino", () => {
    expect(custoUpgradeMobilia(mesa, 2)).toBe(800);
    expect(custoUpgradeMobilia(mesa, 3)).toBe(1200);
  });

  it("evoluir nunca é mais barato que comprar o item de novo", () => {
    for (const item of CATALOGO_MOBILIA) {
      expect(custoUpgradeMobilia(item, 2)).toBeGreaterThan(item.preco);
    }
  });
});

describe("upgrade de equipamento — bônus", () => {
  it("cada upgrade aplica exatamente o bônus base", () => {
    expect(bonusDoUpgrade(mesa)).toEqual({ processo: 1 });
    expect(bonusDoUpgrade(estante)).toEqual({ presenca: 1, processo: 1 });
  });

  it("bônus total no nível N é base × N, em todos os eixos do item", () => {
    expect(bonusTotalNoNivel(estante, 3)).toEqual({ presenca: 3, processo: 3 });
  });

  it("bônus total no nível 1 é o próprio bônus base", () => {
    expect(bonusTotalNoNivel(mesa, 1)).toEqual(mesa.bonus);
  });

  it("bonusDoUpgrade devolve cópia — mutar o resultado não corrompe o catálogo", () => {
    const b = bonusDoUpgrade(mesa) as { processo: number };
    b.processo = 999;
    expect(itemMobilia("mesa-trabalho")!.bonus.processo).toBe(1);
  });
});

describe("upgrade de equipamento — teto", () => {
  it("permite evoluir abaixo do teto e barra no teto", () => {
    expect(podeEvoluirMobilia(1)).toBe(true);
    expect(podeEvoluirMobilia(NIVEL_MAX_MOBILIA - 1)).toBe(true);
    expect(podeEvoluirMobilia(NIVEL_MAX_MOBILIA)).toBe(false);
  });
});
