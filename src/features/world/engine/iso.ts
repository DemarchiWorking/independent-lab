/**
 * Projeção isométrica 2:1 — o núcleo geométrico do World.
 *
 * PURO de propósito: nada aqui importa React nem Pixi. Toda a matemática do
 * palco (onde cada tile cai na tela, qual tile o jogador clicou, quem desenha
 * na frente de quem) mora aqui e é testável sem browser. O renderer
 * (`../render/`) é uma casca fina por cima disto.
 *
 * Mesma projeção 2:1 já usada no mapa regional (`IsoLot`/`QuarteiraoIso`) —
 * o World não inventa uma segunda convenção de isometria.
 *
 *        (0,0)  ← canto "fundo" da sala
 *         /\
 *   cy ↙      ↘ cx
 *       \      /
 *        \/  (n,n) ← canto "frente", mais perto do jogador
 */

/** Largura/altura de um tile em px. Razão 2:1 (clássica de iso pixel art). */
export const TILE_W = 64;
export const TILE_H = 32;

export interface Celula {
  cx: number;
  cy: number;
}

export interface Ponto {
  x: number;
  y: number;
}

/** Centro do tile (cx, cy) em coordenadas de tela. */
export function gridParaTela(cx: number, cy: number): Ponto {
  return {
    x: (cx - cy) * (TILE_W / 2),
    y: (cx + cy) * (TILE_H / 2),
  };
}

/**
 * Inversa de `gridParaTela` — converte um clique na tela de volta para a
 * célula do grid. É o que torna possível "clicar no chão para andar até lá".
 *
 * Retorna coordenadas FRACIONÁRIAS (não arredondadas) para o chamador decidir
 * a política de arredondamento; use `celulaNoPonto` para o caso comum.
 */
export function telaParaGridExato(x: number, y: number): { cx: number; cy: number } {
  const a = x / (TILE_W / 2);
  const b = y / (TILE_H / 2);
  return {
    cx: (a + b) / 2,
    cy: (b - a) / 2,
  };
}

/** Célula inteira sob um ponto de tela (arredonda para o tile mais próximo). */
export function celulaNoPonto(x: number, y: number): Celula {
  const { cx, cy } = telaParaGridExato(x, y);
  return { cx: Math.round(cx), cy: Math.round(cy) };
}

/**
 * Chave de ordenação por profundidade (painter's algorithm): quem tem `cx+cy`
 * maior está mais "à frente" e deve ser desenhado por último. É o que faz o
 * avatar passar corretamente atrás e na frente dos móveis.
 */
export function profundidade(cx: number, cy: number): number {
  return cx + cy;
}

/** Ordena entidades do fundo para a frente. Estável (preserva empates). */
export function ordenarPorProfundidade<T extends { cx: number; cy: number }>(
  itens: readonly T[],
): T[] {
  return [...itens].sort((a, b) => profundidade(a.cx, a.cy) - profundidade(b.cx, b.cy));
}

/**
 * Caixa que envolve a sala inteira em coordenadas de tela, com o offset que
 * precisa ser aplicado para que nada fique com coordenada negativa.
 *
 * O tile (0, rows-1) é o mais à esquerda e (cols-1, 0) o mais à direita —
 * por isso a largura é (cols+rows) meias-larguras de tile.
 */
export function medidasDaSala(
  cols: number,
  rows: number,
): { largura: number; altura: number; offsetX: number; offsetY: number } {
  return {
    largura: (cols + rows) * (TILE_W / 2),
    altura: (cols + rows) * (TILE_H / 2),
    // desloca para a direita o suficiente para o tile mais à esquerda cair em x=0
    offsetX: rows * (TILE_W / 2),
    offsetY: 0,
  };
}
