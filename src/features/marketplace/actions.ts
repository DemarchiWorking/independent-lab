"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { aplicarGanhos, atributosFaltantes, mensagemRequisito } from "@/lib/atributos";
import { EVENTOS } from "@/features/gamificacao/engine";
import { jaAceitouTrabalho } from "./guarda";
import { jobPorId } from "./data";
import { contribuicaoDaEquipe } from "./contribuicao";

export interface ResultadoAceiteTrabalho {
  ok: boolean;
  erro?: string;
}

/**
 * Aceita um job do marketplace alocando os Funcionários de IA escolhidos
 * para executá-lo (GH-EQP-02) — fluxo em 2 etapas que substitui o antigo
 * 1-clique. Fora do dispatcher genérico `recompensar()` pelo mesmo motivo de
 * `desbloquearNo`: parâmetros extras (`funcionarioIds`) e múltiplas
 * alocações atômicas independentes, uma por funcionário.
 *
 * A contribuição da equipe só decide se o requisito é atendido — nunca é
 * somada de volta a `negocio.atributos` (o negócio não fica mais forte por
 * ter gente alocada; quem fica mais forte é a entrega). Por isso
 * `repo.aceitarTrabalho` é chamado SEM `job.requisitos` abaixo: o requisito
 * já foi checado aqui com a soma da equipe incluída — repassar
 * `job.requisitos` faria o RPC recusar de novo contra só a baseline do
 * negócio (sem a equipe), quebrando o propósito deste card.
 */
export async function aceitarTrabalhoComEquipe(
  jobId: string,
  funcionarioIds: string[],
): Promise<ResultadoAceiteTrabalho> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const job = jobPorId(jobId);
  if (!job) return { ok: false, erro: "Job inválido." };

  const repo = getRepository();
  const [negocio, aceitos, funcionarios] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.listarTrabalhosAceitos(sessao.tenantId),
    repo.listarFuncionarios(sessao.tenantId),
  ]);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };
  if (jaAceitouTrabalho(aceitos, jobId)) {
    return { ok: false, erro: "Você já aceitou esse trabalho." };
  }

  const selecionados = funcionarios.filter((f) => funcionarioIds.includes(f.id));
  if (selecionados.length !== funcionarioIds.length) {
    return { ok: false, erro: "Funcionário inválido." };
  }
  if (selecionados.some((f) => f.disponibilidade.estado !== "livre")) {
    return { ok: false, erro: "Algum funcionário selecionado não está mais livre." };
  }

  const atributosComEquipe = aplicarGanhos(negocio.atributos, contribuicaoDaEquipe(selecionados));
  const faltantes = atributosFaltantes(atributosComEquipe, job.requisitos);
  if (faltantes.length > 0) {
    return { ok: false, erro: mensagemRequisito(faltantes) };
  }

  try {
    for (const f of selecionados) {
      await repo.alocarFuncionario(sessao.tenantId, f.id, jobId, job.days);
    }
    await repo.aceitarTrabalho(sessao.tenantId, jobId);
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  // Mesma recompensa base do antigo 1-clique (EVENTOS.servico_contratado),
  // aplicada aqui em vez de via `recompensar()` — este fluxo já fez sua
  // própria checagem de requisito acima, ciente da equipe alocada.
  const def = EVENTOS.servico_contratado;
  const subeDegrau = Boolean(def.subeDegrau) && negocio.degrauAtual < 5;
  await repo.aplicarProgresso(sessao.tenantId, {
    xp: def.xp,
    moeda: def.moeda,
    degraus: subeDegrau ? 1 : 0,
    atributos: def.atributo ? { [def.atributo.chave]: def.atributo.ganho } : undefined,
  });
  await repo.incrementarProgressoEventos(sessao.tenantId, "servico_contratado");

  revalidatePath("/hub");
  revalidatePath("/painel");
  return { ok: true };
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("funcionario_ocupado")) {
    return "Um dos funcionários selecionados acabou de ser alocado em outro job.";
  }
  return "Não foi possível concluir. Tente novamente.";
}
