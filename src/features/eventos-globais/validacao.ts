import { EVENTOS } from "@/features/gamificacao/engine";
import { ATRIBUTO_CHAVES } from "@/lib/atributos";
import { janelaValida } from "./motor";
import type { NovoEventoGlobal } from "./tipos";

/**
 * Limites de um evento global. O texto aparece no hub de TODOS os jogadores,
 * então tamanho é limitado; recompensas têm teto para um admin (ou uma conta
 * de admin comprometida) não conseguir quebrar a economia do jogo de uma vez.
 */
export const LIMITES_EVENTO = {
  titulo: 80,
  descricao: 400,
  metaMax: 1000,
  xpMax: 2000,
  moedaMax: 2000,
  ganhoAtributoMax: 10,
} as const;

function inteiroEntre(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

function dataIso(v: unknown): v is string {
  return typeof v === "string" && v.length <= 40 && !Number.isNaN(new Date(v).getTime());
}

/** Devolve a mensagem de erro, ou `null` se o evento for válido. */
export function validarNovoEvento(input: NovoEventoGlobal): string | null {
  if (typeof input !== "object" || input === null) return "Dados inválidos.";
  const titulo = typeof input.titulo === "string" ? input.titulo.trim() : "";
  const descricao = typeof input.descricao === "string" ? input.descricao.trim() : "";
  if (!titulo) return "Título obrigatório.";
  if (titulo.length > LIMITES_EVENTO.titulo) return `Título com no máximo ${LIMITES_EVENTO.titulo} caracteres.`;
  if (!descricao) return "Descrição obrigatória.";
  if (descricao.length > LIMITES_EVENTO.descricao) {
    return `Descrição com no máximo ${LIMITES_EVENTO.descricao} caracteres.`;
  }
  if (typeof input.objetivo !== "string" || !(input.objetivo in EVENTOS)) return "Objetivo inválido.";
  if (!inteiroEntre(input.meta, 1, LIMITES_EVENTO.metaMax)) {
    return `Meta deve ser um número inteiro entre 1 e ${LIMITES_EVENTO.metaMax}.`;
  }
  if (!dataIso(input.inicioEm) || !dataIso(input.fimEm) || !janelaValida(input.inicioEm, input.fimEm)) {
    return "A data de início deve ser antes da data de fim.";
  }
  const r = input.recompensa;
  if (typeof r !== "object" || r === null) return "Recompensa inválida.";
  if (!inteiroEntre(r.xp, 0, LIMITES_EVENTO.xpMax)) return `XP entre 0 e ${LIMITES_EVENTO.xpMax}.`;
  if (!inteiroEntre(r.moeda, 0, LIMITES_EVENTO.moedaMax)) return `Moeda entre 0 e ${LIMITES_EVENTO.moedaMax}.`;
  if (r.atributo !== undefined) {
    if (!ATRIBUTO_CHAVES.includes(r.atributo.chave)) return "Atributo inválido.";
    if (!inteiroEntre(r.atributo.ganho, 1, LIMITES_EVENTO.ganhoAtributoMax)) {
      return `Ganho de atributo entre 1 e ${LIMITES_EVENTO.ganhoAtributoMax}.`;
    }
  }
  return null;
}
