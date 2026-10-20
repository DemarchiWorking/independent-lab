import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pastaDados, tenantIdValido } from "@/lib/db/arquivo";
import type { TipoEntregavel } from "../habilidades";
import {
  ESTADOS_FILA,
  WORKER_VIVO_MS,
  type EstadoFila,
  type EstadoWorker,
  type PedidoIA,
  type ResultadoIA,
} from "./contrato";

/**
 * Lado do app da pasta de troca com o worker (ver `contrato.ts`).
 *
 * Regras que mantêm isto seguro entre dois processos que não se coordenam:
 *  - cada arquivo tem UM escritor. O app só cria em `pendente/` e só apaga em
 *    `concluido/` e `falhou/`; o worker é quem move e grava nas demais pastas;
 *  - toda gravação é atômica (temporário + rename), então ninguém lê meio arquivo;
 *  - o app não confia no conteúdo de `concluido/`: valida tudo (ver `validar.ts`).
 */

const TIPOS: readonly TipoEntregavel[] = ["canvas", "pop", "carrossel", "comercial", "reel"];

/** Pasta de troca. No Docker é um volume só dela, montado também no worker. */
export function pastaIA(): string {
  const configurada = process.env.GAMEHUB_IA_DIR;
  return configurada ? path.resolve(configurada) : path.join(pastaDados(), "ia");
}

export const caminhoConfig = (): string => path.join(pastaIA(), "config.json");
export const caminhoBatimento = (): string => path.join(pastaIA(), "worker.json");
const arquivoDe = (estado: EstadoFila, id: string): string => path.join(pastaIA(), estado, `${id}.json`);

function codigoErro(e: unknown): string | undefined {
  return typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : undefined;
}

/** Grava de forma atômica, sem cópia `.bak` (a fila não é histórico). */
export async function escreverAtomico(arquivo: string, dados: unknown): Promise<void> {
  await fs.mkdir(path.dirname(arquivo), { recursive: true, mode: 0o700 });
  const tmp = `${arquivo}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(dados, null, 2), { encoding: "utf8", mode: 0o600 });
  try {
    for (let tentativa = 0; ; tentativa++) {
      try {
        await fs.rename(tmp, arquivo);
        return;
      } catch (e) {
        const c = codigoErro(e);
        if (tentativa >= 5 || (c !== "EPERM" && c !== "EBUSY" && c !== "EACCES")) throw e;
        await new Promise((r) => setTimeout(r, 20 * (tentativa + 1)));
      }
    }
  } catch (e) {
    await fs.rm(tmp, { force: true });
    throw e;
  }
}

/**
 * Lê JSON de arquivo da pasta de troca. Arquivo ausente OU ilegível devolve o
 * padrão: o que o worker grava pode estar errado e não pode derrubar o app.
 */
export async function lerArquivoTolerante<T>(arquivo: string, padrao: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(arquivo, "utf8")) as T;
  } catch {
    return padrao;
  }
}

// ------------------------------------------------------------------- pedidos

export function novoIdDePedido(tenantId: string, tipo: TipoEntregavel): string {
  if (!tenantIdValido(tenantId)) throw new Error("Identificador de negócio inválido.");
  return `${tenantId}-${tipo}-${randomBytes(4).toString("hex")}`;
}

/** `<tenant 24 hex>-<tipo>-<8 hex>`: o que o worker devolve em `id` é conferido contra isto. */
export function lerIdDePedido(id: string): { tenantId: string; tipo: TipoEntregavel } | null {
  const m = /^([0-9a-f]{24})-([a-z]+)-[0-9a-f]{8}$/.exec(id);
  if (!m || !(TIPOS as readonly string[]).includes(m[2])) return null;
  return { tenantId: m[1], tipo: m[2] as TipoEntregavel };
}

export async function enfileirar(pedido: PedidoIA): Promise<void> {
  if (!lerIdDePedido(pedido.id)) throw new Error("Id de pedido inválido.");
  await escreverAtomico(arquivoDe("pendente", pedido.id), pedido);
}

export async function listarIds(estado: EstadoFila): Promise<string[]> {
  try {
    const nomes = await fs.readdir(path.join(pastaIA(), estado));
    return nomes.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)).filter((id) => /^[a-z0-9-]{1,100}$/.test(id));
  } catch (e) {
    if (codigoErro(e) === "ENOENT") return [];
    throw e;
  }
}

export async function lerArquivoBruto(estado: EstadoFila, id: string): Promise<unknown> {
  return lerArquivoTolerante<unknown>(arquivoDe(estado, id), null);
}

export async function removerDaFila(estado: EstadoFila, id: string): Promise<void> {
  await fs.rm(arquivoDe(estado, id), { force: true });
}

export async function contarFila(): Promise<Record<EstadoFila, number>> {
  const contagem = { pendente: 0, processando: 0, concluido: 0, falhou: 0 } satisfies Record<EstadoFila, number>;
  for (const estado of ESTADOS_FILA) contagem[estado] = (await listarIds(estado)).length;
  return contagem;
}

/** Pedido ainda não terminado deste negócio e tipo (para não enfileirar em duplicidade). */
export async function pedidoAberto(
  tenantId: string,
  tipo: TipoEntregavel,
): Promise<{ id: string; estado: "pendente" | "processando"; posicao: number } | null> {
  const prefixo = `${tenantId}-${tipo}-`;
  const processando = (await listarIds("processando")).find((id) => id.startsWith(prefixo));
  if (processando) return { id: processando, estado: "processando", posicao: 0 };
  const pendentes = await listarIds("pendente");
  const meu = pendentes.find((id) => id.startsWith(prefixo));
  if (!meu) return null;
  return { id: meu, estado: "pendente", posicao: await posicaoNaFila(meu, pendentes) };
}

/** 1 = é o próximo. Conta usuário antes de lote, como o worker; empate pela data de criação. */
async function posicaoNaFila(id: string, pendentes: string[]): Promise<number> {
  const infos: Array<{ id: string; prioridade: string; criadoEm: string }> = [];
  for (const outro of pendentes) {
    const p = await lerArquivoBruto("pendente", outro);
    if (p && typeof p === "object") {
      const o = p as { prioridade?: unknown; criadoEm?: unknown };
      infos.push({ id: outro, prioridade: o.prioridade === "usuario" ? "usuario" : "lote", criadoEm: String(o.criadoEm ?? "") });
    }
  }
  infos.sort((a, b) => (a.prioridade !== b.prioridade ? (a.prioridade === "usuario" ? -1 : 1) : a.criadoEm.localeCompare(b.criadoEm)));
  const i = infos.findIndex((x) => x.id === id);
  return i < 0 ? infos.length + 1 : i + 1;
}

// ------------------------------------------------------------------ resultado

function inteiroNaoNegativo(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1e12;
}

/**
 * Confere o FORMATO de um resultado. O conteúdo de `saida` continua não
 * confiável; aqui só se garante que os metadados usados pelo app (a quem
 * pertence, de que tipo, quanto custou) são do tipo esperado e coerentes com o id.
 */
export function lerResultado(bruto: unknown, idDoArquivo: string): ResultadoIA | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const r = bruto as Record<string, unknown>;
  const meta = r.meta as Record<string, unknown> | undefined;
  const uso = r.uso as Record<string, unknown> | undefined;
  const dono = lerIdDePedido(idDoArquivo);
  if (!dono || r.id !== idDoArquivo || (r.estado !== "concluido" && r.estado !== "falhou")) return null;
  if (!meta || meta.tenantId !== dono.tenantId || meta.tipo !== dono.tipo) return null;
  if (typeof meta.contextoHash !== "string" || !inteiroNaoNegativo(meta.nivel) || !inteiroNaoNegativo(meta.rodada)) return null;
  if (!inteiroNaoNegativo(meta.geradorVersao) || !inteiroNaoNegativo(meta.reenvios)) return null;
  if (!uso || !inteiroNaoNegativo(uso.entrada) || !inteiroNaoNegativo(uso.saida)) return null;
  if (typeof r.custoUsd !== "number" || !Number.isFinite(r.custoUsd) || r.custoUsd < 0 || r.custoUsd > 1_000) return null;
  if (r.modo !== "api" && r.modo !== "assinatura") return null;
  if (typeof r.modelo !== "string" || r.modelo.length > 80) return null;
  return {
    contrato: 1,
    id: idDoArquivo,
    estado: r.estado,
    meta: {
      tenantId: dono.tenantId,
      tipo: dono.tipo,
      contextoHash: meta.contextoHash.slice(0, 64),
      nivel: meta.nivel,
      rodada: meta.rodada,
      geradorVersao: meta.geradorVersao,
      feedback: null,
      reenvios: meta.reenvios,
      prioridade: meta.prioridade === "usuario" ? "usuario" : "lote",
    },
    modelo: r.modelo,
    modo: r.modo,
    saida: r.saida,
    uso: { entrada: uso.entrada, saida: uso.saida },
    custoUsd: r.custoUsd,
    duracaoMs: inteiroNaoNegativo(r.duracaoMs) ? r.duracaoMs : 0,
    finalizadoEm: typeof r.finalizadoEm === "string" ? r.finalizadoEm : "",
    motivo: typeof r.motivo === "string" ? (r.motivo as ResultadoIA["motivo"]) : null,
    mensagem: typeof r.mensagem === "string" ? r.mensagem.slice(0, 300) : null,
  };
}

// ------------------------------------------------------------------ batimento

export async function lerBatimento(): Promise<EstadoWorker | null> {
  const b = await lerArquivoTolerante<unknown>(caminhoBatimento(), null);
  if (typeof b !== "object" || b === null) return null;
  const e = b as Partial<EstadoWorker>;
  if (typeof e.batimentoEm !== "string" || !Array.isArray(e.modosDisponiveis)) return null;
  return e as EstadoWorker;
}

export function workerVivo(batimento: EstadoWorker | null, agora: Date = new Date()): boolean {
  if (!batimento) return false;
  const t = new Date(batimento.batimentoEm).getTime();
  return Number.isFinite(t) && agora.getTime() - t < WORKER_VIVO_MS;
}
