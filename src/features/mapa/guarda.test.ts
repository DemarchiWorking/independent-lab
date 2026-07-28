import { describe, expect, it } from "vitest";
import { jaFormouParceria } from "./guarda";
import type { ParceriaFormada } from "@/lib/db/types";

function parceria(vizinhoTenantId: string): ParceriaFormada {
  return {
    id: "x",
    tenantId: "t1",
    vizinhoTenantId,
    formadaEm: "2026-01-01T00:00:00.000Z",
  };
}

describe("mapa — guarda anti-farm de parcerias (GH-FDN-03)", () => {
  it("nenhuma parceria formada ainda: nada foi formado", () => {
    expect(jaFormouParceria([], "v1")).toBe(false);
  });

  it("vizinho já na lista: detecta re-formação", () => {
    expect(jaFormouParceria([parceria("v1")], "v1")).toBe(true);
  });

  it("formar parceria com um vizinho diferente não é bloqueado pelo primeiro", () => {
    expect(jaFormouParceria([parceria("v1")], "v2")).toBe(false);
  });

  it("várias parcerias formadas: só a repetida é bloqueada", () => {
    const formadas = [parceria("v1"), parceria("v2")];
    expect(jaFormouParceria(formadas, "v2")).toBe(true);
    expect(jaFormouParceria(formadas, "v3")).toBe(false);
  });
});
