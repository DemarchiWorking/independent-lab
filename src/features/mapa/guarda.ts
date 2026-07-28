import type { ParceriaFormada } from "@/lib/db/types";

/**
 * Guarda anti-farm de parcerias do Mapa (GH-FDN-03) — decisão pura, extraída
 * para ser testável sem depender de sessão/banco (mesmo padrão de
 * `features/parcerias/guarda.ts`/`features/marketplace/guarda.ts`).
 *
 * A garantia REAL contra corrida é o `unique(tenant_id, vizinho_tenant_id)`
 * na migration `0014_parcerias_mapa.sql`; esta função é a checagem amigável
 * no servidor, chamada em `formarParceria()` antes de aplicar XP/moeda.
 */
export function jaFormouParceria(
  formadas: readonly ParceriaFormada[],
  vizinhoTenantId: string,
): boolean {
  return formadas.some((p) => p.vizinhoTenantId === vizinhoTenantId);
}
