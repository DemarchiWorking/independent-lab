import { describe, expect, it } from "vitest";
import { aplicarEvento, EVENTOS } from "./engine";

const base = { xp: 90, moedaVirtual: 100, degrauAtual: 1 };

describe("motor de eventos", () => {
  it("é puro: não muta o estado de entrada", () => {
    const entrada = { ...base };
    aplicarEvento(entrada, "diagnostico_agendado");
    expect(entrada).toEqual(base);
  });

  it("aplica XP e moeda do catálogo", () => {
    const r = aplicarEvento(base, "diagnostico_agendado");
    const def = EVENTOS.diagnostico_agendado;
    expect(r.estado.xp).toBe(base.xp + def.xp);
    expect(r.estado.moedaVirtual).toBe(base.moedaVirtual + def.moeda);
    expect(r.ganhoXp).toBe(def.xp);
  });

  it("detecta subida de nível ao cruzar o limiar", () => {
    // 90 XP (nível 1) + 80 (diagnóstico) = 170 → nível 2
    const r = aplicarEvento(base, "diagnostico_agendado");
    expect(r.nivelAnterior).toBe(1);
    expect(r.nivelNovo).toBe(2);
    expect(r.subiuNivel).toBe(true);
  });

  it("serviço contratado sobe um degrau", () => {
    const r = aplicarEvento(base, "servico_contratado");
    expect(r.subiuDegrau).toBe(true);
    expect(r.estado.degrauAtual).toBe(2);
  });

  it("não passa do degrau máximo", () => {
    const noTopo = { ...base, degrauAtual: 5 };
    const r = aplicarEvento(noTopo, "servico_contratado", 5);
    expect(r.subiuDegrau).toBe(false);
    expect(r.estado.degrauAtual).toBe(5);
  });

  it("evento sem bônus de degrau não mexe no degrau", () => {
    const r = aplicarEvento(base, "oferta_publicada");
    expect(r.subiuDegrau).toBe(false);
    expect(r.estado.degrauAtual).toBe(1);
  });

  it("contratar funcionário de IA sobe um degrau e paga XP+moeda", () => {
    const r = aplicarEvento(base, "funcionario_ia_contratado");
    const def = EVENTOS.funcionario_ia_contratado;
    expect(r.subiuDegrau).toBe(true);
    expect(r.estado.degrauAtual).toBe(2);
    expect(r.estado.xp).toBe(base.xp + def.xp);
    expect(r.estado.moedaVirtual).toBe(base.moedaVirtual + def.moeda);
  });
});
