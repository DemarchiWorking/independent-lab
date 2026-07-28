import type { LicaoConcluida } from "@/lib/db/types";

/**
 * Guarda anti-farm de lições (GH-EDU-01) — decisão pura, mesmo padrão de
 * `features/marketplace/guarda.ts`/`features/parcerias/guarda.ts`.
 *
 * A garantia REAL contra corrida é o `unique(tenant_id, licao_id)` na
 * migration `0020_licoes.sql`; esta função é a checagem amigável no
 * servidor (e o que decide se o botão mostra "Concluir" ou "Concluída").
 */
export function jaConcluiuLicao(
  concluidas: readonly LicaoConcluida[],
  licaoId: string,
): boolean {
  return concluidas.some((l) => l.licaoId === licaoId);
}
