"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { nivelPorXp } from "@/lib/gamificacao";
import { ATRIBUTO_LABEL } from "@/lib/atributos";
import { agoraGlobal } from "@/features/historia/relogio";
import type { EventoKey } from "@/features/gamificacao/engine";
import type { AtributoChave } from "@tokens";
import { CATALOGO_CONTRATOS, contratoPorId } from "./catalogo";
import { situacaoDosContratos, validarConclusao } from "./motor";
import type { Evidencia, SituacaoContrato } from "./tipos";

export interface ResultadoContrato {
  ok: boolean;
  erro?: string;
  ganhoXp?: number;
  ganhoMoeda?: number;
  subiuNivel?: boolean;
  nivel?: number;
  atributoGanho?: { chave: AtributoChave; label: string; ganho: number };
}

/**
 * Contratos que também contam para campanhas globais (Épico 11). Antes eram
 * os eventos `diagnostico_agendado`/`retro_90d` do dispatcher `recompensar()`,
 * que pagavam quantas vezes o cliente pedisse — agora o contrato é o único
 * caminho, e conta para a campanha só quando de fato pagou.
 */
const EVENTO_DO_CONTRATO: Readonly<Record<string, EventoKey>> = {
  diagnostico: "diagnostico_agendado",
  "retro-90d": "retro_90d",
};

/** Lê o estado dos contratos do jogador logado (usado pelas páginas). */
export async function lerSituacaoContratos(): Promise<SituacaoContrato[] | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;

  const repo = getRepository();
  const [negocio, concluidos, ofertas, funcionarios] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.listarContratosConcluidos(sessao.tenantId),
    repo.listarOfertas(sessao.tenantId),
    repo.listarFuncionarios(sessao.tenantId),
  ]);
  if (!negocio) return null;

  const evidencia: Evidencia = {
    ofertasCriadasEm: ofertas.map((o) => o.criadaEm),
    tamanhoEquipe: funcionarios.length,
    degrauAtual: negocio.degrauAtual,
    degrauAlvo: negocio.degrauAlvo,
  };
  return situacaoDosContratos(
    CATALOGO_CONTRATOS,
    concluidos,
    evidencia,
    negocio.criadoEm,
    agoraGlobal(),
  );
}

/**
 * Cumpre um contrato e paga a recompensa.
 *
 * O cliente manda `contratoId` e, quando o contrato pede, um número. Todo o
 * resto — período, prova, quanto paga — vem do servidor. A garantia final
 * contra pagar duas vezes é a unique (tenant, contrato, período) dentro da
 * transação do repositório; a checagem do motor só dá a mensagem amigável.
 */
export async function cumprirContrato(
  contratoId: string,
  valor?: number,
): Promise<ResultadoContrato> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const contrato = contratoPorId(contratoId);
  if (!contrato) return { ok: false, erro: "Contrato inválido." };

  const repo = getRepository();
  const [negocio, concluidos, ofertas, funcionarios] = await Promise.all([
    repo.lerNegocio(sessao.tenantId),
    repo.listarContratosConcluidos(sessao.tenantId),
    repo.listarOfertas(sessao.tenantId),
    repo.listarFuncionarios(sessao.tenantId),
  ]);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };

  const validacao = validarConclusao(
    contrato,
    concluidos,
    {
      ofertasCriadasEm: ofertas.map((o) => o.criadaEm),
      tamanhoEquipe: funcionarios.length,
      degrauAtual: negocio.degrauAtual,
      degrauAlvo: negocio.degrauAlvo,
    },
    negocio.criadoEm,
    agoraGlobal(),
    valor,
  );
  if (!validacao.ok) return { ok: false, erro: validacao.erro };

  const { recompensa } = contrato;
  const nivelAntes = nivelPorXp(negocio.xp);

  let resultado;
  try {
    resultado = await repo.concluirContrato(
      sessao.tenantId,
      contrato.id,
      validacao.periodo,
      validacao.valor,
      {
        xp: recompensa.xp,
        moeda: recompensa.moeda,
        degraus: 0,
        atributos: recompensa.atributos,
      },
    );
  } catch {
    return { ok: false, erro: "Não foi possível concluir. Tente novamente." };
  }
  if (resultado.jaConcluido) {
    return { ok: false, erro: "Contrato já cumprido neste período." };
  }

  const evento = EVENTO_DO_CONTRATO[contrato.id];
  if (evento) await repo.incrementarProgressoEventos(sessao.tenantId, evento);

  revalidatePath("/hub");
  revalidatePath("/painel");

  const depois = await repo.lerNegocio(sessao.tenantId);
  const [chave, ganho] = Object.entries(recompensa.atributos ?? {})[0] ?? [];
  return {
    ok: true,
    ganhoXp: recompensa.xp,
    ganhoMoeda: recompensa.moeda,
    subiuNivel: depois ? depois.nivel > nivelAntes : false,
    nivel: depois?.nivel,
    atributoGanho:
      chave && ganho
        ? {
            chave: chave as AtributoChave,
            label: ATRIBUTO_LABEL[chave as AtributoChave],
            ganho,
          }
        : undefined,
  };
}
