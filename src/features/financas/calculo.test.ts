import { describe, expect, it } from "vitest";
import { alertaDeSaldo, resumoFinanceiro } from "./calculo";
import type { FuncionarioContratado, ItemMobiliaColocado } from "@/lib/db/types";

function movel(itemId: string, nivel = 1): ItemMobiliaColocado {
  return {
    id: `m-${itemId}-${nivel}`,
    tenantId: "t1",
    itemId,
    slot: 0,
    colocadoEm: "2026-01-01T00:00:00.000Z",
    nivel,
  };
}

function funcionario(cargoId: string): FuncionarioContratado {
  return {
    id: `f-${cargoId}`,
    tenantId: "t1",
    cargoId,
    contratadoEm: "2026-01-01T00:00:00.000Z",
    disponibilidade: { estado: "livre" },
    nivel: 1,
  };
}

describe("finanças — resumo (GH-FIN-01)", () => {
  it("sede nível 1 não tem custo mensal, então não há runway a calcular", () => {
    const r = resumoFinanceiro(1000, 1, [], []);
    expect(r.custoMensalVirtual).toBe(0);
    expect(r.runwayMeses).toBeNull();
  });

  it("runway é saldo dividido pelo custo mensal, arredondado para baixo", () => {
    // sede nível 2 custa 300🪙/mês
    const r = resumoFinanceiro(1000, 2, [], []);
    expect(r.custoMensalVirtual).toBe(300);
    expect(r.runwayMeses).toBe(3);
  });

  it("patrimônio de equipamento considera o NÍVEL do item, não só o preço base", () => {
    // mesa-trabalho custa 400
    expect(resumoFinanceiro(0, 1, [movel("mesa-trabalho", 1)], []).patrimonioEquipamentos).toBe(400);
    expect(resumoFinanceiro(0, 1, [movel("mesa-trabalho", 3)], []).patrimonioEquipamentos).toBe(1200);
  });

  it("item desconhecido no catálogo é ignorado, não quebra o cálculo", () => {
    expect(resumoFinanceiro(0, 1, [movel("item-que-nao-existe")], []).patrimonioEquipamentos).toBe(0);
  });

  it("compromisso real soma o preço mensal dos cargos contratados", () => {
    // documentador 297 + comercial 897
    const r = resumoFinanceiro(0, 1, [], [funcionario("documentador"), funcionario("comercial")]);
    expect(r.compromissoMensalReal).toBe(1194);
    expect(r.totalFuncionarios).toBe(2);
  });

  it("🪙 e R$ nunca se misturam: saldo virtual não é afetado pelo compromisso real", () => {
    const r = resumoFinanceiro(500, 1, [], [funcionario("comercial")]);
    expect(r.saldoVirtual).toBe(500);
    expect(r.compromissoMensalReal).toBe(897);
    // são campos distintos — nenhum cálculo os soma
    expect(r.saldoVirtual).not.toBe(r.compromissoMensalReal);
  });
});

describe("finanças — alerta de saldo", () => {
  it("sem custo mensal, nunca alerta", () => {
    expect(alertaDeSaldo(resumoFinanceiro(0, 1, [], []))).toBeNull();
  });

  it("alerta forte quando o saldo não cobre nem um mês", () => {
    expect(alertaDeSaldo(resumoFinanceiro(100, 2, [], []))).toMatch(/não cobre o próximo mês/);
  });

  it("alerta ameno com 1–2 meses de folga", () => {
    expect(alertaDeSaldo(resumoFinanceiro(600, 2, [], []))).toMatch(/2 meses/);
  });

  it("silencia quando há folga confortável", () => {
    expect(alertaDeSaldo(resumoFinanceiro(3000, 2, [], []))).toBeNull();
  });
});
