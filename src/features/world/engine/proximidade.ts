import type { Celula } from "./iso";

/**
 * Proximidade entre avatares na sala (GH-WORLD-08) — regra PURA, como todo
 * o resto de `engine/`. O `render/` só reporta "o avatar chegou nesta
 * célula"; quem decide se isso significa "está perto o suficiente para
 * interagir" é este módulo, testável sem Pixi.
 */

export interface AvatarNaSala {
  id: string;
  nome: string;
  cx: number;
  cy: number;
}

export interface AvatarProximo extends AvatarNaSala {
  distancia: number;
}

/**
 * Distância de Chebyshev (rei do xadrez): diagonal custa o mesmo que reta.
 *
 * É a métrica certa para "estou ao lado de alguém" num grid isométrico —
 * com distância Manhattan, um NPC na diagonal daria 2 e pareceria longe
 * mesmo estando visivelmente encostado.
 */
export function distanciaEmCelulas(a: Celula, b: Celula): number {
  return Math.max(Math.abs(a.cx - b.cx), Math.abs(a.cy - b.cy));
}

/** Raio padrão de interação: célula adjacente, incluindo diagonais. */
export const RAIO_INTERACAO = 1;

/**
 * Avatares dentro do raio, do mais perto para o mais longe. O próprio
 * jogador nunca aparece na lista (`ignorarId`).
 *
 * Empate de distância é desempatado por `id` para a ordem ser estável — sem
 * isso, dois NPCs à mesma distância poderiam trocar de lugar no painel a
 * cada frame, fazendo os botões "pularem" debaixo do dedo do jogador.
 */
export function avataresProximos(
  origem: Celula,
  avatares: readonly AvatarNaSala[],
  ignorarId: string,
  raio: number = RAIO_INTERACAO,
): AvatarProximo[] {
  return avatares
    .filter((a) => a.id !== ignorarId)
    .map((a) => ({ ...a, distancia: distanciaEmCelulas(origem, { cx: a.cx, cy: a.cy }) }))
    .filter((a) => a.distancia <= raio)
    .sort((x, y) => x.distancia - y.distancia || x.id.localeCompare(y.id));
}

/** O id de avatar de um Funcionário de IA carrega o cargo: `ia:comercial`.
 *  Devolve `null` para avatares que não são agente (dono, visitante). */
export function cargoDoAvatar(avatarId: string): string | null {
  return avatarId.startsWith("ia:") ? avatarId.slice(3) : null;
}

/**
 * O id de avatar de um visitante ao vivo carrega o tenant:
 * `presenca:<tenantId>` (GH-MULTI-03). Devolve `null` para todo o resto.
 *
 * O prefixo é o que separa "pessoa de verdade que está aqui agora" de
 * "agente de IA" sem precisar de um campo extra em `EstadoCena` — o mesmo
 * truque de `ia:`, e o `render/` continua sem saber a diferença.
 */
export function tenantDoAvatar(avatarId: string): string | null {
  return avatarId.startsWith("presenca:") ? avatarId.slice("presenca:".length) : null;
}
