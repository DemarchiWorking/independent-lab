"use server";

import { revalidatePath } from "next/cache";
import { souAdminIA } from "@/lib/admin";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { aplicarEdicaoAdmin, gravarConfig, lerConfig } from "./config";
import { lerBatimento } from "./fila";
import { coletar, varrer, type ResumoColeta, type ResumoVarredura } from "./servico-ia";

/**
 * Ações da tela `/admin/ia`. Toda ação confere a sessão E o e-mail do admin da
 * IA no servidor: esconder o botão na tela não protege nada (mesma regra de
 * `eventos-globais/actions.ts`).
 */

export interface ResultadoSalvar {
  ok: boolean;
  erro?: string;
  mudancas?: string[];
}

async function exigirAdminIA(): Promise<{ ok: true } | { ok: false; erro: string }> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!souAdminIA(sessao.email)) return { ok: false, erro: "Você não tem permissão para alterar a configuração da IA." };
  return { ok: true };
}

/**
 * Salva a configuração. Todo valor é validado em `aplicarEdicaoAdmin`; o que
 * chega aqui é entrada de cliente e só vale depois dessa validação.
 */
export async function salvarConfigIA(entrada: unknown): Promise<ResultadoSalvar> {
  const guarda = await exigirAdminIA();
  if (!guarda.ok) return guarda;
  const sessao = await lerSessao();
  const atual = await lerConfig();
  const r = aplicarEdicaoAdmin(atual, entrada, { por: sessao?.email ?? "admin", agora: new Date(), batimento: await lerBatimento() });
  if (!r.ok) return { ok: false, erro: r.erro };
  await gravarConfig(r.config);
  console.info(JSON.stringify({ evento: "ia-config", mudancas: r.mudancas }));
  revalidatePath("/admin/ia");
  return { ok: true, mudancas: r.mudancas };
}

export interface ResultadoRodar {
  ok: boolean;
  erro?: string;
  coleta?: ResumoColeta;
  varredura?: ResumoVarredura;
}

/** "Rodar agora": recolhe resultados e faz a varredura de melhoria sem esperar a hora cheia. */
export async function rodarMelhoriaAgora(): Promise<ResultadoRodar> {
  const guarda = await exigirAdminIA();
  if (!guarda.ok) return guarda;
  const repo = getRepository();
  const coleta = await coletar(repo);
  const varredura = await varrer(repo);
  revalidatePath("/admin/ia");
  return { ok: true, coleta, varredura };
}

/** Quanto a ação de teste soma. Moeda virtual e XP do jogo: nunca R$, nunca crédito de API. */
const CREDITO_DE_TESTE = { xp: 1_000_000, moeda: 5_000_000, degraus: 4 } as const;

export interface ResultadoCredito {
  ok: boolean;
  erro?: string;
  moeda?: number;
  nivel?: number;
  degrau?: number;
}

/**
 * Dá saldo de teste (moeda virtual, XP e degraus) ao negócio DO PRÓPRIO admin da IA, para
 * testar o jogo e as contratações de ponta a ponta. Passa por `aplicarProgresso` (a única
 * porta de escrita da progressão). Em produção é recusada no servidor: a moeda virtual não
 * pode ser fabricada para ninguém num ambiente real.
 */
export async function creditarSaldoDeTeste(): Promise<ResultadoCredito> {
  if (process.env.NODE_ENV === "production") return { ok: false, erro: "Indisponível em produção." };
  const guarda = await exigirAdminIA();
  if (!guarda.ok) return guarda;
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const negocio = await getRepository().aplicarProgresso(sessao.tenantId, { ...CREDITO_DE_TESTE });
  console.info(JSON.stringify({ evento: "ia-credito-de-teste", tenant: sessao.tenantId, moeda: negocio.moedaVirtual }));
  revalidatePath("/admin/ia");
  return { ok: true, moeda: negocio.moedaVirtual, nivel: negocio.nivel, degrau: negocio.degrauAtual };
}
