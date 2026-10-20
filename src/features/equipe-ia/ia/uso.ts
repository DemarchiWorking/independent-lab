import { promises as fs } from "node:fs";
import path from "node:path";
import { travaDados } from "@/lib/db/arquivo";
import type { ResultadoIA } from "./contrato";
import { escreverAtomico, lerArquivoTolerante, pastaIA } from "./fila";

/**
 * Livro de uso da IA, por dia: quantos pedidos, quantos tokens e quanto
 * custaram, por negócio, por modelo e por modo. Hoje serve para a tela do
 * admin e para o teto de gasto. É também a base da cobrança por requisição,
 * que está DESATIVADA: nada aqui cobra de ninguém, só registra.
 *
 * Os valores em dólar são estimativas feitas com a tabela de preços do código
 * (`MODELOS_PADRAO`); a fatura da Anthropic é a fonte oficial.
 */

export interface Acumulado {
  jobs: number;
  falhas: number;
  entrada: number;
  saida: number;
  custoUsd: number;
}

export interface LivroDoDia {
  dia: string;
  total: Acumulado;
  porNegocio: Record<string, Acumulado>;
  porModelo: Record<string, Acumulado>;
  porModo: Record<string, Acumulado>;
}

const vazio = (): Acumulado => ({ jobs: 0, falhas: 0, entrada: 0, saida: 0, custoUsd: 0 });

const arquivoDoDia = (dia: string): string => path.join(pastaIA(), "uso", `${dia}.json`);

function somar(a: Acumulado | undefined, r: ResultadoIA): Acumulado {
  const base = a ?? vazio();
  return {
    jobs: base.jobs + (r.estado === "concluido" ? 1 : 0),
    falhas: base.falhas + (r.estado === "falhou" ? 1 : 0),
    entrada: base.entrada + r.uso.entrada,
    saida: base.saida + r.uso.saida,
    custoUsd: Math.round((base.custoUsd + r.custoUsd) * 1_000_000) / 1_000_000,
  };
}

export async function lerLivro(dia: string): Promise<LivroDoDia> {
  const l = await lerArquivoTolerante<LivroDoDia | null>(arquivoDoDia(dia), null);
  return l && l.dia === dia ? l : { dia, total: vazio(), porNegocio: {}, porModelo: {}, porModo: {} };
}

/** Soma o uso de um resultado (aceito, recusado ou obsoleto: o custo existiu de qualquer jeito). */
export async function registrarUso(r: ResultadoIA, agora: Date): Promise<void> {
  const dia = agora.toISOString().slice(0, 10);
  await travaDados.exclusivo(async () => {
    const l = await lerLivro(dia);
    l.total = somar(l.total, r);
    l.porNegocio[r.meta.tenantId] = somar(l.porNegocio[r.meta.tenantId], r);
    l.porModelo[r.modelo] = somar(l.porModelo[r.modelo], r);
    l.porModo[r.modo] = somar(l.porModo[r.modo], r);
    await escreverAtomico(arquivoDoDia(dia), l);
  });
}

/** Soma dos dias de um mês (`AAAA-MM`). */
export async function resumoDoMes(mes: string): Promise<Acumulado> {
  const total = vazio();
  let nomes: string[] = [];
  try {
    nomes = await fs.readdir(path.join(pastaIA(), "uso"));
  } catch {
    return total;
  }
  for (const nome of nomes) {
    if (!nome.startsWith(mes) || !nome.endsWith(".json")) continue;
    const l = await lerLivro(nome.slice(0, -5));
    total.jobs += l.total.jobs;
    total.falhas += l.total.falhas;
    total.entrada += l.total.entrada;
    total.saida += l.total.saida;
    total.custoUsd = Math.round((total.custoUsd + l.total.custoUsd) * 1_000_000) / 1_000_000;
  }
  return total;
}

// ------------------------------------------------------------- falhas recentes

export interface FalhaRecente {
  em: string;
  tipo: string;
  motivo: string;
  modo: string;
  modelo: string;
}

const arquivoFalhas = (): string => path.join(pastaIA(), "falhas.json");

/** As últimas falhas, para a tela do admin: sem texto de usuário e sem id de negócio. */
export async function registrarFalhaRecente(f: FalhaRecente): Promise<void> {
  await travaDados.exclusivo(async () => {
    const atuais = await lerArquivoTolerante<FalhaRecente[]>(arquivoFalhas(), []);
    const lista = Array.isArray(atuais) ? atuais : [];
    await escreverAtomico(arquivoFalhas(), [...lista, f].slice(-30));
  });
}

export async function lerFalhasRecentes(): Promise<FalhaRecente[]> {
  const f = await lerArquivoTolerante<FalhaRecente[]>(arquivoFalhas(), []);
  return Array.isArray(f) ? f.filter((x) => typeof x?.em === "string").slice(-30).reverse() : [];
}
