import { describe, expect, it } from "vitest";
import { limiarXp, nivelPorXp, progresso, NIVEL_MAX } from "./gamificacao";

describe("curva de XP", () => {
  it("limiares seguem 50·(n-1)·n", () => {
    expect(limiarXp(1)).toBe(0);
    expect(limiarXp(2)).toBe(100);
    expect(limiarXp(3)).toBe(300);
    expect(limiarXp(4)).toBe(600);
    expect(limiarXp(5)).toBe(1000);
  });

  it("nível é o inverso do limiar (bordas exatas)", () => {
    expect(nivelPorXp(0)).toBe(1);
    expect(nivelPorXp(99)).toBe(1);
    expect(nivelPorXp(100)).toBe(2);
    expect(nivelPorXp(299)).toBe(2);
    expect(nivelPorXp(300)).toBe(3);
    expect(nivelPorXp(600)).toBe(4);
    expect(nivelPorXp(1000)).toBe(5);
  });

  it("nível é monotônico e consistente com o limiar", () => {
    for (let n = 1; n <= 20; n++) {
      expect(nivelPorXp(limiarXp(n))).toBe(n);
      expect(nivelPorXp(limiarXp(n) - 1)).toBe(n - 1 || 1);
    }
  });

  it("clampa em [1, NIVEL_MAX] e trata XP negativo", () => {
    expect(nivelPorXp(-500)).toBe(1);
    expect(nivelPorXp(9_999_999)).toBe(NIVEL_MAX);
  });

  it("progresso reporta faixa correta dentro do nível", () => {
    const p = progresso(150); // nível 2 (100..300)
    expect(p.nivel).toBe(2);
    expect(p.xpNoNivel).toBe(50);
    expect(p.xpParaProximo).toBe(200);
    expect(p.pct).toBe(25);
  });

  it("no nível máximo o progresso satura em 100%", () => {
    const p = progresso(10_000_000);
    expect(p.nivel).toBe(NIVEL_MAX);
    expect(p.pct).toBe(100);
    expect(p.xpParaProximo).toBe(0);
  });
});
