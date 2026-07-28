"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { itemMobilia } from "./catalogo";
import { nivelSede, proximoNivelSede } from "./niveis";

export interface ResultadoSede {
  ok: boolean;
  erro?: string;
}

/**
 * Evolui a sede para o próximo nível. A guarda de saldo é dupla: checada
 * aqui (mensagem amigável) E na RPC/adapter (autoritativa — nunca confia
 * só na checagem do servidor de UI). Mesmo princípio de
 * `features/gamificacao/actions.ts`.
 */
export async function evoluirSede(): Promise<ResultadoSede> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const repo = getRepository();
  const [sede, negocio] = await Promise.all([
    repo.lerSede(sessao.tenantId),
    repo.lerNegocio(sessao.tenantId),
  ]);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };

  const proximo = proximoNivelSede(sede.nivel);
  if (!proximo) return { ok: false, erro: "Sua sede já está no nível máximo." };
  if (negocio.moedaVirtual < proximo.custoEvolucao) {
    return { ok: false, erro: "Saldo de moeda insuficiente para evoluir." };
  }

  try {
    await repo.evoluirSede(
      sessao.tenantId,
      sede.nivel,
      proximo.nivel,
      proximo.custoEvolucao,
    );
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  revalidatePath("/hub");
  return { ok: true };
}

/** Compra um móvel e o coloca num slot livre da sala. */
export async function comprarMobilia(
  itemId: string,
  slot: number,
): Promise<ResultadoSede> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const item = itemMobilia(itemId);
  if (!item) return { ok: false, erro: "Item inválido." };

  const repo = getRepository();
  const [sede, negocio, mobiliaAtual] = await Promise.all([
    repo.lerSede(sessao.tenantId),
    repo.lerNegocio(sessao.tenantId),
    repo.listarMobiliaColocada(sessao.tenantId),
  ]);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };

  const capacidade = nivelSede(sede.nivel).slots;
  if (slot < 0 || slot >= capacidade) {
    return { ok: false, erro: "Esse espaço não existe na sua sede atual." };
  }
  if (mobiliaAtual.some((m) => m.slot === slot)) {
    return { ok: false, erro: "Esse espaço já está ocupado." };
  }
  if (negocio.moedaVirtual < item.preco) {
    return { ok: false, erro: "Saldo de moeda insuficiente." };
  }

  try {
    await repo.comprarMobilia(sessao.tenantId, itemId, slot, item.preco, item.bonus);
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  revalidatePath("/hub");
  return { ok: true };
}

/** Reposiciona um móvel já comprado para outro slot livre da sala. */
export async function moverMobilia(
  itemColocadoId: string,
  novoSlot: number,
): Promise<ResultadoSede> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const repo = getRepository();
  const [sede, mobiliaAtual] = await Promise.all([
    repo.lerSede(sessao.tenantId),
    repo.listarMobiliaColocada(sessao.tenantId),
  ]);

  const capacidade = nivelSede(sede.nivel).slots;
  if (novoSlot < 0 || novoSlot >= capacidade) {
    return { ok: false, erro: "Esse espaço não existe na sua sede atual." };
  }
  const item = mobiliaAtual.find((m) => m.id === itemColocadoId);
  if (!item || item.tenantId !== sessao.tenantId) {
    return { ok: false, erro: "Móvel não encontrado." };
  }
  if (mobiliaAtual.some((m) => m.slot === novoSlot && m.id !== itemColocadoId)) {
    return { ok: false, erro: "Esse espaço já está ocupado." };
  }

  try {
    await repo.moverMobilia(sessao.tenantId, itemColocadoId, novoSlot);
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  revalidatePath("/hub");
  return { ok: true };
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("saldo_insuficiente")) return "Saldo de moeda insuficiente.";
  if (msg.includes("slot_ocupado")) return "Esse espaço já está ocupado.";
  if (msg.includes("nivel_desatualizado")) {
    return "Sua sede já mudou de nível — atualize a página.";
  }
  return "Não foi possível concluir. Tente novamente.";
}
