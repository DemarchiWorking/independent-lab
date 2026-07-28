/**
 * Curva de progressão (primitiva de domínio, pura e sem dependências).
 *
 * XP é a ÚNICA fonte de verdade do nível — nunca guarde "nível" como algo
 * editável à parte. O mesmo cálculo existe em SQL (`public.nivel_por_xp`,
 * migration 0002); os dois DEVEM permanecer idênticos. Por isso a fórmula é
 * trivial de um lado e de outro.
 *
 * Limiar de XP para ALCANÇAR o nível n:  limiar(n) = 50 · (n-1) · n
 *   L1=0 · L2=100 · L3=300 · L4=600 · L5=1000 · L6=1500 …
 * Custo do nível n→n+1 cresce de forma linear (100·n) — feedback sempre
 * atingível, sem "paredes" de progressão (boa prática de gamificação).
 */

export const NIVEL_MAX = 50;

export function limiarXp(nivel: number): number {
  const n = Math.max(1, Math.min(NIVEL_MAX, Math.floor(nivel)));
  return 50 * (n - 1) * n;
}

export function nivelPorXp(xp: number): number {
  const x = Math.max(0, xp);
  // inverso de limiar(n): n = (1 + sqrt(1 + x/12.5)) / 2
  const n = Math.floor((1 + Math.sqrt(1 + x / 12.5)) / 2);
  return Math.max(1, Math.min(NIVEL_MAX, n));
}

export interface Progresso {
  nivel: number;
  /** XP acumulado dentro do nível atual */
  xpNoNivel: number;
  /** XP total necessário para o próximo nível (0 se no nível máximo) */
  xpParaProximo: number;
  /** 0–100 (100 quando no nível máximo) */
  pct: number;
}

export function progresso(xp: number): Progresso {
  const nivel = nivelPorXp(xp);
  if (nivel >= NIVEL_MAX) {
    return { nivel: NIVEL_MAX, xpNoNivel: 0, xpParaProximo: 0, pct: 100 };
  }
  const base = limiarXp(nivel);
  const teto = limiarXp(nivel + 1);
  const xpNoNivel = Math.max(0, xp) - base;
  const xpParaProximo = teto - base;
  return {
    nivel,
    xpNoNivel,
    xpParaProximo,
    pct: Math.round((xpNoNivel / xpParaProximo) * 100),
  };
}
