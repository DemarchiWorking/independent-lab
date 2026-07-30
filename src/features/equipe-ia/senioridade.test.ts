import { describe, expect, it } from "vitest";
import { CARGOS_IA, cargoPorId } from "./catalogo";
import {
  habilidadesLiberadas,
  ordemDoNivel,
  senioridadeDe,
  type NivelSenioridade,
} from "./senioridade";

const CONTRATADO = "2026-01-01T12:00:00.000Z";

/** `contratadoEm` + N dias, no mesmo horário — evita ruído de fuso/hora. */
function apos(dias: number): string {
  return new Date(Date.parse(CONTRATADO) + dias * 86_400_000).toISOString();
}

describe("senioridade — faixas por tempo de casa", () => {
  it.each<[number, NivelSenioridade, string]>([
    [0, "junior", "Júnior"],
    [6, "junior", "Júnior"],
    [7, "pleno", "Pleno"],
    [29, "pleno", "Pleno"],
    [30, "senior", "Sênior"],
    [89, "senior", "Sênior"],
    [90, "especialista", "Especialista"],
    [365, "especialista", "Especialista"],
  ])("com %i dias de casa é %s", (dias, nivel, titulo) => {
    const s = senioridadeDe(CONTRATADO, apos(dias));
    expect(s.nivel).toBe(nivel);
    expect(s.titulo).toBe(titulo);
    expect(s.diasDeCasa).toBe(dias);
  });

  it("as faixas são monotônicas — nunca rebaixa com o tempo", () => {
    let anterior = -1;
    for (let dia = 0; dia <= 120; dia++) {
      const ordem = ordemDoNivel(senioridadeDe(CONTRATADO, apos(dia)).nivel);
      expect(ordem).toBeGreaterThanOrEqual(anterior);
      anterior = ordem;
    }
  });
});

describe("senioridade — a barra da ficha", () => {
  it("progresso fica sempre em [0, 1]", () => {
    for (let dia = 0; dia <= 200; dia++) {
      const p = senioridadeDe(CONTRATADO, apos(dia)).progresso;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("recém-contratado começa a barra do zero", () => {
    expect(senioridadeDe(CONTRATADO, apos(0)).progresso).toBe(0);
  });

  it("no meio da janela júnior→pleno a barra está pela metade", () => {
    // janela de 7 dias; no dia 3 ≈ 3/7
    expect(senioridadeDe(CONTRATADO, apos(3)).progresso).toBeCloseTo(3 / 7, 10);
  });

  it("no topo a barra está cheia e não há próxima faixa", () => {
    const s = senioridadeDe(CONTRATADO, apos(120));
    expect(s.progresso).toBe(1);
    expect(s.proximo).toBeNull();
    expect(s.proximoTitulo).toBeNull();
    expect(s.diasParaProximo).toBeNull();
  });

  it("diasParaProximo conta o que falta para virar de faixa", () => {
    const s = senioridadeDe(CONTRATADO, apos(5));
    expect(s.proximo).toBe("pleno");
    expect(s.proximoTitulo).toBe("Pleno");
    expect(s.diasParaProximo).toBe(2);
  });
});

describe("senioridade — entradas torta não quebram a ficha", () => {
  it("contratação no futuro conta como hoje, não como dia negativo", () => {
    const s = senioridadeDe(apos(10), CONTRATADO);
    expect(s.diasDeCasa).toBe(0);
    expect(s.nivel).toBe("junior");
    expect(s.progresso).toBe(0);
  });

  it("data ilegível degrada para recém-chegado, não para NaN", () => {
    const s = senioridadeDe("não é data", CONTRATADO);
    expect(s.diasDeCasa).toBe(0);
    expect(Number.isNaN(s.progresso)).toBe(false);
    expect(s.nivel).toBe("junior");
  });

  it("é determinística — mesma entrada, mesma saída", () => {
    expect(senioridadeDe(CONTRATADO, apos(42))).toEqual(
      senioridadeDe(CONTRATADO, apos(42)),
    );
  });
});

describe("habilidades — catálogo e revelação", () => {
  it("todo cargo tem uma habilidade por faixa, na ordem", () => {
    const esperado: NivelSenioridade[] = [
      "junior",
      "pleno",
      "senior",
      "especialista",
    ];
    for (const cargo of CARGOS_IA) {
      expect(cargo.habilidades.map((h) => h.nivelMinimo)).toEqual(esperado);
    }
  });

  it("nenhuma habilidade tem nome ou descrição vazios", () => {
    for (const cargo of CARGOS_IA) {
      for (const h of cargo.habilidades) {
        expect(h.nome.trim().length).toBeGreaterThan(0);
        expect(h.descricao.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("nomes de habilidade não se repetem dentro do mesmo cargo", () => {
    for (const cargo of CARGOS_IA) {
      const nomes = cargo.habilidades.map((h) => h.nome);
      expect(new Set(nomes).size).toBe(nomes.length);
    }
  });

  it("devolve TODAS as habilidades, marcando as ainda travadas", () => {
    const cargo = cargoPorId("documentador");
    expect(cargo).toBeDefined();
    if (!cargo) return;

    const novato = habilidadesLiberadas(cargo, senioridadeDe(CONTRATADO, apos(0)));
    expect(novato).toHaveLength(4);
    expect(novato.map((h) => h.liberada)).toEqual([true, false, false, false]);
  });

  it("cada faixa revela exatamente uma habilidade a mais", () => {
    const cargo = cargoPorId("comercial");
    expect(cargo).toBeDefined();
    if (!cargo) return;

    const contar = (dias: number) =>
      habilidadesLiberadas(cargo, senioridadeDe(CONTRATADO, apos(dias))).filter(
        (h) => h.liberada,
      ).length;

    expect(contar(0)).toBe(1);
    expect(contar(7)).toBe(2);
    expect(contar(30)).toBe(3);
    expect(contar(90)).toBe(4);
  });
});
