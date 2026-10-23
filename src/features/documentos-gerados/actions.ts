"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import type { DocumentoGerado } from "@/lib/db/types";
import { construirFichaMarkdown, hashFicha } from "./contexto";

export interface ResultadoSolicitarDocumentacao {
  ok: boolean;
  erro?: string;
}

/**
 * Botão "Gerar/atualizar documentação de negócio" do `/painel`. Monta a
 * ficha a partir de TUDO que o jogo sabe do tenant (perfil multi-tenant) e
 * enfileira uma rodada — a RPC (`enfileirar_geracao_documento`, migration
 * 0037) é quem decide se já existe pendente ou se nada mudou desde a última
 * geração concluída (idempotente por hash, não duplicamos aqui).
 *
 * O motor headless (`document-engine/`, cron horário) é quem processa a
 * fila de verdade — esta action só GRAVA o pedido, nunca chama o Claude
 * diretamente (mantém a Server Action rápida, sem prender a request HTTP
 * aos ~minutos que uma geração real leva).
 */
export async function solicitarGeracaoDocumentos(): Promise<ResultadoSolicitarDocumentacao> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada — entre novamente." };

  const repo = getRepository();
  const [negocio, onboarding, ofertas, funcionarios, parcerias, sede] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.lerOnboarding(sessao.tenantId),
    repo.listarOfertas(sessao.tenantId),
    repo.listarFuncionarios(sessao.tenantId),
    repo.listarParceriasFormadas(sessao.tenantId),
    repo.lerSede(sessao.tenantId),
  ]);

  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };

  const ficha = construirFichaMarkdown({
    negocio,
    onboarding,
    ofertas,
    funcionarios,
    parcerias,
    sede,
  });

  try {
    await repo.enfileirarGeracaoDocumento(sessao.tenantId, ficha, hashFicha(ficha));
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao enfileirar." };
  }

  revalidatePath("/painel");
  return { ok: true };
}

/** Documentos já entregues ao tenant logado — usado pelo `/painel`. */
export async function listarMeusDocumentos(): Promise<DocumentoGerado[]> {
  const sessao = await lerSessao();
  if (!sessao) return [];
  return getRepository().listarMeusDocumentos(sessao.tenantId);
}
