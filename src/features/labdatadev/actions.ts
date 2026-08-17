"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { normalizar } from "./motor";
import {
  DEGRAU_MINIMO_LABDATADEV,
  ehStatus,
  ehTipoServico,
  XP_PRIMEIRA_SOLICITACAO,
  type SolicitacaoView,
} from "./tipos";

/**
 * Server Actions da feature labdatadev. Toda regra é RE-checada aqui — a UI
 * pode esconder um botão, mas a garantia real é server-side (AGENTS.md).
 * Cliente: cria e lista as PRÓPRIAS solicitações. Admin (`sessao.role ===
 * "admin"`): vê todas e muda status.
 */

export interface ResultadoSolicitacao {
  ok: boolean;
  erro?: string;
  solicitacao?: SolicitacaoView;
  /** XP concedido nesta ação (só no 1º pedido). `undefined`/0 = nada a exibir. */
  ganhoXp?: number;
}

const TITULO_MAX = 120;
const DESCRICAO_MAX = 2000;

/** Cliente pede um serviço (site/app/automação/nova funcionalidade). */
export async function criarSolicitacaoServico(input: {
  tipo: string;
  titulo: string;
  descricao: string;
}): Promise<ResultadoSolicitacao> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const repo = getRepository();

  // Gate por degrau — repetido no servidor (fonte de verdade), não só no
  // menu/rota. Sem negócio ou abaixo do degrau mínimo, não cria.
  const negocio = await repo.lerNegocio(sessao.tenantId);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };
  if (negocio.degrauAtual < DEGRAU_MINIMO_LABDATADEV) {
    return {
      ok: false,
      erro: `O estúdio labdatadev é liberado a partir do degrau ${DEGRAU_MINIMO_LABDATADEV}.`,
    };
  }

  if (!ehTipoServico(input.tipo)) {
    return { ok: false, erro: "Escolha um tipo de serviço válido." };
  }
  const titulo = input.titulo.trim();
  const descricao = input.descricao.trim();
  if (titulo.length < 3) return { ok: false, erro: "Dê um título ao pedido (mín. 3 letras)." };
  if (titulo.length > TITULO_MAX) return { ok: false, erro: `Título muito longo (máx. ${TITULO_MAX}).` };
  if (descricao.length < 10) {
    return { ok: false, erro: "Conte um pouco mais — descreva o que você precisa (mín. 10 letras)." };
  }
  if (descricao.length > DESCRICAO_MAX) {
    return { ok: false, erro: `Descrição muito longa (máx. ${DESCRICAO_MAX}).` };
  }

  // Anti-farm: XP só na PRIMEIRA solicitação deste tenant (checado antes de
  // criar). Repetir pedidos não paga de novo.
  const jaTinha = (await repo.listarSolicitacoesDoTenant(sessao.tenantId)).length > 0;

  const bruto = await repo.criarSolicitacao({
    tenantId: sessao.tenantId,
    tipo: input.tipo,
    titulo,
    descricao,
  });

  let ganhoXp = 0;
  if (!jaTinha) {
    // Progressão SÓ via aplicarProgresso (operação atômica, regra do AGENTS.md).
    await repo.aplicarProgresso(sessao.tenantId, {
      xp: XP_PRIMEIRA_SOLICITACAO,
      moeda: 0,
      degraus: 0,
      atributos: { presenca: 1 },
    });
    ganhoXp = XP_PRIMEIRA_SOLICITACAO;
  }

  revalidatePath("/labdatadev");
  revalidatePath("/admin/labdatadev");
  revalidatePath("/hub");
  return { ok: true, solicitacao: normalizar(bruto), ganhoXp };
}

/** Solicitações do cliente logado (dado privado dele). */
export async function listarMinhasSolicitacoes(): Promise<SolicitacaoView[]> {
  const sessao = await lerSessao();
  if (!sessao) return [];
  const lista = await getRepository().listarSolicitacoesDoTenant(sessao.tenantId);
  return lista.map(normalizar);
}

/** Todas as solicitações — só admin (painel de gestão). */
export async function listarTodasSolicitacoesAdmin(): Promise<SolicitacaoView[]> {
  const sessao = await lerSessao();
  if (!sessao || sessao.role !== "admin") return [];
  const lista = await getRepository().listarTodasSolicitacoes();
  return lista.map(normalizar);
}

/** Muda o status de uma solicitação — só admin. */
export async function mudarStatusSolicitacao(
  id: string,
  status: string,
): Promise<ResultadoSolicitacao> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (sessao.role !== "admin") {
    return { ok: false, erro: "Você não tem permissão para gerir solicitações." };
  }
  if (!ehStatus(status)) return { ok: false, erro: "Status inválido." };

  const bruto = await getRepository().atualizarStatusSolicitacao(id, status);
  revalidatePath("/admin/labdatadev");
  revalidatePath("/labdatadev");
  return { ok: true, solicitacao: normalizar(bruto) };
}
