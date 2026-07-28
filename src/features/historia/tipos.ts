import type { AtributoChave } from "@tokens";
import type { Segmento } from "@/lib/db/types";

/**
 * Tipos do motor de história — o fio narrativo que dá sentido temporal ao jogo.
 *
 * Ideia central: o jogador não recebe conteúdo porque clicou em algo, e sim
 * porque **o tempo passou** ou porque **o negócio dele chegou em algum lugar**.
 * É o que separa "app com pontos" de simulação com enredo.
 *
 * Ver docs/world/EVOLUCAO-MOTOR-2026.md §5.2 (relógio lazy) e §7.1 (pirâmide
 * de loops) — este módulo é o loop SEMANAL/TRIMESTRAL que faltava no meio.
 */

/**
 * O que faz um capítulo aparecer.
 *
 * Todos os gatilhos são avaliados contra um SNAPSHOT do estado (§`EstadoNarrativo`),
 * nunca contra um log de eventos. Isso é deliberado: derivar de estado é
 * idempotente e imune a evento perdido — reavaliar mil vezes dá o mesmo
 * resultado, que é exatamente o que um relógio *lazy* precisa.
 */
export type Gatilho =
  /** N dias corridos após o cadastro do negócio (relógio pessoal) */
  | { tipo: "diasAposCadastro"; dias: number }
  /** data absoluta no calendário — todo mundo recebe junto (evento global) */
  | { tipo: "dataFixa"; iso: string; janelaDias?: number }
  /** XP acumulado */
  | { tipo: "xpMinimo"; xp: number }
  /** degrau na escada de valor */
  | { tipo: "degrauMinimo"; degrau: number }
  /** um eixo da economia de atributos passou de um limiar */
  | { tipo: "atributoMinimo"; chave: AtributoChave; valor: number }
  /** um eixo ficou ABAIXO de um limiar — gatilho de dor, não de conquista */
  | { tipo: "atributoAbaixo"; chave: AtributoChave; valor: number }
  /** quantidade de Funcionários de IA contratados */
  | { tipo: "equipeMinima"; quantidade: number }
  /** encadeamento: só depois de resolver outro capítulo */
  | { tipo: "aposCapitulo"; capituloId: string }
  /** todos os gatilhos internos precisam valer */
  | { tipo: "todos"; de: readonly Gatilho[] };

/** Natureza da consequência — dirige a cor e o ícone na UI. */
export type TomEscolha = "beneficio" | "risco" | "neutro";

/**
 * Efeito de uma escolha sobre o negócio.
 *
 * Regra de produto inegociável (ver EVOLUCAO-MOTOR-2026.md §7.2): consequência
 * negativa é **custo de oportunidade**, nunca destruição de progresso. Por isso
 * não existe campo para remover degrau nem zerar atributo — o pior que uma
 * escolha faz é cobrar moeda ou deixar de dar um ganho. Há teste travando isso.
 */
export interface EfeitoEscolha {
  xp?: number;
  /** negativo = custo. O servidor nunca deixa o saldo ficar abaixo de zero. */
  moeda?: number;
  atributos?: Partial<Record<AtributoChave, number>>;
  /** libera um documento/playbook real do acervo labdatadev */
  documento?: string;
}

export interface Escolha {
  id: string;
  rotulo: string;
  /** o que o jogador está topando, em uma linha */
  descricao: string;
  tom: TomEscolha;
  efeito: EfeitoEscolha;
  /** texto mostrado depois de escolher — o desfecho */
  desfecho: string;
}

export interface Capitulo {
  id: string;
  /** ordem de exibição quando vários caem juntos (menor primeiro) */
  peso: number;
  titulo: string;
  /** de quem vem a mensagem — dá voz e mundo à narrativa */
  remetente: string;
  narrativa: string;
  gatilho: Gatilho;
  /** quando presente, o capítulo só vale para estes segmentos */
  segmentos?: readonly Segmento[];
  /** catálogo é dado imutável — daí `readonly` em toda a árvore */
  escolhas: readonly Escolha[];
}

/**
 * Snapshot do jogador contra o qual os gatilhos são avaliados.
 * Tudo aqui é derivável do que já persistimos — nenhuma tabela nova de eventos.
 */
export interface EstadoNarrativo {
  criadoEm: string;
  xp: number;
  degrauAtual: number;
  atributos: Record<AtributoChave, { valor: number; teto: number }>;
  segmento: Segmento;
  /** quantos Funcionários de IA estão contratados */
  tamanhoEquipe: number;
  /** ids de capítulos já RESOLVIDOS (jogador escolheu) */
  capitulosResolvidos: ReadonlySet<string>;
  /** ids de capítulos já entregues (abertos, com ou sem escolha) */
  capitulosEntregues: ReadonlySet<string>;
}
