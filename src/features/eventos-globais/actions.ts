"use server";

import { revalidatePath } from "next/cache";
import { lerSessao, novoId } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { EVENTOS } from "@/features/gamificacao/engine";
import { agoraGlobal } from "@/features/historia/relogio";
import {
  atingiuMeta,
  eventosVisiveis,
  janelaValida,
  progressoDe,
  progressoPercentual,
  statusDe,
} from "./motor";
import type { EventoGlobal, NovoEventoGlobal, ProgressoEventoGlobal, StatusEvento } from "./tipos";

export interface ResultadoCriarEvento {
  ok: boolean;
  erro?: string;
  evento?: EventoGlobal;
}

/**
 * Cria um evento global. Gated por `sessao.role === "admin"` — quem não é
 * admin recebe erro do servidor, nunca só um botão escondido na UI (mesma
 * regra não-negociável do AGENTS.md para toda regra de negócio).
 */
export async function criarEventoGlobal(
  input: NovoEventoGlobal,
): Promise<ResultadoCriarEvento> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (sessao.role !== "admin") {
    return { ok: false, erro: "Você não tem permissão para criar eventos." };
  }

  const titulo = input.titulo.trim();
  const descricao = input.descricao.trim();
  if (!titulo) return { ok: false, erro: "Título obrigatório." };
  if (!descricao) return { ok: false, erro: "Descrição obrigatória." };
  if (!(input.objetivo in EVENTOS)) return { ok: false, erro: "Objetivo inválido." };
  if (!Number.isFinite(input.meta) || input.meta <= 0) {
    return { ok: false, erro: "Meta deve ser maior que zero." };
  }
  if (!janelaValida(input.inicioEm, input.fimEm)) {
    return { ok: false, erro: "A data de início deve ser antes da data de fim." };
  }
  if (input.recompensa.xp < 0 || input.recompensa.moeda < 0) {
    return { ok: false, erro: "Recompensa não pode ser negativa." };
  }

  const repo = getRepository();
  const evento = await repo.criarEventoGlobal({
    id: novoId(),
    titulo,
    descricao,
    objetivo: input.objetivo,
    meta: input.meta,
    inicioEm: input.inicioEm,
    fimEm: input.fimEm,
    recompensa: input.recompensa,
    criadoPor: sessao.email,
  });

  revalidatePath("/admin/eventos");
  revalidatePath("/hub");
  return { ok: true, evento };
}

export interface EventoComProgresso {
  evento: EventoGlobal;
  status: StatusEvento;
  progresso: ProgressoEventoGlobal | undefined;
  percentual: number;
  concluido: boolean;
}

/** Eventos visíveis ao jogador logado (ativos + agendados), já com o
 *  progresso DELE em cada um — uma chamada, não N+1. */
export async function listarEventosAtivos(): Promise<EventoComProgresso[]> {
  const sessao = await lerSessao();
  if (!sessao) return [];

  const repo = getRepository();
  const agora = agoraGlobal();
  const [eventos, progressos] = await Promise.all([
    repo.listarEventosGlobais(),
    repo.listarProgressoEventos(sessao.tenantId),
  ]);

  return eventosVisiveis(eventos, agora).map((evento) => {
    const progresso = progressoDe(progressos, evento.id);
    const contagem = progresso?.contagem ?? 0;
    return {
      evento,
      status: statusDe(evento, agora),
      progresso,
      percentual: progressoPercentual(contagem, evento.meta),
      concluido: atingiuMeta(contagem, evento.meta),
    };
  });
}

/** Só para a tela de admin: todo evento já criado, inclusive encerrado —
 *  é o "o que eu já cadastrei", sem progresso de nenhum tenant específico. */
export async function listarTodosEventos(): Promise<EventoGlobal[]> {
  const sessao = await lerSessao();
  if (!sessao || sessao.role !== "admin") return [];
  return getRepository().listarEventosGlobais();
}

export async function souAdminLogado(): Promise<boolean> {
  const sessao = await lerSessao();
  return sessao?.role === "admin";
}
