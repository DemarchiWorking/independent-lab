import type { ContextoNegocio, MetaDocumento, Secao } from "./tipos";
import { somarDias } from "./linguagem";
import { perfilDeMercado } from "./mercado";

/**
 * Peças comuns aos geradores: metadados de versão e a lista de "de onde saíram
 * os dados" que todo documento mostra ao dono.
 *
 * Os playbooks pedem documentação "com versionamento (data + autor)" e
 * "revisada a cada 90 dias" — por isso toda entrega nasce com versão, data,
 * autor e data da próxima revisão.
 */

/** Versão do conteúdo gerado. O dono sobe a versão quando revisa à mão. */
export const VERSAO_INICIAL = "1.0";

/** Intervalo de revisão: o ciclo de 90 dias do produto. */
export const DIAS_ATE_REVISAO = 90;

export function nomeDoAutor(cargo: string): string {
  return `${cargo} · labdatadev`;
}

/**
 * Lista de origem dos dados, em português simples. É a transparência que a
 * LGPD pede e a que o dono merece: ele vê exatamente o que a IA usou.
 */
export function baseadoEm(ctx: ContextoNegocio, usaPrivado: boolean): string[] {
  const p = perfilDeMercado(ctx.nicho);
  const itens = [
    "Nome, segmento, cidade e bairro do negócio",
    `Mercado identificado: ${p.rotulo}`,
  ];
  itens.push(
    ctx.ofertas.length > 0
      ? `${ctx.ofertas.length} ${ctx.ofertas.length === 1 ? "oferta publicada" : "ofertas publicadas"} no hub`
      : "Nenhuma oferta publicada no hub: usamos o perfil do mercado",
  );
  if (ctx.parceiros.length > 0) {
    itens.push(
      `${ctx.parceiros.length} ${ctx.parceiros.length === 1 ? "parceria formada" : "parcerias formadas"} com perfil público`,
    );
  }
  if (usaPrivado) {
    itens.push(
      ctx.privado.temOnboarding
        ? "Respostas do seu cadastro: objetivo, gargalo, equipe, presença digital, captação e investimento"
        : "Sem respostas de cadastro: usamos valores neutros (preencha o cadastro para um material mais certeiro)",
    );
  }
  return itens;
}

export function metaDoDocumento(
  ctx: ContextoNegocio,
  opcoes: { cargo: string; circulacao: MetaDocumento["circulacao"] },
): MetaDocumento {
  return {
    versao: VERSAO_INICIAL,
    geradoEm: ctx.agora,
    proximaRevisao: somarDias(ctx.agora, DIAS_ATE_REVISAO),
    autor: nomeDoAutor(opcoes.cargo),
    nivelAgente: ctx.nivel,
    baseadoEm: baseadoEm(ctx, opcoes.circulacao === "interno"),
    circulacao: opcoes.circulacao,
  };
}

/** Atalho para seção sem repetir o literal do objeto em todo gerador. */
export function secao(id: string, titulo: string, blocos: Secao["blocos"], intro?: string): Secao {
  return intro ? { id, titulo, intro, blocos } : { id, titulo, blocos };
}
