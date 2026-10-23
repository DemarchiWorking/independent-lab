import type { AtributoChave } from "@tokens";

/**
 * Contratos — o "trabalho do dia a dia" do jogo (estilo Startup Panic).
 *
 * A história dá o enredo; o contrato dá o RITMO: algo concreto para fazer
 * esta semana que (a) paga moeda e (b) empurra o dono do negócio para vender
 * mais. É a fonte recorrente de 🪙 — sem ele, a moeda só entrava por eventos
 * únicos e o jogador esbarrava num teto de gastos sem ter como voltar a ganhar.
 */

/** Com que frequência o contrato pode ser cumprido. */
export type Cadencia =
  /** uma vez na vida do negócio */
  | "unico"
  /** uma vez por semana (renova toda segunda, horário de Brasília) */
  | "semanal"
  /** uma vez a cada ciclo de 90 dias a partir do cadastro */
  | "ciclo90";

/**
 * Natureza da entrega.
 *
 * - `real`: a ação acontece FORA do jogo (vender, falar com cliente, publicar
 *   um post). O jogo confia no que o dono declara — e por isso a recompensa é
 *   fixa e independente do número declarado: não há ganho em mentir.
 * - `gamificada`: a ação acontece DENTRO do jogo e o sistema comprova sozinho
 *   (oferta publicada, Funcionário de IA contratado).
 */
export type Entrega = "real" | "gamificada";

/** Como o servidor decide se o contrato pode ser pago. */
export type Verificacao =
  /** o dono confirma que fez */
  | { tipo: "declarado" }
  /** o dono confirma e informa um número (ex.: vendas fechadas) */
  | { tipo: "declaradoComValor"; rotuloValor: string; maximo: number }
  /** comprovado: existe oferta publicada no período */
  | { tipo: "oferta" };

/** Pré-condição para o contrato aparecer como disponível. */
export type Requisito =
  | { tipo: "equipe"; minimo: number; dica: string }
  | { tipo: "alvoAlcancado"; dica: string };

export interface Recompensa {
  xp: number;
  moeda: number;
  atributos?: Partial<Record<AtributoChave, number>>;
}

/** Para onde o jogador vai fazer a parte de dentro do jogo. */
export type DestinoContrato =
  | { tipo: "view"; view: "equipe-ia" | "marketplace" | "parcerias" | "mapa" | "sede" }
  | { tipo: "rota"; href: string };

export interface Contrato {
  id: string;
  titulo: string;
  /** a ligação com vender mais — sempre explícita */
  descricao: string;
  cadencia: Cadencia;
  entrega: Entrega;
  verificacao: Verificacao;
  recompensa: Recompensa;
  requisito?: Requisito;
  /** onde fazer (opcional — contratos declarados não têm tela) */
  destino?: DestinoContrato;
  /** rótulo do botão final */
  rotuloAcao: string;
}

/** Prova que o servidor reúne do que já está persistido. */
export interface Evidencia {
  /** instantes de criação das ofertas publicadas */
  ofertasCriadasEm: readonly string[];
  tamanhoEquipe: number;
  degrauAtual: number;
  degrauAlvo: number;
}

export type StatusContrato =
  /** já cumprido neste período */
  | "concluido"
  /** pode ser cumprido agora */
  | "disponivel"
  /** falta fazer a parte de dentro do jogo (ex.: publicar a oferta) */
  | "pendente"
  /** falta uma pré-condição */
  | "bloqueado";

export interface SituacaoContrato {
  contrato: Contrato;
  /** chave do período corrente deste contrato */
  periodo: string;
  status: StatusContrato;
  /** explica `pendente`/`bloqueado` ao jogador */
  motivo?: string;
  /** valor declarado, quando concluído */
  valor?: number | null;
  /** dias até renovar (só para `semanal`/`ciclo90`) */
  diasParaRenovar?: number;
}
