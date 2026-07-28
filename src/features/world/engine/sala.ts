import { nivelSede } from "@/features/sede/niveis";
import type { Celula } from "./iso";

/**
 * Geometria da sala por nível de sede — quantos tiles CAMINHÁVEIS a sala tem,
 * e onde cada "slot" de mobília cai nesse grid.
 *
 * Decisão de modelagem importante: o World **não** cria um novo modelo de
 * posição. A mobília continua persistida por `slot` (um índice linear), como
 * já está em `itens_mobilia_colocados` e nas actions atômicas de
 * `features/sede/actions.ts`. Aqui só traduzimos slot ↔ célula (cx, cy).
 *
 * Por que isso importa: mover um móvel continua sendo `moverMobilia(id, slot)`
 * — a mesma operação atômica, com a mesma validação server-side de limite,
 * ocupação e posse. O World ganha um grid 2D sem abrir nenhuma superfície de
 * ataque nova nem exigir migration.
 *
 * A sala é deliberadamente MAIOR que o número de slots: os móveis encostam nas
 * duas paredes do fundo e o miolo fica livre para o avatar andar — que é como
 * um escritório real se organiza (e como Habbo/The Sims desenham uma sala).
 */

export interface GeometriaSala {
  /** tiles no eixo cx (parede do fundo-direita) */
  cols: number;
  /** tiles no eixo cy (parede do fundo-esquerda) */
  rows: number;
  /** quantos slots de mobília este nível comporta */
  slots: number;
}

/**
 * Tamanho da sala por nível. Explícito em tabela (padrão `NIVEIS_SEDE`/
 * `DEGRAUS` do projeto) em vez de fórmula — mais fácil de ajustar por
 * game design sem reescrever matemática.
 *
 * Invariante: a capacidade das paredes do fundo (`cols + rows - 1`) precisa
 * ser >= `slots` do nível. Há teste que trava isso para todos os níveis.
 */
const SALA_POR_NIVEL: Record<number, { cols: number; rows: number }> = {
  1: { cols: 4, rows: 4 }, // 3 slots → 7 células de parede
  2: { cols: 5, rows: 5 }, // 6 slots → 9
  3: { cols: 6, rows: 6 }, // 10 slots → 11
  4: { cols: 8, rows: 8 }, // 14 slots → 15
};

export function geometriaSala(nivel: number): GeometriaSala {
  const { slots } = nivelSede(nivel);
  const dim = SALA_POR_NIVEL[nivel] ?? SALA_POR_NIVEL[1];
  return { cols: dim.cols, rows: dim.rows, slots };
}

/**
 * Ordem canônica dos slots ao longo das paredes do fundo.
 *
 * Percorre primeiro a parede do fundo-direita (cy = 0, cx crescendo) e depois
 * a do fundo-esquerda (cx = 0, cy crescendo). A ordem é ESTÁVEL: o slot 0 é
 * sempre a mesma célula, porque `slot` é o dado persistido — mudar esta ordem
 * reposicionaria a mobília de todo mundo.
 */
export function celulasDeSlot(geo: GeometriaSala): Celula[] {
  const celulas: Celula[] = [];
  for (let cx = 0; cx < geo.cols; cx++) celulas.push({ cx, cy: 0 });
  for (let cy = 1; cy < geo.rows; cy++) celulas.push({ cx: 0, cy });
  return celulas;
}

/** Capacidade máxima de mobília que as paredes do fundo comportam. */
export function capacidadeDeParede(geo: GeometriaSala): number {
  return geo.cols + geo.rows - 1;
}

/** Célula onde um slot é desenhado, ou `null` se o slot não existe no nível. */
export function slotParaCelula(slot: number, geo: GeometriaSala): Celula | null {
  if (!Number.isInteger(slot) || slot < 0 || slot >= geo.slots) return null;
  return celulasDeSlot(geo)[slot] ?? null;
}

/** Slot correspondente a uma célula, ou `null` se ali não cabe mobília. */
export function celulaParaSlot(cx: number, cy: number, geo: GeometriaSala): number | null {
  const idx = celulasDeSlot(geo).findIndex((c) => c.cx === cx && c.cy === cy);
  return idx >= 0 && idx < geo.slots ? idx : null;
}

/** A célula existe dentro da sala? */
export function dentroDaSala(cx: number, cy: number, geo: GeometriaSala): boolean {
  return cx >= 0 && cy >= 0 && cx < geo.cols && cy < geo.rows;
}

/**
 * Onde o avatar nasce: o centro da sala, que por construção nunca é um slot
 * de mobília (os slots vivem nas bordas cy=0 / cx=0, e o centro de uma sala
 * de lado >= 4 sempre tem cx>=1 e cy>=1).
 */
export function celulaInicialAvatar(geo: GeometriaSala): Celula {
  return {
    cx: Math.max(1, Math.floor(geo.cols / 2)),
    cy: Math.max(1, Math.floor(geo.rows / 2)),
  };
}

/**
 * Células onde um avatar pode ficar de pé: dentro da sala e sem móvel em cima.
 * Ordenadas do fundo para a frente, para a distribuição dos Funcionários de IA
 * ficar visualmente estável (não pular de lugar a cada re-render).
 */
export function celulasCaminhaveis(
  geo: GeometriaSala,
  bloqueadas: ReadonlySet<string>,
): Celula[] {
  const livres: Celula[] = [];
  for (let cy = 0; cy < geo.rows; cy++) {
    for (let cx = 0; cx < geo.cols; cx++) {
      if (!bloqueadas.has(`${cx},${cy}`)) livres.push({ cx, cy });
    }
  }
  return livres;
}

/**
 * Distribui N avatares pelas células livres, começando pelo miolo da sala e
 * espaçando o máximo possível — evita a fila de bonecos empilhados num canto.
 * Determinístico: mesma entrada, mesma saída (nada de random).
 *
 * Garante células DISTINTAS enquanto houver espaço livre. Isso não é detalhe:
 * o dono nasce no centro (`celulaInicialAvatar`), então o chamador precisa
 * incluir a célula dele em `bloqueadas` — senão o primeiro Funcionário de IA
 * nasce exatamente em cima dele, e os dois bonecos ficam sobrepostos.
 */
export function distribuirAvatares(
  geo: GeometriaSala,
  bloqueadas: ReadonlySet<string>,
  quantidade: number,
): Celula[] {
  const livres = celulasCaminhaveis(geo, bloqueadas);
  if (quantidade <= 0 || livres.length === 0) return [];

  const centro = celulaInicialAvatar(geo);
  // mais perto do centro primeiro; desempate estável por coordenada
  const ordenadas = [...livres].sort((a, b) => {
    const da = Math.abs(a.cx - centro.cx) + Math.abs(a.cy - centro.cy);
    const db = Math.abs(b.cx - centro.cx) + Math.abs(b.cy - centro.cy);
    return da - db || a.cx - b.cx || a.cy - b.cy;
  });

  // passo > 1 espalha os bonecos em vez de agrupá-los todos no centro
  const passo = Math.max(1, Math.floor(ordenadas.length / quantidade));
  const usadas = new Set<number>();
  const escolhidas: Celula[] = [];

  for (let i = 0; i < quantidade; i++) {
    let idx = Math.min(i * passo, ordenadas.length - 1);
    // se o índice ideal já foi usado, pega o próximo livre (mantém distinto)
    while (usadas.has(idx) && usadas.size < ordenadas.length) {
      idx = (idx + 1) % ordenadas.length;
    }
    usadas.add(idx);
    escolhidas.push(ordenadas[idx]);
  }

  return escolhidas;
}
