"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { souAdmin } from "@/lib/admin";
import { normalizar } from "./motor";
import { ehStatus, ehTipoServico, type SolicitacaoView } from "./tipos";

/**
 * Server Actions da feature labdatadev. Toda regra é RE-checada aqui — a UI
 * pode esconder um botão, mas a garantia real é server-side (AGENTS.md).
 * Cliente: cria e lista as PRÓPRIAS solicitações. Admin (`souAdmin`): vê
 * todas e muda status.
 */

export interface ResultadoSolicitacao {
  ok: boolean;
  erro?: string;
  solicitacao?: SolicitacaoView;
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

  const bruto = await getRepository().criarSolicitacao({
    tenantId: sessao.tenantId,
    tipo: input.tipo,
    titulo,
    descricao,
  });

  revalidatePath("/labdatadev");
  revalidatePath("/admin/labdatadev");
  return { ok: true, solicitacao: normalizar(bruto) };
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
  if (!sessao || !souAdmin(sessao.email)) return [];
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
  if (!souAdmin(sessao.email)) {
    return { ok: false, erro: "Você não tem permissão para gerir solicitações." };
  }
  if (!ehStatus(status)) return { ok: false, erro: "Status inválido." };

  const bruto = await getRepository().atualizarStatusSolicitacao(id, status);
  revalidatePath("/admin/labdatadev");
  revalidatePath("/labdatadev");
  return { ok: true, solicitacao: normalizar(bruto) };
}
