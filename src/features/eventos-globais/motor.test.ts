import { describe, expect, it } from "vitest";
import {
  atingiuMeta,
  estaAtivo,
  eventosVisiveis,
  janelaValida,
  progressoDe,
  progressoPercentual,
  statusDe,
} from "./motor";
import type { EventoGlobal } from "./tipos";

const janela = { inicioEm: "2026-08-01T00:00:00.000Z", fimEm: "2026-08-07T23:59:59.999Z" };

function evento(overrides: Partial<EventoGlobal> = {}): EventoGlobal {
  return {
    id: "evt_1",
    titulo: "Semana da Automação",
    descricao: "3 serviços de automação vendidos ganham bônus.",
    objetivo: "servico_contratado",
    meta: 3,
    inicioEm: janela.inicioEm,
    fimEm: janela.fimEm,
    recompensa: { xp: 100, moeda: 50 },
    criadoPor: "founder@labdatadev.com",
    criadoEm: "2026-07-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("statusDe / estaAtivo", () => {
  it("agendado antes do início", () => {
    expect(statusDe(janela, "2026-07-31T23:59:59.999Z")).toBe("agendado");
  });
  it("ativo dentro da janela (inclusive nas bordas)", () => {
    expect(statusDe(janela, janela.inicioEm)).toBe("ativo");
    expect(statusDe(janela, janela.fimEm)).toBe("ativo");
    expect(estaAtivo(janela, "2026-08-03T12:00:00.000Z")).toBe(true);
  });
  it("encerrado depois do fim", () => {
    expect(statusDe(janela, "2026-08-08T00:00:00.001Z")).toBe("encerrado");
    expect(estaAtivo(janela, "2026-08-08T00:00:00.001Z")).toBe(false);
  });
});

describe("janelaValida", () => {
  it("aceita início antes do fim", () => {
    expect(janelaValida(janela.inicioEm, janela.fimEm)).toBe(true);
  });
  it("rejeita fim igual ou antes do início", () => {
    expect(janelaValida(janela.inicioEm, janela.inicioEm)).toBe(false);
    expect(janelaValida(janela.fimEm, janela.inicioEm)).toBe(false);
  });
});

describe("progressoPercentual", () => {
  it("calcula proporção arredondada", () => {
    expect(progressoPercentual(1, 3)).toBe(33);
    expect(progressoPercentual(2, 3)).toBe(67);
  });
  it("nunca passa de 100 mesmo com contagem acima da meta", () => {
    expect(progressoPercentual(5, 3)).toBe(100);
  });
  it("meta zero ou negativa nunca lança, retorna 0", () => {
    expect(progressoPercentual(1, 0)).toBe(0);
    expect(progressoPercentual(1, -1)).toBe(0);
  });
});

describe("atingiuMeta", () => {
  it("bate exatamente ou acima", () => {
    expect(atingiuMeta(3, 3)).toBe(true);
    expect(atingiuMeta(4, 3)).toBe(true);
    expect(atingiuMeta(2, 3)).toBe(false);
  });
});

describe("progressoDe", () => {
  it("encontra o progresso do evento certo", () => {
    const lista = [
      { eventoId: "evt_1", tenantId: "t1", contagem: 2, completoEm: null },
      { eventoId: "evt_2", tenantId: "t1", contagem: 5, completoEm: "2026-08-02T00:00:00.000Z" },
    ];
    expect(progressoDe(lista, "evt_2")?.contagem).toBe(5);
  });
  it("tenant sem registro ainda conta implicitamente 0 (undefined, nunca lança)", () => {
    expect(progressoDe([], "evt_1")).toBeUndefined();
  });
});

describe("eventosVisiveis", () => {
  it("esconde encerrados e ordena ativos antes de agendados", () => {
    const ativo = evento({ id: "ativo", inicioEm: "2026-08-01T00:00:00.000Z", fimEm: "2026-08-07T00:00:00.000Z" });
    const agendado = evento({ id: "agendado", inicioEm: "2026-09-01T00:00:00.000Z", fimEm: "2026-09-07T00:00:00.000Z" });
    const encerrado = evento({ id: "encerrado", inicioEm: "2026-01-01T00:00:00.000Z", fimEm: "2026-01-07T00:00:00.000Z" });

    const visiveis = eventosVisiveis([agendado, encerrado, ativo], "2026-08-03T00:00:00.000Z");

    expect(visiveis.map((e) => e.id)).toEqual(["ativo", "agendado"]);
  });
});
