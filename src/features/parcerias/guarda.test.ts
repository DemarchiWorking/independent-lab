import { describe, expect, it } from "vitest";
import { jaDesbloqueouNo } from "./guarda";
import type { NoDesbloqueado } from "@/lib/db/types";

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
