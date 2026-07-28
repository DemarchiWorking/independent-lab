import { itemMobilia } from "@/features/sede/catalogo";
import { cargoPorId } from "@/features/equipe-ia/catalogo";
import { nivelSede } from "@/features/sede/niveis";
import type { FuncionarioContratado, ItemMobiliaColocado } from "@/lib/db/types";

/**
 * Resumo financeiro (GH-FIN-01) — puro e testável, sem I/O.
 *
 * ⚠️ REGRA DE OURO DO PRODUTO: moeda virtual (🪙) e R$ real **nunca se
 * misturam**. Este módulo devolve os dois em campos separados e nunca
 * soma um no outro — a tela também os mostra em blocos distintos. Ver
 * `docs/CONTEXTO-NEGOCIO.md` §8 e a regra 6 do `AGENTS.md`.
 *
 * Não há histórico de transações no sistema, então "fluxo de caixa" aqui
 * é **projeção a partir do estado atual**, não extrato — e a tela precisa
 * dizer isso com todas as letras (nada de fingir relatório contábil).
 */

export interface ResumoFinanceiro {
  /** 🪙 saldo disponível agora */
  saldoVirtual: number;
  /** 🪙 custo fixo mensal SIMULADO da sede (nunca cobrado de verdade) */
  custoMensalVirtual: number;
  /** 🪙 valor investido em equipamentos (preço × nível de cada item) */
  patrimonioEquipamentos: number;
  /**
   * Meses que o saldo cobre no custo atual. `null` = custo zero (sede
   * alugada nível 1 ou própria) — "infinito" seria mentira numérica, e
   * `Infinity` vaza feio na tela.
   */
  runwayMeses: number | null;
  /** R$ REAL — assinatura mensal dos Funcionários de IA contratados.
   *  Compromisso de verdade, fora da economia do jogo. */
  compromissoMensalReal: number;
  /** quantos agentes compõem o compromisso acima */
  totalFuncionarios: number;
}

export function resumoFinanceiro(
  saldoVirtual: number,
  nivelSedeAtual: number,
  mobilia: readonly ItemMobiliaColocado[],
  funcionarios: readonly FuncionarioContratado[],
): ResumoFinanceiro {
  const custoMensalVirtual = nivelSede(nivelSedeAtual).custoMensal;

  const patrimonioEquipamentos = mobilia.reduce((total, colocado) => {
    const item = itemMobilia(colocado.itemId);
    return item ? total + item.preco * colocado.nivel : total;
  }, 0);

  const compromissoMensalReal = funcionarios.reduce((total, f) => {
    const cargo = cargoPorId(f.cargoId);
    return cargo ? total + cargo.precoMensal : total;
  }, 0);

  return {
    saldoVirtual,
    custoMensalVirtual,
    patrimonioEquipamentos,
    runwayMeses:
      custoMensalVirtual > 0 ? Math.floor(saldoVirtual / custoMensalVirtual) : null,
    compromissoMensalReal,
    totalFuncionarios: funcionarios.length,
  };
}

/** Alerta de saldo — texto único, para a tela não decidir regra de negócio. */
export function alertaDeSaldo(resumo: ResumoFinanceiro): string | null {
  if (resumo.runwayMeses === null) return null;
  if (resumo.runwayMeses === 0) {
    return "Seu saldo não cobre o próximo mês da sede. Aceite um trabalho no Marketplace para recompor.";
  }
  if (resumo.runwayMeses <= 2) {
    return `Seu saldo cobre cerca de ${resumo.runwayMeses} ${resumo.runwayMeses === 1 ? "mês" : "meses"} de sede. Vale reforçar o caixa.`;
  }
  return null;
}
