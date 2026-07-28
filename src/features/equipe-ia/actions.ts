"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { cargoPorId } from "./catalogo";
import {
  custoEvolucao,
  ganhoEvolucao,
  NIVEL_MAX_FUNCIONARIO,
} from "./habilidades";

export interface ResultadoEvolucao {
  ok: boolean;
  erro?: string;
}

/**
 * Sobe o nível de um Funcionário de IA (GH-EQP-04) — destrava habilidades
 * e aprofunda o entregável que ele produz.
 *
 * Action dedicada (fora do dispatcher genérico `recompensar()`) pelo mesmo
 * motivo de `desbloquearNo`/`comprarMobilia`: tem custo variável e precisa
 * de débito atômico. Guarda dupla — checagem amigável aqui, garantia real
 * na RPC `evoluir_funcionario`.
 */
export async function evoluirFuncionario(
  funcionarioId: string,
): Promise<ResultadoEvolucao> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const repo = getRepository();
  const funcionarios = await repo.listarFuncionarios(sessao.tenantId);
  // procurar na lista do PRÓPRIO tenant já garante posse: um id de outro
  // tenant simplesmente não aparece aqui (a RPC checa de novo, de todo jeito)
  const funcionario = funcionarios.find((f) => f.id === funcionarioId);
  if (!funcionario) return { ok: false, erro: "Funcionário não encontrado." };

  const novoNivel = funcionario.nivel + 1;
  if (novoNivel > NIVEL_MAX_FUNCIONARIO) {
    return { ok: false, erro: "Este agente já está no nível máximo." };
  }

  const custo = custoEvolucao(novoNivel);
  if (custo === undefined) return { ok: false, erro: "Nível inválido." };

  const negocio = await repo.lerNegocio(sessao.tenantId);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };
  if (negocio.moedaVirtual < custo) {
    return { ok: false, erro: "Saldo de moeda insuficiente." };
  }

  try {
    await repo.evoluirFuncionario(sessao.tenantId, funcionarioId, novoNivel, custo);
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  // Ganho de atributo no eixo que o cargo já fortalece — fora da transação
  // do débito de propósito: é recompensa de gamificação, não parte da
  // integridade da compra (mesma separação de `evoluirSede`).
  const cargo = cargoPorId(funcionario.cargoId);
  if (cargo) {
    await repo.aplicarProgresso(sessao.tenantId, {
      xp: 0,
      moeda: 0,
      degraus: 0,
      atributos: ganhoEvolucao(cargo.eixoFortalecido),
    });
  }

  revalidatePath("/hub");
  revalidatePath("/painel");
  return { ok: true };
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("saldo_insuficiente")) return "Saldo de moeda insuficiente.";
  if (msg.includes("nivel_invalido")) {
    return "O nível deste agente mudou — atualize a página.";
  }
  if (msg.includes("funcionario_nao_encontrado")) {
    return "Funcionário não encontrado.";
  }
  return "Não foi possível concluir. Tente novamente.";
}
