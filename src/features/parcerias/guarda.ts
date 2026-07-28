import type { NoDesbloqueado } from "@/lib/db/types";
import { atributosFaltantes, type Atributos } from "@/lib/atributos";
import type { HexNode } from "./data";

/**
 * Guarda anti-farm da árvore de parcerias (GH-FDN-02) — decisão pura,
 * extraída para ser testável sem depender de sessão/banco (mesmo padrão de
 * `features/marketplace/guarda.ts` e `features/historia/motor.ts`).
 *
 * A garantia REAL contra corrida é o `unique(tenant_id, no_id)` na migration
 * `0009_parcerias_nos.sql`; esta função é a checagem amigável no servidor,
 * chamada em `recompensar()` antes de aplicar XP/moeda.
 */
export function jaDesbloqueouNo(
  desbloqueados: readonly NoDesbloqueado[],
  noId: string,
): boolean {
  return desbloqueados.some((n) => n.noId === noId);
}

/**
 * Terceiro estado visual da árvore (GH-ARV-02): o nó é estruturalmente
 * alcançável (não `locked`) e ainda não foi desbloqueado, mas a maturidade
 * atual do negócio não atende `requisitos` — distinto de "bloqueado", que é
 * uma condição estrutural (hoje só `infra`, estático no catálogo).
 *
 * `atributos` ausente (modo demo, sem sessão) nunca marca inalcançável —
 * mesma regra de degradação limpa de `atributosFaltantes` em GH-ATR-03.
 */
export function noInalcancavel(
  node: Pick<HexNode, "locked" | "requisitos">,
  desbloqueado: boolean,
  atributos: Atributos | undefined,
): boolean {
  if (node.locked || desbloqueado || !atributos) return false;
  return atributosFaltantes(atributos, node.requisitos).length > 0;
}
