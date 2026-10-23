import type { ContratoConcluido } from "@/lib/db/types";
import { diasParaRenovar, periodoDe } from "./periodo";
import type {
  Contrato,
  Evidencia,
  Requisito,
  SituacaoContrato,
  Verificacao,
} from "./tipos";

/**
 * Motor de contratos — puro e determinístico (mesmo contrato do motor de
 * história: nada de `Date.now()`, banco ou sorteio aqui dentro).
 */

/** O requisito vale para esta evidência? Devolve a dica quando não vale. */
function requisitoNaoAtendido(
  requisito: Requisito | undefined,
  evidencia: Evidencia,
): string | null {
  if (!requisito) return null;
  switch (requisito.tipo) {
    case "equipe":
      return evidencia.tamanhoEquipe >= requisito.minimo ? null : requisito.dica;
    case "alvoAlcancado":
      return evidencia.degrauAtual >= evidencia.degrauAlvo ? null : requisito.dica;
  }
}

/** A parte "de dentro do jogo" da verificação já foi feita neste período? */
function evidenciaPresente(
  verificacao: Verificacao,
  contrato: Contrato,
  evidencia: Evidencia,
  criadoEm: string,
  periodo: string,
): boolean {
  if (verificacao.tipo !== "oferta") return true;
  return evidencia.ofertasCriadasEm.some(
    (criada) => periodoDe(contrato.cadencia, criadoEm, criada) === periodo,
  );
}

/**
 * Situação de cada contrato do catálogo para este jogador, agora.
 * Ordem do catálogo preservada — a UI decide como agrupar.
 */
export function situacaoDosContratos(
  catalogo: readonly Contrato[],
  concluidos: readonly ContratoConcluido[],
  evidencia: Evidencia,
  criadoEm: string,
  agoraIso: string,
): SituacaoContrato[] {
  return catalogo.map((contrato) => {
    const periodo = periodoDe(contrato.cadencia, criadoEm, agoraIso);
    const base = {
      contrato,
      periodo,
      diasParaRenovar: diasParaRenovar(contrato.cadencia, criadoEm, agoraIso),
    };

    const feito = concluidos.find(
      (c) => c.contratoId === contrato.id && c.periodo === periodo,
    );
    if (feito) return { ...base, status: "concluido", valor: feito.valor };

    const faltou = requisitoNaoAtendido(contrato.requisito, evidencia);
    if (faltou) return { ...base, status: "bloqueado", motivo: faltou };

    if (!evidenciaPresente(contrato.verificacao, contrato, evidencia, criadoEm, periodo)) {
      return {
        ...base,
        status: "pendente",
        motivo: "Publique uma oferta nova na sua vitrine para liberar a recompensa.",
      };
    }
    return { ...base, status: "disponivel" };
  });
}

export type ResultadoValidacao =
  | { ok: true; periodo: string; valor: number | null }
  | { ok: false; erro: string };

/**
 * Valida um pedido de pagamento. É a ÚNICA porta de entrada para pagar um
 * contrato: o cliente manda só `contratoId` e (se o contrato pede) um número;
 * o período, a prova e a recompensa saem do servidor.
 */
export function validarConclusao(
  contrato: Contrato,
  concluidos: readonly ContratoConcluido[],
  evidencia: Evidencia,
  criadoEm: string,
  agoraIso: string,
  valorInformado: unknown,
): ResultadoValidacao {
  const [situacao] = situacaoDosContratos([contrato], concluidos, evidencia, criadoEm, agoraIso);

  if (situacao.status === "concluido") {
    return {
      ok: false,
      erro:
        situacao.diasParaRenovar !== undefined
          ? `Contrato já cumprido. Renova em ${situacao.diasParaRenovar} dia(s).`
          : "Contrato já cumprido.",
    };
  }
  if (situacao.status === "bloqueado" || situacao.status === "pendente") {
    return { ok: false, erro: situacao.motivo ?? "Contrato indisponível." };
  }

  const v = contrato.verificacao;
  if (v.tipo === "declaradoComValor") {
    if (
      typeof valorInformado !== "number" ||
      !Number.isInteger(valorInformado) ||
      valorInformado < 0 ||
      valorInformado > v.maximo
    ) {
      return {
        ok: false,
        erro: `Informe um número inteiro de 0 a ${v.maximo} em “${v.rotuloValor}”.`,
      };
    }
    return { ok: true, periodo: situacao.periodo, valor: valorInformado };
  }
  return { ok: true, periodo: situacao.periodo, valor: null };
}
