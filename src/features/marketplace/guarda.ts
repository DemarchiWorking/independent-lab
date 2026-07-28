import type { TrabalhoAceito } from "@/lib/db/types";

/**
 * Guarda anti-farm do marketplace (GH-FDN-01) — decisão pura, extraída para
 * ser testável sem depender de sessão/banco (mesmo padrão de
 * `features/historia/motor.ts`).
 *
 * A garantia REAL contra corrida é o `unique(tenant_id, job_id)` na
 * migration `0008_marketplace_trabalhos.sql`; esta função é a checagem
 * amigável no servidor, chamada em `recompensar()` antes de aplicar XP/moeda.
 */
export function jaAceitouTrabalho(
  aceitos: readonly TrabalhoAceito[],
  jobId: string,
): boolean {
  return aceitos.some((t) => t.jobId === jobId);
}
