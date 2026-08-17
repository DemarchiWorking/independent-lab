"use server";

import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import type { ClienteAdmin } from "@/lib/db/types";

/**
 * Todos os clientes (negócios) com onboarding + assinaturas — só admin.
 * Mesmo padrão de `listarTodosEventos`/`listarTodasSolicitacoesAdmin`:
 * lista vazia (não erro) para quem não tem `role === "admin"`.
 */
export async function listarClientesAdminAction(): Promise<ClienteAdmin[]> {
  const sessao = await lerSessao();
  if (!sessao || sessao.role !== "admin") return [];
  return getRepository().listarClientesAdmin();
}
