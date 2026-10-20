import type { ChildProcess, SpawnOptions } from "node:child_process";

/** Variáveis de ambiente (mais frouxo que `NodeJS.ProcessEnv`, que exige NODE_ENV). */
export type Ambiente = Record<string, string | undefined>;
import type {
  CodigoFalha,
  ConfigIA,
  ContadoresDia,
  EstadoFila,
  EstadoWorker,
  ModoIA,
  PedidoIA,
  UsoTokens,
} from "../src/features/equipe-ia/ia/contrato";

/** Tipos do worker (JavaScript puro, sem dependências). Ver `worker.mjs`. */

export declare const CONTRATO: 1;
export declare const VERSAO_WORKER: string;
export declare const ESTADOS: readonly EstadoFila[];

export interface DecisaoDeFalha {
  codigo: CodigoFalha;
  mensagem: string;
  esperaMs?: number | null;
}

export interface RespostaDoModelo {
  saida?: unknown;
  uso?: UsoTokens;
  falha?: DecisaoDeFalha;
  interrompido?: boolean;
  custoNocional?: number;
}

export type SpawnFn = (comando: string, args: readonly string[], opcoes: SpawnOptions) => ChildProcess;
export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

export interface EstadoDoWorkerInterno {
  pasta: string;
  env: Ambiente;
  relogio: () => Date;
  sleep: (ms: number, sinal?: AbortSignal) => Promise<void>;
  fetchImpl: FetchFn;
  spawnImpl: SpawnFn;
  bin: string;
  argsIniciais: string[];
  iniciadoEm: string;
  cliPronto: boolean | null;
  pausa: { ate: Date; motivo: string } | null;
  ultimo: EstadoWorker["ultimo"];
  ocupadoCom: string | null;
  hoje: ContadoresDia;
  sinal: AbortSignal | null;
}

export interface OpcoesCriarEstado {
  pasta: string;
  env?: Ambiente;
  relogio?: () => Date;
  sleep?: (ms: number, sinal?: AbortSignal) => Promise<void>;
  fetchImpl?: FetchFn;
  spawnImpl?: SpawnFn;
  bin?: string;
  argsIniciais?: string[];
}

export declare function dormir(ms: number, sinal?: AbortSignal): Promise<void>;
export declare function diaUtc(data: Date): string;
export declare function proximaMeiaNoiteUtc(data: Date): Date;
export declare function escreverJson(arquivo: string, dados: unknown): Promise<void>;
export declare function idValido(id: unknown): id is string;

export declare function classificarHttp(
  status: number,
  corpo: unknown,
  cabecalhos?: { get(nome: string): string | null },
): DecisaoDeFalha;
export declare function classificarCli(texto: unknown): DecisaoDeFalha;
export declare function custoEstimado(config: ConfigIA | null, modelo: string, uso: UsoTokens): number;
export declare function extrairJson(texto: unknown): unknown;

export declare function chamarApi(opcoes: {
  pedido: PedidoIA;
  config: ConfigIA | null;
  env: Ambiente;
  fetchImpl?: FetchFn;
  sinal?: AbortSignal | null;
}): Promise<RespostaDoModelo>;

export declare function ambienteDoCli(env: Ambiente, casa: string): Record<string, string>;
export declare function chamarCli(opcoes: {
  pedido: PedidoIA;
  env: Ambiente;
  bin?: string;
  argsIniciais?: string[];
  spawnImpl?: SpawnFn;
  sinal?: AbortSignal | null;
}): Promise<RespostaDoModelo>;

export declare function modosDisponiveis(env: Ambiente, cliPronto: boolean): ModoIA[];
export declare function recuperarOrfaos(pasta: string, agora: Date): Promise<number>;
export declare function limparAntigos(pasta: string, agora: Date): Promise<number>;
export declare function escolherProximo(pasta: string, agora: Date): Promise<PedidoIA | null>;

export declare function criarEstado(opcoes: OpcoesCriarEstado): EstadoDoWorkerInterno;
export declare function ciclo(
  est: EstadoDoWorkerInterno,
): Promise<{ acao: string; motivo?: string; id?: string; resultado?: EstadoWorker["ultimo"] }>;
export declare function rodar(
  est: EstadoDoWorkerInterno,
  opcoes?: { sinal?: AbortSignal; maxCiclos?: number },
): Promise<number>;
