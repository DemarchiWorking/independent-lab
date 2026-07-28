import type { AtributoChave } from "@tokens";
import type { FuncionarioContratado } from "@/lib/db/types";
import { cargoPorId, CONTRIBUICAO_ATRIBUTO_ALOCACAO } from "@/features/equipe-ia/catalogo";

/**
 * Soma da contribuição de atributo dos Funcionários de IA selecionados para
 * executar um job (GH-EQP-02) — pura e testável isoladamente, mesmo padrão
 * de `guarda.ts`. Cada um contribui `CONTRIBUICAO_ATRIBUTO_ALOCACAO` só no
 * eixo que já fortalece; cargos repetidos no mesmo eixo somam.
 */
export function contribuicaoDaEquipe(
  selecionados: readonly FuncionarioContratado[],
): Partial<Record<AtributoChave, number>> {
  const contribuicao: Partial<Record<AtributoChave, number>> = {};
  for (const f of selecionados) {
    const cargo = cargoPorId(f.cargoId);
    if (!cargo) continue;
    contribuicao[cargo.eixoFortalecido] =
      (contribuicao[cargo.eixoFortalecido] ?? 0) + CONTRIBUICAO_ATRIBUTO_ALOCACAO;
  }
  return contribuicao;
}
