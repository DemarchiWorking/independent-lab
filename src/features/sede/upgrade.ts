import type { AtributoChave } from "@tokens";
import type { ItemMobilia } from "./catalogo";

/**
 * Regras de upgrade de equipamento (GH-WORLD-07) — puras e testáveis,
 * separadas da Server Action (mesmo padrão dos módulos `guarda.ts` de
 * marketplace/parcerias/mapa).
 *
 * Modelo: o bônus TOTAL de um item no nível N é `base × N`. Cada upgrade
 * aplica mais uma vez o bônus base — simples de entender na tela ("+1
 * Processo por nível") e barato de calcular sem histórico.
 */

export const NIVEL_MAX_MOBILIA = 3;

/**
 * Custo do upgrade PARA `nivelDestino`: preço base × nível de destino.
 * Escala junto com o benefício e evita que evoluir seja sempre melhor que
 * comprar um móvel novo (a escolha entre os dois é o interessante).
 */
export function custoUpgradeMobilia(item: ItemMobilia, nivelDestino: number): number {
  return item.preco * nivelDestino;
}

/** Bônus aplicado NESTE upgrade — é sempre uma cópia do bônus base. */
export function bonusDoUpgrade(item: ItemMobilia): Partial<Record<AtributoChave, number>> {
  return { ...item.bonus };
}

/** Bônus acumulado do item no nível informado (para exibir na tela). */
export function bonusTotalNoNivel(
  item: ItemMobilia,
  nivel: number,
): Partial<Record<AtributoChave, number>> {
  const total: Partial<Record<AtributoChave, number>> = {};
  for (const [chave, valor] of Object.entries(item.bonus)) {
    if (valor) total[chave as AtributoChave] = valor * nivel;
  }
  return total;
}

export function podeEvoluirMobilia(nivelAtual: number): boolean {
  return nivelAtual < NIVEL_MAX_MOBILIA;
}
