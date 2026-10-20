import type { ModoIA } from "../src/features/equipe-ia/ia/contrato";
import type { Ambiente, FetchFn, SpawnFn } from "./worker.mjs";

export declare function verificar(opcoes?: {
  env?: Ambiente;
  pasta?: string;
  chamada?: boolean;
  modo?: ModoIA;
  spawnImpl?: SpawnFn;
  fetchImpl?: FetchFn;
  bin?: string;
  argsIniciais?: string[];
}): Promise<{ linhas: string[]; pronto: boolean }>;
