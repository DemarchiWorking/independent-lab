import type { TipoEntregavel } from "../habilidades";

/**
 * Contrato entre o app e o worker de IA (`ia-worker/worker.mjs`).
 *
 * Os dois lados NÃO compartilham código nem processo: conversam por arquivos
 * numa pasta de troca (o "spool"). Este arquivo é a fonte da verdade do
 * formato; o worker, que não tem dependências nem TypeScript, espelha os
 * mesmos campos em JavaScript, e `worker.test.ts` trava as duas pontas juntas.
 *
 *   app ──► pendente/<id>.json ──► worker ──► concluido/<id>.json ──► app
 *                                    │  (processando/ enquanto roda)
 *                                    └──► worker.json (batimento do worker)
 *
 * Por que arquivos e não HTTP: o worker é o único componente que guarda a
 * chave da Anthropic. Ele nunca abre porta, nunca recebe requisição de fora e
 * só enxerga os pedidos que o app decidiu enviar, nunca a pasta de dados
 * inteira. O app, que é a superfície pública, nunca vê a chave.
 */

export const VERSAO_CONTRATO = 1;

/** Como o worker se autentica na Anthropic. */
export type ModoIA = "api" | "assinatura";

/** `usuario`: alguém pediu e está esperando. `lote`: melhoria contínua. */
export type PrioridadeIA = "usuario" | "lote";

export type EstadoFila = "pendente" | "processando" | "concluido" | "falhou";

export const ESTADOS_FILA: readonly EstadoFila[] = ["pendente", "processando", "concluido", "falhou"];

export type CodigoFalha =
  | "auth"
  | "limite"
  | "gasto"
  | "sobrecarga"
  | "timeout"
  | "invalido"
  | "recusa"
  | "truncado"
  | "expirado"
  | "config"
  | "interno";

/** O que o app sabe sobre o pedido; o worker só devolve igual, sem ler. */
export interface MetaPedido {
  tenantId: string;
  tipo: TipoEntregavel;
  /** hash do contexto do negócio: resultado de contexto antigo é descartado */
  contextoHash: string;
  nivel: number;
  /** 1 = primeira geração; 2 em diante = refinos */
  rodada: number;
  /** versão do gerador e do prompt; mudar invalida o que foi gerado antes */
  geradorVersao: number;
  /** problemas da tentativa anterior, para a correção automática */
  feedback: string[] | null;
  /** quantas vezes o app já reenviou por saída inválida */
  reenvios: number;
}

export interface PedidoIA {
  contrato: typeof VERSAO_CONTRATO;
  id: string;
  criadoEm: string;
  expiraEm: string;
  prioridade: PrioridadeIA;
  modelo: string;
  maxTokens: number;
  sistema: string;
  entrada: string;
  /** JSON Schema da resposta; `null` = texto livre */
  schema: Record<string, unknown> | null;
  /** tentativas do worker (falhas transitórias) */
  tentativas: number;
  /** o worker não pega o pedido antes deste instante */
  naoAntesDe: string | null;
  meta: MetaPedido;
}

export interface UsoTokens {
  entrada: number;
  saida: number;
}

export interface ResultadoIA {
  contrato: typeof VERSAO_CONTRATO;
  id: string;
  estado: "concluido" | "falhou";
  meta: MetaPedido;
  modelo: string;
  modo: ModoIA;
  /** NÃO CONFIÁVEL: veio do modelo, influenciado por texto do usuário */
  saida: unknown;
  uso: UsoTokens;
  custoUsd: number;
  duracaoMs: number;
  finalizadoEm: string;
  motivo: CodigoFalha | null;
  mensagem: string | null;
}

export interface PrecoModelo {
  /** US$ por milhão de tokens */
  entradaUsdPorMTok: number;
  saidaUsdPorMTok: number;
  /** parâmetro `thinking` que o modelo exige para não gastar tokens pensando */
  thinking: Record<string, string> | null;
}

export interface LimitesIA {
  /** pedidos de refino por negócio por dia (cada um custa dinheiro) */
  pedidosPorNegocioDia: number;
  /** melhorias que a varredura horária pode enfileirar por vez */
  melhoriasPorVarredura: number;
  /** teto global de pedidos processados por dia */
  jobsPorDia: number;
  /** teto de gasto estimado por dia, em dólares; o worker para ao atingir */
  gastoMaxUsdDia: number;
  /** quantos refinos automáticos cada documento recebe antes de ficar "completo" */
  refinosPorDocumento: number;
}

export interface MudancaConfig {
  em: string;
  por: string;
  mudancas: string[];
}

export interface ConfigIA {
  contrato: typeof VERSAO_CONTRATO;
  /** chave geral: desligada, o worker não processa e o app não enfileira */
  ativa: boolean;
  modo: ModoIA;
  melhoriaContinua: boolean;
  modeloUsuario: string;
  modeloLote: string;
  maxTokensSaida: number;
  intervaloVarreduraMin: number;
  limites: LimitesIA;
  /** cobrança por requisição: desativada por enquanto (só o registro de uso existe) */
  cobrarPorRequisicao: false;
  modelos: Record<string, PrecoModelo>;
  atualizadoEm: string;
  atualizadoPor: string;
  historico: MudancaConfig[];
}

export interface ContadoresDia {
  dia: string;
  jobs: number;
  falhas: number;
  entradaTokens: number;
  saidaTokens: number;
  custoUsd: number;
}

/** Batimento do worker, lido pela tela do admin e pelo guardião da VPS. */
export interface EstadoWorker {
  contrato: typeof VERSAO_CONTRATO;
  pid: number;
  iniciadoEm: string;
  batimentoEm: string;
  versaoWorker: string;
  modoConfigurado: ModoIA | null;
  /** modos que este worker consegue usar (tem chave, token, binário) */
  modosDisponiveis: ModoIA[];
  pausadoAte: string | null;
  motivoPausa: string | null;
  ocupadoCom: string | null;
  ultimo: { id: string; estado: "concluido" | "falhou" | "devolvido"; motivo: CodigoFalha | null; em: string } | null;
  hoje: ContadoresDia;
}

/** Idade máxima do batimento para considerar o worker vivo. */
export const WORKER_VIVO_MS = 90_000;
