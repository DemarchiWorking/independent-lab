import { describe, expect, it } from "vitest";
import { jaDesbloqueouNo, noInalcancavel } from "./guarda";
import { hexNodes, noPorId } from "./data";
import type { NoDesbloqueado } from "@/lib/db/types";
import { atributosFaltantes, TETO_ATRIBUTO, type Atributos } from "@/lib/atributos";

function no(noId: string): NoDesbloqueado {
  return { id: "x", tenantId: "t1", noId, desbloqueadoEm: "2026-01-01T00:00:00.000Z" };
}

describe("parcerias — guarda anti-farm (GH-FDN-02)", () => {
  it("negocio sem nós desbloqueados: nada foi desbloqueado ainda", () => {
    expect(jaDesbloqueouNo([], "web")).toBe(false);
  });

  it("nó já na lista: detecta re-desbloqueio", () => {
    expect(jaDesbloqueouNo([no("web")], "web")).toBe(true);
  });

  it("desbloquear um nó diferente não é bloqueado pelo primeiro", () => {
    expect(jaDesbloqueouNo([no("web")], "automacao")).toBe(false);
  });

  it("vários nós desbloqueados: só o repetido é bloqueado", () => {
    const desbloqueados = [no("web"), no("crm")];
    expect(jaDesbloqueouNo(desbloqueados, "crm")).toBe(true);
    expect(jaDesbloqueouNo(desbloqueados, "bi")).toBe(false);
  });
});

describe("parcerias — catálogo de requisitos (GH-ATR-03)", () => {
  it("todo nó declara requisitos (objeto, mesmo que vazio)", () => {
    for (const node of hexNodes) {
      expect(node.requisitos).toBeTypeOf("object");
    }
  });

  it("nenhum mínimo excede TETO_ATRIBUTO", () => {
    for (const node of hexNodes) {
      for (const minimo of Object.values(node.requisitos)) {
        expect(minimo).toBeLessThanOrEqual(TETO_ATRIBUTO);
      }
    }
  });

  it("nó 'web' (porta de entrada) não exige nenhum atributo", () => {
    expect(noPorId("web")?.requisitos).toEqual({});
  });

  it("anti-softlock: com o pior perfil de atributos do onboarding, o nó 'web' (sem locked) não tem faltantes", () => {
    // espelha o piso mínimo de `calcular()` — ver scoring.test.ts (GH-ATR-03)
    const pior: Atributos = {
      tecnologia: { valor: 8, teto: 40 },
      processo: { valor: 6, teto: 40 },
      presenca: { valor: 2, teto: 40 },
      aquisicao: { valor: 6, teto: 40 },
      capacidade: { valor: 6, teto: 40 },
    };
    const web = noPorId("web")!;
    expect(web.locked).toBeFalsy();
    expect(atributosFaltantes(pior, web.requisitos)).toEqual([]);
  });
});

describe("noInalcancavel (GH-ARV-02)", () => {
  const pior: Atributos = {
    tecnologia: { valor: 8, teto: 40 },
    processo: { valor: 6, teto: 40 },
    presenca: { valor: 2, teto: 40 },
    aquisicao: { valor: 6, teto: 40 },
    capacidade: { valor: 6, teto: 40 },
  };

  it("nó bloqueado (locked) nunca é 'inalcançável' — é 'bloqueado', motivo diferente", () => {
    const infra = noPorId("infra")!;
    expect(infra.locked).toBe(true);
    expect(noInalcancavel(infra, false, pior)).toBe(false);
  });

  it("nó já desbloqueado nunca é 'inalcançável'", () => {
    const crm = noPorId("crm")!;
    expect(noInalcancavel(crm, true, pior)).toBe(false);
  });

  it("modo demo (atributos ausente) nunca marca inalcançável", () => {
    const crm = noPorId("crm")!;
    expect(noInalcancavel(crm, false, undefined)).toBe(false);
  });

  it("requisito não atendido, não bloqueado, não desbloqueado: inalcançável", () => {
    const crm = noPorId("crm")!; // requisitos: { processo: 12, aquisicao: 12 }
    expect(noInalcancavel(crm, false, pior)).toBe(true);
  });

  it("requisito atendido: não é inalcançável (fica 'comprável')", () => {
    const web = noPorId("web")!; // requisitos: {}
    expect(noInalcancavel(web, false, pior)).toBe(false);
  });
});
