import { describe, expect, it } from "vitest";
import {
  aplicarGanhos,
  atendeRequisitos,
  atributosFaltantes,
  atributosVazios,
  mensagemRequisito,
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

describe("atributosFaltantes (GH-ATR-03)", () => {
  it("requisito vazio nunca gera faltante", () => {
    const atuais = aplicarGanhos(atributosVazios(), { tecnologia: 5 });
    expect(atributosFaltantes(atuais, {})).toEqual([]);
  });

  it("todos os eixos acima do mínimo: nenhum faltante", () => {
    const atuais = aplicarGanhos(atributosVazios(), {
      tecnologia: 20,
      processo: 20,
    });
    expect(atributosFaltantes(atuais, { tecnologia: 8, processo: 10 })).toEqual([]);
  });

  it("borda exata: atual === minimo atende o requisito", () => {
    const atuais = aplicarGanhos(atributosVazios(), { tecnologia: 8 });
    expect(atributosFaltantes(atuais, { tecnologia: 8 })).toEqual([]);
  });

  it("um eixo abaixo do mínimo aparece com o quanto falta", () => {
    const atuais = aplicarGanhos(atributosVazios(), { tecnologia: 5 });
    const faltantes = atributosFaltantes(atuais, { tecnologia: 8 });
    expect(faltantes).toEqual([
      { chave: "tecnologia", label: "Tecnologia", atual: 5, minimo: 8, falta: 3 },
    ]);
  });

  it("dois eixos abaixo do mínimo aparecem na ordem canônica de ATRIBUTO_CHAVES", () => {
    const atuais = aplicarGanhos(atributosVazios(), { presenca: 2, tecnologia: 5 });
    const faltantes = atributosFaltantes(atuais, { presenca: 10, tecnologia: 8 });
    // ordem canônica: tecnologia, processo, presenca, aquisicao, capacidade
    expect(faltantes.map((f) => f.chave)).toEqual(["tecnologia", "presenca"]);
  });

  it("eixo fora do requisito nunca aparece, mesmo valendo 0", () => {
    const atuais = atributosVazios(); // tudo zerado
    const faltantes = atributosFaltantes(atuais, { tecnologia: 8 });
    expect(faltantes.map((f) => f.chave)).toEqual(["tecnologia"]);
  });

  it("mínimo 0 é ignorado (não vira faltante)", () => {
    const atuais = atributosVazios();
    expect(atributosFaltantes(atuais, { tecnologia: 0 })).toEqual([]);
  });

  it("mínimo negativo é ignorado (não vira faltante)", () => {
    const atuais = atributosVazios();
    expect(atributosFaltantes(atuais, { tecnologia: -5 })).toEqual([]);
  });

  it("é pura: não muta os atributos de entrada", () => {
    const atuais = aplicarGanhos(atributosVazios(), { tecnologia: 5 });
    const copia = JSON.parse(JSON.stringify(atuais));
    atributosFaltantes(atuais, { tecnologia: 8, processo: 3 });
    expect(atuais).toEqual(copia);
  });
});

describe("atendeRequisitos", () => {
  it("true quando não há faltantes", () => {
    const atuais = aplicarGanhos(atributosVazios(), { tecnologia: 8 });
    expect(atendeRequisitos(atuais, { tecnologia: 8 })).toBe(true);
  });

  it("false quando há ao menos um faltante", () => {
    const atuais = atributosVazios();
    expect(atendeRequisitos(atuais, { tecnologia: 8 })).toBe(false);
  });
});

describe("mensagemRequisito", () => {
  it("string vazia quando não há faltantes", () => {
    expect(mensagemRequisito([])).toBe("");
  });

  it("um eixo faltante", () => {
    const atuais = atributosVazios();
    const faltantes = atributosFaltantes(atuais, { tecnologia: 8 });
    expect(mensagemRequisito(faltantes)).toBe("Requisito não atendido: Tecnologia 0/8.");
  });

  it("dois eixos faltantes, separados por vírgula", () => {
    const atuais = atributosVazios();
    const faltantes = atributosFaltantes(atuais, { tecnologia: 20, capacidade: 12 });
    expect(mensagemRequisito(faltantes)).toBe(
      "Requisito não atendido: Tecnologia 0/20, Capacidade 0/12.",
    );
  });
});
