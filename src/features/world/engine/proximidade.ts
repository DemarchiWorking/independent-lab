import type { Celula } from "./iso";

/**
 * Quem está perto de quem na sala — a regra que acende o balão de conversa
 * sobre a cabeça de um NPC (GH-WORLD-07).
 *
 * PURO de propósito, como todo o resto de `engine/`: o `render/` só pergunta
 * "esse alvo está no raio?" e desenha. Nenhuma decisão de proximidade mora
 * dentro do Pixi (regra do AGENTS.md — "Nunca ponha regra dentro do `render/`").
 *
 * Distância EUCLIDIANA, não Manhattan. O caminhar usa 4 vizinhos
 * (`caminho.ts`), mas quem está na diagonal *parece* perto na tela isométrica —
 * um raio de Manhattan acenderia o balão do vizinho ortogonal a 1 tile e
 * ignoraria o diagonal, que está visivelmente à mesma distância. Euclidiano é
 * o que bate com o que o olho vê.
 */

/**
 * Raio de conversa, em células. 1.6 cobre os 4 vizinhos ortogonais (1.0) e os
 * 4 diagonais (~1.41), e exclui qualquer coisa a 2 tiles — ou seja, "estou do
 * lado dele", nunca "estou do outro lado da sala".
 */
export const RAIO_INTERACAO = 1.6;

/** Um alvo possível de conversa: um avatar com posição no grid. */
export interface AlvoProximidade {
  id: string;
  cx: number;
  cy: number;
}

/**
 * Distância em células entre dois pontos do grid.
 *
 * Aceita coordenada FRACIONÁRIA de propósito: o avatar controlado passa a maior
 * parte do tempo no meio de um passo (a cena interpola `cxF`/`cyF` a cada
 * frame), e arredondar aqui faria o balão piscar durante a caminhada.
 */
export function distanciaCelulas(
  a: { cx: number; cy: number },
  b: { cx: number; cy: number },
): number {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy);
}

/**
 * Ids dos alvos dentro do raio, do mais perto para o mais longe.
 *
 * Desempate estável por `id` — dois Funcionários de IA à mesma distância
 * precisam sair sempre na mesma ordem, senão a UI trocaria de "alvo principal"
 * a cada frame.
 */
export function alvosProximos(
  origem: { cx: number; cy: number },
  alvos: readonly AlvoProximidade[],
  raio: number = RAIO_INTERACAO,
): string[] {
  return alvos
    .map((alvo) => ({ id: alvo.id, d: distanciaCelulas(origem, alvo) }))
    .filter((v) => v.d <= raio)
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((v) => v.id);
}

/** O alvo mais próximo dentro do raio, ou `null` se não há ninguém por perto. */
export function alvoMaisProximo(
  origem: { cx: number; cy: number },
  alvos: readonly AlvoProximidade[],
  raio: number = RAIO_INTERACAO,
): string | null {
  return alvosProximos(origem, alvos, raio)[0] ?? null;
}

/** `true` se o alvo está dentro do raio de conversa da origem. */
export function estaProximo(
  origem: { cx: number; cy: number },
  alvo: Celula,
  raio: number = RAIO_INTERACAO,
): boolean {
  return distanciaCelulas(origem, alvo) <= raio;
}
