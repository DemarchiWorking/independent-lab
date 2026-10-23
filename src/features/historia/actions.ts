"use server";

import { revalidatePath } from "next/cache";
import { lerSessao } from "@/lib/auth/sessao";
import { getRepository } from "@/lib/db";
import { CATALOGO_HISTORIA } from "./catalogo";
import {
  capituloPorId,
  capitulosPendentes,
  deltaDaEscolha,
  escolhaPorId,
  proximoCapitulo,
} from "./motor";
import { agoraGlobal, diaDoNegocio } from "./relogio";
import type { Capitulo, EstadoNarrativo } from "./tipos";

export interface ResultadoHistoria {
  ok: boolean;
  erro?: string;
  /** desfecho narrativo da escolha, para mostrar no toast/painel */
  desfecho?: string;
  documento?: string;
}

/**
 * Monta o snapshot narrativo do jogador a partir do que já persistimos.
 *
 * O `agora` vem de `new Date()` **no servidor**. Isso não é detalhe de estilo:
 * é a defesa contra forjar tempo decorrido (EVOLUCAO-MOTOR-2026 §7.4). Nenhuma
 * função deste módulo aceita "agora" vindo do cliente.
 */
async function montarEstado(tenantId: string): Promise<{
  estado: EstadoNarrativo;
  agora: string;
  moedaVirtual: number;
} | null> {
  const repo = getRepository();
  const [negocio, funcionarios, entregues] = await Promise.all([
    repo.lerNegocio(tenantId),
    repo.listarFuncionarios(tenantId),
    repo.listarCapitulosEntregues(tenantId),
  ]);
  if (!negocio) return null;

  return {
    agora: agoraGlobal(),
    moedaVirtual: negocio.moedaVirtual,
    estado: {
      criadoEm: negocio.criadoEm,
      xp: negocio.xp,
      degrauAtual: negocio.degrauAtual,
      atributos: negocio.atributos,
      segmento: negocio.segmento,
      tamanhoEquipe: funcionarios.length,
      cargosContratados: new Set(funcionarios.map((f) => f.cargoId)),
      capitulosEntregues: new Set(entregues.map((c) => c.capituloId)),
      capitulosResolvidos: new Set(
        entregues.filter((c) => c.escolhaId).map((c) => c.capituloId),
      ),
    },
  };
}

export interface CapituloAberto {
  capitulo: Capitulo;
  /** saldo atual — a UI desabilita a escolha que o jogador não consegue pagar */
  moedaVirtual: number;
  /** dias de vida do negócio — o "dia da campanha" */
  diaDoNegocio: number;
}

/**
 * O capítulo que o jogador precisa ver agora, se houver.
 *
 * Chamada em toda carga de página do hub/World — é o relógio *lazy* em ação:
 * a narrativa avança porque o tempo passou, sem cron e sem processo de fundo.
 * A entrega é registrada aqui (idempotente) para o capítulo não "sumir" se o
 * jogador recarregar antes de escolher.
 */
export async function capituloAtual(): Promise<CapituloAberto | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;

  const ctx = await montarEstado(sessao.tenantId);
  if (!ctx) return null;

  const repo = getRepository();

  // 1) capítulo já entregue e ainda não resolvido tem prioridade — o jogador
  //    não perde uma carta por ter recarregado a página
  const entregues = await repo.listarCapitulosEntregues(sessao.tenantId);
  const pendente = entregues.find((c) => !c.escolhaId);
  if (pendente) {
    const cap = capituloPorId(CATALOGO_HISTORIA, pendente.capituloId);
    if (cap) {
      return {
        capitulo: cap,
        moedaVirtual: ctx.moedaVirtual,
        diaDoNegocio: diaDoNegocio(ctx.estado.criadoEm, ctx.agora),
      };
    }
  }

  // 2) senão, o próximo que o relógio destravou
  const proximo = proximoCapitulo(CATALOGO_HISTORIA, ctx.estado, ctx.agora);
  if (!proximo) return null;

  await repo.entregarCapitulo(sessao.tenantId, proximo.id);
  return {
    capitulo: proximo,
    moedaVirtual: ctx.moedaVirtual,
    diaDoNegocio: diaDoNegocio(ctx.estado.criadoEm, ctx.agora),
  };
}

/**
 * Registra a escolha do jogador e aplica o efeito.
 *
 * Validação em camadas, como no resto do projeto: o catálogo é a fonte do
 * efeito (o cliente manda só ids, nunca valores), e a RPC recusa capítulo já
 * resolvido — então reenviar a requisição não refarma recompensa.
 */
export async function escolherNoCapitulo(
  capituloId: string,
  escolhaId: string,
): Promise<ResultadoHistoria> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const capitulo = capituloPorId(CATALOGO_HISTORIA, capituloId);
  if (!capitulo) return { ok: false, erro: "Capítulo inválido." };

  const escolha = escolhaPorId(capitulo, escolhaId);
  if (!escolha) return { ok: false, erro: "Escolha inválida." };

  const repo = getRepository();

  // O capítulo precisa TER CHEGADO: já entregue a este jogador, ou com o
  // gatilho atendido agora (relógio do servidor). Sem isto, qualquer usuário
  // logado chamava a action com o id de um capítulo futuro — `retro-30` no
  // dia 0 — e coletava XP/moeda de toda a história de uma vez.
  const ctx = await montarEstado(sessao.tenantId);
  if (!ctx) return { ok: false, erro: "Negócio não encontrado." };
  const chegou =
    ctx.estado.capitulosEntregues.has(capituloId) ||
    capitulosPendentes(CATALOGO_HISTORIA, ctx.estado, ctx.agora).some(
      (c) => c.id === capituloId,
    );
  if (!chegou) return { ok: false, erro: "Esse capítulo ainda não chegou até você." };

  // Escolha que custa moeda exige saldo. Sem esta checagem o piso em zero do
  // `aplicarProgresso` transformava "gastar 🪙 300 com 🪙 10" em escolha
  // GRÁTIS — o custo existia só na etiqueta.
  const custo = escolha.efeito.moeda && escolha.efeito.moeda < 0 ? -escolha.efeito.moeda : 0;
  if (custo > ctx.moedaVirtual) {
    return {
      ok: false,
      erro: `Você precisa de 🪙 ${custo} para essa decisão (tem ${ctx.moedaVirtual}). Escolha outra ou cumpra contratos para juntar moeda.`,
    };
  }

  // garante a entrega antes de resolver — cobre o caso de alguém chamar a
  // action direto, sem ter passado por `capituloAtual`
  await repo.entregarCapitulo(sessao.tenantId, capituloId);

  try {
    await repo.resolverCapitulo(
      sessao.tenantId,
      capituloId,
      escolhaId,
      deltaDaEscolha(escolha.efeito),
    );
  } catch (e) {
    return { ok: false, erro: traduzirErro(e) };
  }

  revalidatePath("/hub");
  revalidatePath("/world");
  revalidatePath("/painel");

  return {
    ok: true,
    desfecho: escolha.desfecho,
    documento: escolha.efeito.documento,
  };
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("capitulo_ja_resolvido")) {
    return "Você já decidiu esse capítulo.";
  }
  if (msg.includes("capitulo_nao_entregue")) {
    return "Esse capítulo ainda não chegou até você.";
  }
  return "Não foi possível registrar sua escolha. Tente novamente.";
}
