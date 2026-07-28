"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { EVENTOS } from "@/features/gamificacao/engine";
import { atributosFaltantes, mensagemRequisito } from "@/lib/atributos";
import { noPorId } from "./data";
import { jaDesbloqueouNo } from "./guarda";

export interface ResultadoParceria {
  ok: boolean;
  erro?: string;
}

/**
 * Desbloqueia um nó da árvore de parcerias, descontando o custo em moeda
 * virtual (GH-ARV-01). Não passa por `recompensar()` — o custo varia por nó
 * e precisa de checagem de saldo + débito atômicos, mesmo motivo de
 * `comprarMobilia`/`evoluirSede` terem action própria.
 *
 * Guarda dupla: aqui é a checagem amigável (saldo/já desbloqueado, mensagem
 * de UX); a garantia real é a RPC `desbloquear_no`, atômica no servidor.
 */
export async function desbloquearNo(noId: string): Promise<ResultadoParceria> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const no = noPorId(noId);
  if (!no) return { ok: false, erro: "Nó inválido." };
  if (no.locked) return { ok: false, erro: "Esse nó ainda está bloqueado." };

  const repo = getRepository();
  const [negocio, desbloqueados] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.listarNosDesbloqueados(sessao.tenantId),
  ]);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };
  if (jaDesbloqueouNo(desbloqueados, noId)) {
    return { ok: false, erro: "Você já desbloqueou esse nó." };
  }
  const faltantes = atributosFaltantes(negocio.atributos, no.requisitos);
  if (faltantes.length > 0) {
    return { ok: false, erro: mensagemRequisito(faltantes) };
  }
  if (negocio.moedaVirtual < no.custo) {
    return { ok: false, erro: "Saldo de moeda insuficiente." };
  }

  const def = EVENTOS.servico_desbloqueado;
  try {
    await repo.desbloquearNo(
      sessao.tenantId,
      noId,
      no.custo,
      def.xp,
      def.atributo ? { [def.atributo.chave]: def.atributo.ganho } : undefined,
      no.requisitos,
    );
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  // Eventos globais (Épico 11): "servico_desbloqueado" não passa por
  // `recompensar()` (ver comentário acima), então conta aqui — mesma regra,
  // depois da recompensa base já aplicada com sucesso.
  await repo.incrementarProgressoEventos(sessao.tenantId, "servico_desbloqueado");

  revalidatePath("/hub");
  revalidatePath("/painel");
  return { ok: true };
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("atributo_insuficiente")) {
    return "Sua maturidade ainda não atende ao requisito deste nó.";
  }
  if (msg.includes("saldo_insuficiente")) return "Saldo de moeda insuficiente.";
  if (msg.includes("no_ja_desbloqueado")) return "Você já desbloqueou esse nó.";
  return "Não foi possível concluir. Tente novamente.";
}
