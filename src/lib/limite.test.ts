import { describe, expect, it } from "vitest";
import { Limitador } from "./limite";

describe("Limitador", () => {
  it("bloqueia depois do máximo na janela e libera quando a janela passa", () => {
    const l = new Limitador(60_000, 3);
    expect(l.consumir("ip", 0)).toBe(true);
    expect(l.consumir("ip", 1)).toBe(true);
    expect(l.consumir("ip", 2)).toBe(true);
    expect(l.consumir("ip", 3)).toBe(false);
    expect(l.consumir("ip", 60_010)).toBe(true);
  });

  it("chaves diferentes não interferem", () => {
    const l = new Limitador(60_000, 1);
    expect(l.consumir("a", 0)).toBe(true);
    expect(l.consumir("b", 0)).toBe(true);
    expect(l.consumir("a", 1)).toBe(false);
  });

  it("não cresce sem limite com muitas chaves", () => {
    const l = new Limitador(60_000, 5, 100);
    for (let i = 0; i < 1000; i++) l.consumir(`ip-${i}`, i);
    l.bloqueado("x", 2000);
    expect(l.tamanho).toBeLessThanOrEqual(101);
  });

  it("chaves expiradas são removidas na limpeza", () => {
    const l = new Limitador(1000, 5);
    l.consumir("velha", 0);
    l.bloqueado("outra", 120_000);
    expect(l.tamanho).toBe(0);
  });
});
