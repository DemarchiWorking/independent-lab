"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { EVENTOS } from "@/features/gamificacao/engine";
import { jaFormouParceria } from "./guarda";

export interface ResultadoParceriaMapa {
  ok: boolean;
  erro?: string;
}

/**
 * Forma parceria com um vizinho de quarteirão (GH-FDN-03) — persiste e
 * fecha, no mesmo movimento, um farm hole que já existia: `parceria_formada`
 * rodava pelo dispatcher genérico `recompensar()` sem nenhuma guarda de
 * idempotência (só o `useState` local de `MapaScreen` impedia o re-clique,
 * perdido a cada reload). Fora de `recompensar()` pelo mesmo motivo de
 * `desbloquearNo`: a validação real ("é mesmo vizinho?") não cabe no
 * dispatcher genérico.
 */
export async function formarParceria(vizinhoTenantId: string): Promise<ResultadoParceriaMapa> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const repo = getRepository();
  const formadas = await repo.listarParceriasFormadas(sessao.tenantId);
  if (jaFormouParceria(formadas, vizinhoTenantId)) {
    return { ok: false, erro: "Você já formou parceria com esse vizinho." };
  }

  const def = EVENTOS.parceria_formada;
  try {
    await repo.formarParceria(
      sessao.tenantId,
      vizinhoTenantId,
      def.xp,
      def.moeda,
      def.atributo ? { [def.atributo.chave]: def.atributo.ganho } : undefined,
    );
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  await repo.incrementarProgressoEventos(sessao.tenantId, "parceria_formada");

  revalidatePath("/hub");
  revalidatePath("/painel");
  return { ok: true };
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("vizinho_invalido")) {
    return "Esse negócio não é seu vizinho de quarteirão.";
  }
  if (msg.includes("parceria_ja_formada")) {
    return "Você já formou parceria com esse vizinho.";
  }
  return "Não foi possível concluir. Tente novamente.";
}
