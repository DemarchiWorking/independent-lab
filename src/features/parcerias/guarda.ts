import type { NoDesbloqueado } from "@/lib/db/types";

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
