import type { SolicitacaoServico } from "@/lib/db/types";
import {
  ehStatus,
  ehTipoServico,
  FLUXO_STATUS,
  type SolicitacaoView,
  type StatusSolicitacao,
  type TipoServico,
} from "./tipos";

/**
 * Regras PURAS da feature labdatadev — sem I/O, sem relógio escondido (datas
 * chegam prontas nas próprias solicitações). Testado em `motor.test.ts`. As
 * telas (cliente e admin) e as Server Actions consomem estas funções; a
 * fonte de verdade da mutação continua no servidor.
 */

/** Estreita uma solicitação do domínio (tipos `string`) para a `View` da UI.
 *  Com `check` na migration, os valores sempre são válidos; o fallback existe
 *  só para nunca quebrar a tela se um dado legado escapar. */
export function normalizar(s: SolicitacaoServico): SolicitacaoView {
  const tipo: TipoServico = ehTipoServico(s.tipo) ? s.tipo : "funcionalidade";
  const status: StatusSolicitacao = ehStatus(s.status) ? s.status : "recebida";
  return { ...s, tipo, status };
}

/** Mais recentes primeiro (por data de criação ISO — string comparável). */
export function ordenarPorRecentes(lista: SolicitacaoView[]): SolicitacaoView[] {
  return lista.slice().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** "Aberta" = ainda em atendimento (nem entregue, nem recusada). É a métrica
 *  de fila que importa no painel admin. */
export function estaAberta(s: SolicitacaoView): boolean {
  return s.status !== "entregue" && s.status !== "recusada";
}

/** Próximo status no funil, ou `null` quando é terminal (entregue/recusada)
 *  — usado pelo botão "avançar" do painel admin. */
export function proximoStatus(status: StatusSolicitacao): StatusSolicitacao | null {
  const i = FLUXO_STATUS.indexOf(status);
  if (i === -1) return null; // recusada é terminal
  return FLUXO_STATUS[i + 1] ?? null; // entregue é o fim do fluxo
}

export interface ResumoAdmin {
  total: number;
  abertas: number;
  entregues: number;
  porStatus: Record<StatusSolicitacao, number>;
  porTipo: Record<TipoServico, number>;
}

/** Painel de indicadores do admin: totais e distribuição — a "informação"
 *  que o CTO/investidor vê de relance. */
export function resumoAdmin(lista: SolicitacaoView[]): ResumoAdmin {
  const porStatus: Record<StatusSolicitacao, number> = {
    recebida: 0,
    em_analise: 0,
    em_producao: 0,
    entregue: 0,
    recusada: 0,
  };
  const porTipo: Record<TipoServico, number> = {
    site: 0,
    app: 0,
    automacao: 0,
    funcionalidade: 0,
  };
  for (const s of lista) {
    porStatus[s.status] += 1;
    porTipo[s.tipo] += 1;
  }
  return {
    total: lista.length,
    abertas: lista.filter(estaAberta).length,
    entregues: porStatus.entregue,
    porStatus,
    porTipo,
  };
}
