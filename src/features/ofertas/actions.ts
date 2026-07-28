"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";

export interface ResultadoOferta {
  ok: boolean;
  erro?: string;
}

const LIMITE_OFERTAS = 12;

/**
 * Publica uma oferta na vitrine do negócio (`GameRepository.criarOferta` já
 * existia sem nenhum produtor até agora — este é o primeiro. Aparece tanto
 * na página pública `/n/[slug]` (GH-GROW-01) quanto, futuramente, em
 * qualquer outro lugar que já lê `listarOfertas`).
 */
export async function publicarOferta(
  titulo: string,
  descricao: string,
  preco: string,
): Promise<ResultadoOferta> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const t = titulo.trim();
  if (!t) return { ok: false, erro: "Informe um título para a oferta." };
  if (t.length > 120) return { ok: false, erro: "Título muito longo." };
  if (descricao.length > 500) return { ok: false, erro: "Descrição muito longa." };

  const repo = getRepository();
  const atuais = await repo.listarOfertas(sessao.tenantId);
  if (atuais.length >= LIMITE_OFERTAS) {
    return { ok: false, erro: `Limite de ${LIMITE_OFERTAS} ofertas publicadas.` };
  }

  await repo.criarOferta({
    tenantId: sessao.tenantId,
    titulo: t,
    descricao: descricao.trim(),
    preco: preco.trim(),
    criadaEm: new Date().toISOString(),
  });

  revalidatePath("/painel");
  return { ok: true };
}
