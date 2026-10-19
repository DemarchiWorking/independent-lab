"use server";

import { revalidatePath } from "next/cache";
import { lerSessao, novoId } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { souAdmin } from "@/lib/admin";
import { agoraGlobal } from "@/features/historia/relogio";
import {
  atingiuMeta,
  eventosVisiveis,
  progressoDe,
  progressoPercentual,
  statusDe,
} from "./motor";
import { validarNovoEvento } from "./validacao";
import type { EventoGlobal, NovoEventoGlobal, ProgressoEventoGlobal, StatusEvento } from "./tipos";

/** O que o jogador recebe de um evento: sem o e-mail de quem criou. */
export type EventoParaJogador = Omit<EventoGlobal, "criadoPor">;

export interface ResultadoCriarEvento {
  ok: boolean;
  erro?: string;
  evento?: EventoGlobal;
}

/**
 * Cria um evento global. Gated por `souAdmin(sessao.email)` — quem não está
 * na allowlist recebe erro do servidor, nunca só um botão escondido na UI
 * (mesma regra não-negociável do AGENTS.md para toda regra de negócio).
 */
export async function criarEventoGlobal(
  input: NovoEventoGlobal,
): Promise<ResultadoCriarEvento> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!souAdmin(sessao.email)) {
    return { ok: false, erro: "Você não tem permissão para criar eventos." };
  }

  const erro = validarNovoEvento(input);
  if (erro) return { ok: false, erro };

  const { xp, moeda, atributo } = input.recompensa;
  const repo = getRepository();
  const evento = await repo.criarEventoGlobal({
    id: novoId(),
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    objetivo: input.objetivo,
    meta: input.meta,
    inicioEm: input.inicioEm,
    fimEm: input.fimEm,
    // Copia campo a campo: nada além do que foi validado chega ao banco.
    recompensa: atributo ? { xp, moeda, atributo: { chave: atributo.chave, ganho: atributo.ganho } } : { xp, moeda },
    criadoPor: sessao.email,
  });

  revalidatePath("/admin/eventos");
  revalidatePath("/hub");
  return { ok: true, evento };
}

export interface EventoComProgresso {
  evento: EventoParaJogador;
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

  return eventosVisiveis(eventos, agora).map(({ criadoPor: _criadoPor, ...evento }) => {
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
  if (!sessao || !souAdmin(sessao.email)) return [];
  return getRepository().listarEventosGlobais();
}

export async function souAdminLogado(): Promise<boolean> {
  const sessao = await lerSessao();
  return Boolean(sessao && souAdmin(sessao.email));
}
