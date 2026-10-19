"use server";

import { getRepository } from "@/lib/db";
import { lerSessao } from "@/lib/auth/sessao";
import { Limitador } from "@/lib/limite";
import { ipDoCliente } from "@/lib/requisicao";
import { textoLimitado } from "@/lib/validacao";
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

/**
 * Limite de mensagens por (negócio visitado, IP do visitante): 3 a cada 10
 * minutos. Ver `lib/limite.ts` (Map com expiração) e `lib/requisicao.ts`
 * (IP confiável atrás do Caddy).
 */
const contatoPorIp = new Limitador(10 * 60_000, 3);

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
  const nome = textoLimitado(nomeRemetente, 80);
  const contato = textoLimitado(contatoRemetente, 120);
  const texto = textoLimitado(mensagem, 2000);
  if (nome === null || contato === null || texto === null) {
    return { ok: false, erro: "Nome até 80, contato até 120 e mensagem até 2000 caracteres." };
  }
  if (!nome || !contato || !texto) {
    return { ok: false, erro: "Preencha nome, contato e mensagem." };
  }
  if (typeof tenantId !== "string") return { ok: false, erro: "Negócio não encontrado." };

  const repo = getRepository();
  const negocio = await repo.lerNegocio(tenantId);
  if (!negocio || !negocio.perfilPublico) {
    return { ok: false, erro: "Negócio não encontrado." };
  }

  if (!contatoPorIp.consumir(`${tenantId}:${await ipDoCliente()}`)) {
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

  return { ok: true };
}
