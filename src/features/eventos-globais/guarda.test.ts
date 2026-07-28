import { describe, expect, it } from "vitest";
import { jaRecompensado } from "./guarda";

describe("jaRecompensado", () => {
  it("falso quando não há progresso ainda", () => {
    expect(jaRecompensado(undefined)).toBe(false);
  });
  it("falso quando completoEm é null (meta ainda não batida)", () => {
    expect(jaRecompensado({ eventoId: "e", tenantId: "t", contagem: 1, completoEm: null })).toBe(false);
  });
  it("verdadeiro quando completoEm está preenchido", () => {
    expect(
      jaRecompensado({
        eventoId: "e",
        tenantId: "t",
        contagem: 3,
        completoEm: "2026-08-02T00:00:00.000Z",
      }),
    ).toBe(true);
  });
});
