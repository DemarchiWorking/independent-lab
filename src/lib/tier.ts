import type { TierChave } from "@tokens";

/**
 * Classes Tailwind estáticas por tier (degrau_atual, 1–5) — mesmo padrão de
 * `ATRIBUTO_BG_CLASS` em `lib/atributos.ts`. Precisam ser strings literais
 * (não `bg-tier-${n}` interpolado) pro scanner do Tailwind encontrar a
 * classe em build time. Ver `docs/mapa-vivo/` (Mapa Vivo, GH-MAPA-05).
 */
export const TIER_BG_CLASS: Record<TierChave, string> = {
  1: "bg-tier-1",
  2: "bg-tier-2",
  3: "bg-tier-3",
  4: "bg-tier-4",
  5: "bg-tier-5",
};

/** `degrau` fora de 1–5 cai no tier 1 — defensivo, nunca deveria acontecer
 *  (constraint do banco garante 1–5), mesmo princípio de `corDoTier`. */
export function classeTier(degrau: number): string {
  const chave = (degrau >= 1 && degrau <= 5 ? degrau : 1) as TierChave;
  return TIER_BG_CLASS[chave];
}

/** Variante `ring-*` (anel/contorno) — classe própria, NUNCA
 *  `classeTier(...).replace("bg-", "ring-")`: transformação em runtime
 *  não é uma string literal, o scanner do Tailwind não encontra a classe
 *  em build time e o CSS nunca é gerado (fica sem efeito, silenciosamente). */
export const TIER_RING_CLASS: Record<TierChave, string> = {
  1: "ring-tier-1",
  2: "ring-tier-2",
  3: "ring-tier-3",
  4: "ring-tier-4",
  5: "ring-tier-5",
};

export function classeAnelTier(degrau: number): string {
  const chave = (degrau >= 1 && degrau <= 5 ? degrau : 1) as TierChave;
  return TIER_RING_CLASS[chave];
}

/**
 * Nome da metáfora de árvore (Mapa Vivo, `docs/mapa-vivo/DESIGN.md`) — NOVA
 * nomenclatura, criada só pra este sistema de pin/badge. Deliberadamente
 * DIFERENTE de `DEGRAUS[degrau].nome` (`onboarding/scoring.ts`, ex.:
 * "Automação Essencial") — aquele é o nome comercial do degrau (usado em
 * `/painel`), este é o rótulo gamificado (usado no Mapa/Sede). O produto
 * nunca mostra preço/nome comercial fora do painel do dono (ver
 * `DESIGN.md.Inspiration & Anti-patterns`, "Rejeitado — mostrar
 * degrau_atual como número/preço").
 */
export const TIER_NOME_ARVORE: Record<TierChave, string> = {
  1: "Semente",
  2: "Broto",
  3: "Raiz",
  4: "Tronco",
  5: "Copa",
};

export function nomeArvoreTier(degrau: number): string {
  const chave = (degrau >= 1 && degrau <= 5 ? degrau : 1) as TierChave;
  return TIER_NOME_ARVORE[chave];
}
