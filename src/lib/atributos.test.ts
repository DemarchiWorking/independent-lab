import { describe, expect, it } from "vitest";
import {
  aplicarGanhos,
  atributosVazios,
  somarAtributo,
  TETO_ATRIBUTO,
} from "./atributos";

describe("somarAtributo (clamp puro)", () => {
  it("soma um ganho normal dentro do intervalo", () => {
    const r = somarAtributo({ valor: 10, teto: 40 }, 5);
    expect(r).toEqual({ valor: 15, teto: 40 });
  });

  it("nunca ultrapassa o teto — borda exata", () => {
    const r = somarAtributo({ valor: 38, teto: 40 }, 2);
    expect(r.valor).toBe(40);
  });

  it("nunca ultrapassa o teto — ganho muito acima do restante", () => {
    const r = somarAtributo({ valor: 38, teto: 40 }, 1000);
    expect(r.valor).toBe(40);
  });

  it("nunca fica negativo — borda exata", () => {
    const r = somarAtributo({ valor: 3, teto: 40 }, -3);
    expect(r.valor).toBe(0);
  });

  it("nunca fica negativo — perda muito acima do valor atual", () => {
    const r = somarAtributo({ valor: 3, teto: 40 }, -1000);
    expect(r.valor).toBe(0);
  });

  it("é pura: não muta o valor de entrada", () => {
    const entrada = { valor: 10, teto: 40 };
    somarAtributo(entrada, 5);
    expect(entrada).toEqual({ valor: 10, teto: 40 });
  });

  it("preserva o teto do atributo original", () => {
    const r = somarAtributo({ valor: 5, teto: 100 }, 3);
    expect(r.teto).toBe(100);
  });
});

describe("atributosVazios", () => {
  it("cria os 5 eixos zerados com o teto padrão", () => {
    const a = atributosVazios();
    expect(Object.keys(a).sort()).toEqual(
      ["aquisicao", "capacidade", "presenca", "processo", "tecnologia"].sort(),
    );
    for (const chave of Object.keys(a) as Array<keyof typeof a>) {
      expect(a[chave]).toEqual({ valor: 0, teto: TETO_ATRIBUTO });
    }
  });
});

describe("aplicarGanhos", () => {
  it("aplica ganho só nos eixos informados, mantendo os demais intactos", () => {
    const base = atributosVazios();
    const r = aplicarGanhos(base, { tecnologia: 5, presenca: 2 });
    expect(r.tecnologia.valor).toBe(5);
    expect(r.presenca.valor).toBe(2);
    expect(r.processo.valor).toBe(0);
    expect(r.aquisicao.valor).toBe(0);
    expect(r.capacidade.valor).toBe(0);
  });

  it("ignora ganho zero (não gera objeto novo desnecessário)", () => {
    const base = atributosVazios();
    const r = aplicarGanhos(base, { tecnologia: 0 });
    expect(r.tecnologia).toBe(base.tecnologia); // mesma referência: no-op real
  });

  it("é pura: não muta o objeto de entrada", () => {
    const base = atributosVazios();
    aplicarGanhos(base, { tecnologia: 10 });
    expect(base.tecnologia.valor).toBe(0);
  });

  it("clampa cada eixo independentemente no teto", () => {
    const base = atributosVazios();
    const r = aplicarGanhos(base, { tecnologia: 1000 });
    expect(r.tecnologia.valor).toBe(TETO_ATRIBUTO);
  });
});
