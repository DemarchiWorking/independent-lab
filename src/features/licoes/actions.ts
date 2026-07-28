"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { licaoPorId, XP_LICAO } from "./catalogo";
import { jaConcluiuLicao } from "./guarda";

export interface ResultadoLicao {
  ok: boolean;
  erro?: string;
}

/**
 * Marca uma lição como concluída e concede XP (GH-EDU-01). Fora do
 * dispatcher genérico `recompensar()` de propósito: um evento genérico com
 * `contextoId` só para idempotência não tem precedente ali (todo branch
 * existente faz lookup de catálogo com regra de negócio própria) — mirar
 * `desbloquearNo`/`formarParceria` é mais fiel ao que já existe do que criar
 * um novo tipo de branch em `recompensar()`.
 */
export async function concluirLicao(licaoId: string): Promise<ResultadoLicao> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const licao = licaoPorId(licaoId);
  if (!licao) return { ok: false, erro: "Lição inválida." };

  const repo = getRepository();
  const concluidas = await repo.listarLicoesConcluidas(sessao.tenantId);
  if (jaConcluiuLicao(concluidas, licaoId)) {
    return { ok: true }; // idempotente: já concluída, não é erro reabrir
  }

  await repo.concluirLicao(sessao.tenantId, licaoId, XP_LICAO, {
    [licao.atributo]: 1,
  });

  revalidatePath("/hub");
  revalidatePath("/painel");
  return { ok: true };
}
