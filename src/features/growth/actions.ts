"use server";

import { headers } from "next/headers";
import { getRepository } from "@/lib/db";
import { lerSessao } from "@/lib/auth/sessao";
import { gerarTokenConvite } from "./convite";

export interface ResultadoContato {
  ok: boolean;
  erro?: string;
}

export interface ResultadoLinkConvite {
  ok: boolean;
  url?: string;
  erro?: string;
}

/**
 * Gera o link de convite do negócio logado (GH-GROW-02) — o dono copia e
 * compartilha por conta própria (WhatsApp, o que for). O app NUNCA envia
 * e-mail em nome dele — regra de segurança explícita do card.
 */
export async function gerarLinkConvite(): Promise<ResultadoLinkConvite> {
  const sessao = await lerSessao();
  if (!sessao) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const repo = getRepository();
  const negocio = await repo.lerNegocio(sessao.tenantId);
  if (!negocio) return { ok: false, erro: "Negócio não encontrado." };

  const mapa = await repo.lerMapa();
  const cidade = mapa.cidades.find((c) => c.slug === negocio.endereco.cidadeSlug);
  const bairro = cidade?.bairros.find((b) => b.slug === negocio.endereco.bairroSlug);

  const token = gerarTokenConvite({
    tenantId: negocio.id,
    cidadeNome: cidade?.nome ?? negocio.endereco.cidadeSlug,
    bairroNome: bairro?.nome ?? negocio.endereco.bairroSlug,
    criadoEm: new Date().toISOString(),
  });

  return { ok: true, url: `/cadastro?convite=${token}` };
}

const JANELA_MS = 10 * 60_000; // 10 minutos
const LIMITE_NA_JANELA = 3;

/**
 * Rate limit em memória (por processo) — mesmo espírito "sem infra que não
 * precisa" do resto do projeto (ver AGENTS.md): esta app roda 1 processo
 * PM2 atrás do Nginx, não múltiplas instâncias atrás de load balancer, então
 * um Map local já resolve o caso real. Se um dia isso escalar horizontalmente,
 * vira Redis — não antes.
 */
const tentativas = new Map<string, number[]>();

function limitado(chave: string): boolean {
  const agora = Date.now();
  const historico = (tentativas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  tentativas.set(chave, historico);
  return historico.length >= LIMITE_NA_JANELA;
}

function registrar(chave: string): void {
  const historico = tentativas.get(chave) ?? [];
  historico.push(Date.now());
  tentativas.set(chave, historico);
}

async function ip(): Promise<string> {
  const h = await headers();
  // atrás do Nginx (ver deploy/README.md) — primeiro IP da lista é o cliente real
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

/**
 * Envia uma solicitação de contato a partir da página pública de um negócio
 * (GH-GROW-01). Nunca expõe e-mail/telefone do dono — o visitante deixa o
 * PRÓPRIO contato, o dono lê depois de dentro da própria conta.
 *
 * Rate limit por (tenant visitado, IP do visitante) — não por sessão, pois
 * quem envia normalmente não tem conta nenhuma (é a vitrine pública).
 */
export async function enviarSolicitacaoContato(
  tenantId: string,
  nomeRemetente: string,
  contatoRemetente: string,
  mensagem: string,
): Promise<ResultadoContato> {
  const nome = nomeRemetente.trim();
  const contato = contatoRemetente.trim();
  const texto = mensagem.trim();
  if (!nome || !contato || !texto) {
    return { ok: false, erro: "Preencha nome, contato e mensagem." };
  }
  if (texto.length > 2000) {
    return { ok: false, erro: "Mensagem muito longa." };
  }

  const repo = getRepository();
  const negocio = await repo.lerNegocio(tenantId);
  if (!negocio || !negocio.perfilPublico) {
    return { ok: false, erro: "Negócio não encontrado." };
  }

  const chave = `${tenantId}:${await ip()}`;
  if (limitado(chave)) {
    return {
      ok: false,
      erro: "Muitas mensagens em pouco tempo. Tente novamente mais tarde.",
    };
  }

  await repo.criarSolicitacaoContato({
    tenantId,
    nomeRemetente: nome,
    contatoRemetente: contato,
    mensagem: texto,
  });
  registrar(chave);

  return { ok: true };
}
