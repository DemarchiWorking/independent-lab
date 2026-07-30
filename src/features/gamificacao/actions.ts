"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { nivelPorXp } from "@/lib/gamificacao";
import { ATRIBUTO_LABEL, atributosFaltantes, mensagemRequisito } from "@/lib/atributos";
import { cargoPorId, GANHO_ATRIBUTO_CONTRATACAO } from "@/features/equipe-ia/catalogo";
import { jobPorId } from "@/features/marketplace/data";
import { jaAceitouTrabalho } from "@/features/marketplace/guarda";
import { EVENTOS, type EventoKey } from "./engine";
import type { AtributoChave } from "@tokens";

export interface ResultadoRecompensa {
  ok: boolean;
  erro?: string;
  ganhoXp?: number;
  ganhoMoeda?: number;
  subiuNivel?: boolean;
  nivel?: number;
  subiuDegrau?: boolean;
  degrauAtual?: number;
  /** qual eixo da economia de atributos subiu, se algum (feedback no toast) */
  atributoGanho?: { chave: AtributoChave; label: string; ganho: number };
}

/**
 * Aplica um evento de gamificação ao negócio do usuário logado.
 * As recompensas vêm do catálogo (`EVENTOS`) — a UI nunca escolhe valores.
 * O incremento é atômico no repositório; aqui só decidimos o delta.
 *
 * `contextoId` identifica QUAL entidade disparou o evento, quando o evento
 * sozinho não basta: cargo contratado (`funcionario_ia_contratado`) ou job
 * aceito (`servico_contratado`). Serve de guarda anti-farm — repetir a mesma
 * entidade não paga XP/moeda de novo (checado no servidor, nunca só na UI;
 * a garantia real é o `unique` na migration, isto aqui é a mensagem amigável).
 */
export async function recompensar(
  evento: EventoKey,
  contextoId?: string,
): Promise<ResultadoRecompensa> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const def = EVENTOS[evento];
  if (!def) return { ok: false, erro: "Evento inválido." };

  const repo = getRepository();
  const antes = await repo.lerNegocio(sessao.tenantId);
  if (!antes) return { ok: false, erro: "Negócio não encontrado." };

  if (evento === "funcionario_ia_contratado") {
    if (!contextoId) return { ok: false, erro: "Cargo não especificado." };
    const cargo = cargoPorId(contextoId);
    if (!cargo) return { ok: false, erro: "Cargo inválido." };
    if (antes.degrauAtual < cargo.degrauMinimo) {
      return {
        ok: false,
        erro: `Esse cargo é liberado a partir do degrau ${cargo.degrauMinimo}.`,
      };
    }
    const jaContratado = (await repo.listarFuncionarios(sessao.tenantId)).some(
      (f) => f.cargoId === contextoId,
    );
    if (jaContratado) {
      return { ok: false, erro: "Você já contratou esse cargo." };
    }
    const { criado } = await repo.contratarFuncionario(sessao.tenantId, contextoId);
    // GH-OPS M-10: o pré-check acima passou, mas entre ele e esta chamada
    // outra requisição pode ter contratado primeiro (duplo-clique, retry de
    // rede) — `criado: false` é essa corrida sendo pega DEPOIS da escrita,
    // não antes. Sem isto, as duas requisições pagariam XP/moeda.
    if (!criado) {
      return { ok: false, erro: "Você já contratou esse cargo." };
    }
  }

  if (evento === "servico_contratado") {
    if (!contextoId) return { ok: false, erro: "Job não especificado." };
    const job = jobPorId(contextoId);
    if (!job) return { ok: false, erro: "Job inválido." };
    const aceitos = await repo.listarTrabalhosAceitos(sessao.tenantId);
    if (jaAceitouTrabalho(aceitos, contextoId)) {
      return { ok: false, erro: "Você já aceitou esse trabalho." };
    }
    const faltantes = atributosFaltantes(antes.atributos, job.requisitos);
    if (faltantes.length > 0) {
      return { ok: false, erro: mensagemRequisito(faltantes) };
    }
    let criado: boolean;
    try {
      ({ criado } = await repo.aceitarTrabalho(sessao.tenantId, contextoId, job.requisitos));
    } catch (e) {
      return { ok: false, erro: traduzirErro(e) };
    }
    // mesma corrida de `funcionario_ia_contratado` acima, ver comentário lá
    if (!criado) {
      return { ok: false, erro: "Você já aceitou esse trabalho." };
    }
  }

  // "servico_desbloqueado" NÃO passa mais por aqui: desde GH-ARV-01 o custo
  // varia por nó (features/parcerias/data.ts) e precisa de checagem de saldo
  // + débito na MESMA transação — o dispatcher genérico deste arquivo não dá
  // conta disso (mesmo motivo de `comprarMobilia`/`evoluirSede` terem action
  // própria). Ver `features/parcerias/actions.ts` → `desbloquearNo()`.

  const nivelAntes = nivelPorXp(antes.xp);
  const subeDegrau = Boolean(def.subeDegrau) && antes.degrauAtual < 5;

  // Qual eixo ganha e quanto: eventos genéricos declaram no próprio catálogo
  // (EVENTOS); `funcionario_ia_contratado` é a exceção — o eixo depende do
  // CARGO contratado, não do evento em si (ver comentário em engine.ts).
  const atributoEvento =
    evento === "funcionario_ia_contratado" && contextoId
      ? { chave: cargoPorId(contextoId)!.eixoFortalecido, ganho: GANHO_ATRIBUTO_CONTRATACAO }
      : def.atributo;

  const depois = await repo.aplicarProgresso(sessao.tenantId, {
    xp: def.xp,
    moeda: def.moeda,
    degraus: subeDegrau ? 1 : 0,
    atributos: atributoEvento ? { [atributoEvento.chave]: atributoEvento.ganho } : undefined,
  });

  // Eventos globais (Épico 11): conta essa ação para qualquer campanha ativa
  // com esse objetivo. DEPOIS da recompensa base já aplicada com sucesso —
  // nunca antes (evita contar progresso de uma ação que falhou). No-op se
  // não houver campanha ativa com esse objetivo (a maioria das ações não
  // está dentro de nenhuma).
  await repo.incrementarProgressoEventos(sessao.tenantId, evento);

  revalidatePath("/painel");
  revalidatePath("/hub");

  return {
    ok: true,
    ganhoXp: def.xp,
    ganhoMoeda: def.moeda,
    subiuNivel: depois.nivel > nivelAntes,
    nivel: depois.nivel,
    subiuDegrau: depois.degrauAtual > antes.degrauAtual,
    degrauAtual: depois.degrauAtual,
    atributoGanho: atributoEvento
      ? {
          chave: atributoEvento.chave,
          label: ATRIBUTO_LABEL[atributoEvento.chave],
          ganho: atributoEvento.ganho,
        }
      : undefined,
  };
}

/** Mensagem amigável para erros lançados pelo repositório (GH-ATR-03). */
function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("atributo_insuficiente")) {
    return "Sua maturidade ainda não atende ao requisito deste trabalho.";
  }
  return "Não foi possível concluir. Tente novamente.";
}
