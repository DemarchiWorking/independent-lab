"use server";

import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { CATALOGO_HISTORIA } from "@/features/historia/catalogo";
import { DOCUMENTOS_CATALOGO, documentoDoCatalogo, origemDoDocumento } from "./catalogo";
import { gerarDiagnostico, gerarDocumentoNarrativo, VERSAO_METODOLOGIA } from "./motor";
import { DOCUMENTO_DIAGNOSTICO } from "./tipos";
import type { Diagnostico, DocumentoNarrativo } from "./motor";
import type { DocumentoCatalogo, DocumentoEmitido, DocumentoId } from "./tipos";

/**
 * Leitura (+ registro de emissão, para o Diagnóstico) dos documentos do
 * acervo. Chamado DIRETO de Server Components (`src/app/documentos/**`),
 * mesmo padrão de `historia/actions.ts` → `capituloAtual()` — este arquivo
 * tem `"use server"` mas não existe só para formulário; ver o comentário
 * daquele arquivo se a razão não for óbvia.
 *
 * Todo retorno `null` aqui é "sem sessão ou sem direito a ver isto" — nunca
 * um erro lançado, porque a UI (página/rota) decide o 404/redirect, não este
 * módulo.
 */

export interface DiagnosticoView {
  diagnostico: Diagnostico;
  emissao: DocumentoEmitido;
}

/** Gera o Diagnóstico do negócio da sessão e registra a emissão. Sempre
 *  disponível — não depende de nenhuma escolha de história. */
export async function obterDiagnostico(): Promise<DiagnosticoView | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;

  const repo = getRepository();
  const [negocio, onboarding] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.lerOnboarding(sessao.tenantId),
  ]);
  if (!negocio) return null;

  const agoraIso = new Date().toISOString();
  const diagnostico = gerarDiagnostico(negocio, onboarding, agoraIso);
  const emissao = await repo.registrarEmissaoDocumento(
    sessao.tenantId,
    DOCUMENTO_DIAGNOSTICO,
    VERSAO_METODOLOGIA,
    agoraIso,
  );

  return { diagnostico, emissao: { ...emissao, docId: DOCUMENTO_DIAGNOSTICO } };
}

export interface DocumentoNarrativoView {
  catalogo: DocumentoCatalogo;
  documento: DocumentoNarrativo;
}

/**
 * Um documento narrativo só existe para quem RESOLVEU a escolha dona dele
 * (`capitulos_entregues.escolha_id`) — nunca é gerado "adiantado". `null`
 * cobre tanto "id desconhecido" quanto "ainda não desbloqueou".
 */
export async function obterDocumentoNarrativo(
  docId: DocumentoId,
): Promise<DocumentoNarrativoView | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;

  const origem = origemDoDocumento(docId);
  if (!origem) return null;

  const entregues = await getRepository().listarCapitulosEntregues(sessao.tenantId);
  const desbloqueado = entregues.some(
    (c) => c.capituloId === origem.capituloId && c.escolhaId === origem.escolhaId,
  );
  if (!desbloqueado) return null;

  const capitulo = CATALOGO_HISTORIA.find((c) => c.id === origem.capituloId);
  const escolha = capitulo?.escolhas.find((e) => e.id === origem.escolhaId);
  // defensivo: só acontece se o catálogo de história mudar depois que
  // alguém já tinha desbloqueado — o dado persistido não muda com o deploy
  if (!capitulo || !escolha) return null;

  return {
    catalogo: documentoDoCatalogo(docId),
    documento: gerarDocumentoNarrativo(capitulo, escolha),
  };
}

export interface ItemAcervo {
  catalogo: DocumentoCatalogo;
  disponivel: boolean;
}

/** A lista completa do acervo, com o que já está disponível marcado —
 *  para a tela `/documentos` nunca esconder o que existe, só sinalizar
 *  o que falta desbloquear. */
export async function listarAcervo(): Promise<ItemAcervo[] | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;

  const entregues = await getRepository().listarCapitulosEntregues(sessao.tenantId);
  const resolvidos = new Set(
    entregues.filter((c) => c.escolhaId).map((c) => `${c.capituloId}:${c.escolhaId}`),
  );

  return DOCUMENTOS_CATALOGO.map((doc) => {
    if (doc.id === DOCUMENTO_DIAGNOSTICO) {
      return { catalogo: doc, disponivel: true };
    }
    const origem = origemDoDocumento(doc.id);
    const disponivel = origem ? resolvidos.has(`${origem.capituloId}:${origem.escolhaId}`) : false;
    return { catalogo: doc, disponivel };
  });
}
