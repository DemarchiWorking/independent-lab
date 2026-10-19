import type { Negocio, Oferta, Onboarding, Respostas } from "@/lib/db/types";
import { nomeParaTexto, textoLivre, umaLinha } from "./linguagem";
import { inferirNicho } from "./mercado";
import { nivelValido, type ContextoNegocio, type OfertaPublica, type ParceiroPublico } from "./tipos";

/**
 * Entrada do gerador: o que sabemos do negócio do usuário LOGADO, já limpo.
 *
 * Esta é a única porta de entrada de dados dos geradores, e é aqui que três
 * garantias são dadas:
 *
 * 1. SEPARAÇÃO público × privado. `ofertas` e `parceiros` são informação que
 *    o próprio dono publicou; `privado` são as respostas do cadastro. Gerador
 *    de material voltado ao cliente só recebe o contexto "público" (ver
 *    `contextoPublico`), então um gargalo declarado em segredo não consegue
 *    vazar para um post por descuido.
 * 2. LIMITES. Todo texto livre (nome, oferta) entra truncado e em uma linha.
 *    Um nome de negócio com 10 mil caracteres ou quebras de linha não
 *    estoura slide, mensagem nem documento.
 * 3. DETERMINISMO. O relógio chega por parâmetro (`agora`); a função é pura.
 *
 * Quem lê o repositório (e confere a sessão) é `servico.ts`; aqui só
 * transformamos dados.
 */

export interface EntradaContexto {
  negocio: Negocio;
  onboarding: Onboarding | null;
  ofertas: readonly Oferta[];
  /** negócios com parceria formada. O chamador filtra quem aceitou perfil público. */
  parceiros: readonly Negocio[];
  nivelAgente: number;
  agora: string;
}

const MAX_OFERTAS = 5;
const MAX_PARCEIROS = 5;

/** `barra-do-pirai` → `Barra Do Pirai`. Só para o caminho sem onboarding. */
function humanizarSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function ofertaPublica(o: Oferta): OfertaPublica {
  return {
    titulo: umaLinha(textoLivre(o.titulo, 80)),
    descricao: umaLinha(textoLivre(o.descricao, 240)),
    preco: umaLinha(textoLivre(o.preco, 40)),
  };
}

/** Respostas neutras para negócio sem onboarding (seed, demonstração). */
function respostasNeutras(negocio: Negocio): Respostas {
  return {
    nomeNegocio: negocio.nome,
    segmento: negocio.segmento,
    cidade: humanizarSlug(negocio.endereco.cidadeSlug),
    bairro: humanizarSlug(negocio.endereco.bairroSlug),
    equipe: "so-eu",
    presencaDigital: "nada",
    captacao: [],
    objetivo: "mais-leads",
    gargalo: "perco-leads",
    investimento: "nao-sei",
  };
}

export function montarContexto(entrada: EntradaContexto): ContextoNegocio {
  const { negocio, onboarding } = entrada;
  const respostas = onboarding?.respostas ?? respostasNeutras(negocio);

  const ofertas = [...entrada.ofertas]
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    .slice(0, MAX_OFERTAS)
    .map(ofertaPublica)
    .filter((o) => o.titulo.length > 0);

  const parceiros: ParceiroPublico[] = entrada.parceiros
    .slice(0, MAX_PARCEIROS)
    .map((p) => ({ nome: nomeParaTexto(p.nome), segmento: p.segmento }));

  const nome = nomeParaTexto(negocio.nome);

  return {
    nome,
    segmento: negocio.segmento,
    nicho: inferirNicho(negocio.segmento, nome, ofertas),
    cidade: umaLinha(textoLivre(respostas.cidade, 60)),
    bairro: umaLinha(textoLivre(respostas.bairro, 60)),
    ofertas,
    parceiros,
    privado: {
      equipe: respostas.equipe,
      presencaDigital: respostas.presencaDigital,
      captacao: [...respostas.captacao],
      objetivo: respostas.objetivo,
      gargalo: respostas.gargalo,
      investimento: respostas.investimento,
      degrau: negocio.degrauAtual,
      temOnboarding: onboarding !== null,
    },
    nivel: nivelValido(entrada.nivelAgente),
    agora: entrada.agora,
  };
}

/**
 * Visão do contexto SEM os dados privados, para geradores de material público
 * (carrossel, vídeo). O tipo não tem o campo `privado`: se um gerador tentar
 * ler `ctx.privado`, o compilador reprova.
 */
export type ContextoPublico = Omit<ContextoNegocio, "privado">;

export function contextoPublico(ctx: ContextoNegocio): ContextoPublico {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `privado` sai de propósito
  const { privado: _privado, ...publico } = ctx;
  return publico;
}
