import { dentroDaSala, type GeometriaSala } from "./sala";
import type { Celula } from "./iso";

/**
 * Pathfinding da sala — como o avatar decide o trajeto até o tile clicado.
 *
 * BFS em grid 4-vizinhos, não A*: o grid é minúsculo (no máximo 8×8 = 64
 * células) e todo passo custa igual, então a BFS já devolve o caminho
 * comprovadamente mais curto sem heurística nenhuma. A* aqui seria
 * complexidade sem ganho — a escolha é deliberada, não preguiça.
 *
 * Movimento em 4 direções (sem diagonal) de propósito: dá o passo "quadriculado"
 * de Habbo/The Sims, e evita o caso chato de atravessar o vão entre dois
 * móveis na diagonal.
 */

/** Chave estável de uma célula, para usar em Set/Map. */
export function chaveCelula(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

const VIZINHOS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export interface OpcoesCaminho {
  geo: GeometriaSala;
  /** células intransponíveis (mobília colocada) */
  bloqueadas: ReadonlySet<string>;
}

/**
 * Menor caminho de `origem` até `destino`, incluindo as duas pontas.
 *
 * Retorna `null` quando não há trajeto — destino fora da sala, destino
 * ocupado por móvel, ou completamente cercado. O chamador simplesmente ignora
 * o clique nesse caso (não há "andar até perto"; é previsível e honesto).
 */
export function acharCaminho(
  origem: Celula,
  destino: Celula,
  { geo, bloqueadas }: OpcoesCaminho,
): Celula[] | null {
  if (!dentroDaSala(origem.cx, origem.cy, geo)) return null;
  if (!dentroDaSala(destino.cx, destino.cy, geo)) return null;
  if (bloqueadas.has(chaveCelula(destino.cx, destino.cy))) return null;

  if (origem.cx === destino.cx && origem.cy === destino.cy) return [origem];

  const alvo = chaveCelula(destino.cx, destino.cy);
  const veioDe = new Map<string, string | null>();
  veioDe.set(chaveCelula(origem.cx, origem.cy), null);

  const fila: Celula[] = [origem];
  let cabeca = 0;

  while (cabeca < fila.length) {
    const atual = fila[cabeca++];

    for (const [dx, dy] of VIZINHOS) {
      const cx = atual.cx + dx;
      const cy = atual.cy + dy;
      const chave = chaveCelula(cx, cy);

      if (veioDe.has(chave)) continue;
      if (!dentroDaSala(cx, cy, geo)) continue;
      if (bloqueadas.has(chave)) continue;

      veioDe.set(chave, chaveCelula(atual.cx, atual.cy));

      if (chave === alvo) return reconstruir(veioDe, chave);
      fila.push({ cx, cy });
    }
  }

  return null;
}

/** Refaz o caminho de trás para frente a partir do mapa de predecessores. */
function reconstruir(veioDe: Map<string, string | null>, fim: string): Celula[] {
  const caminho: Celula[] = [];
  let atual: string | null | undefined = fim;

  while (atual) {
    const [cx, cy] = atual.split(",").map(Number);
    caminho.push({ cx, cy });
    atual = veioDe.get(atual);
  }

  return caminho.reverse();
}

/** Conjunto de células bloqueadas a partir das células ocupadas por mobília. */
export function bloqueiosDeMobilia(celulas: readonly Celula[]): Set<string> {
  return new Set(celulas.map((c) => chaveCelula(c.cx, c.cy)));
}
